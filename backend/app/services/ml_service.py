"""
Backend ML service - loads the trained breed classifier and runs inference.

Primary runtime is PyTorch: `ml-service/train.py` exports a frozen TorchScript
graph, so this module needs `torch` only (no torchvision) at inference time.
A TensorFlow `.h5` model is still accepted when one exists and TF is importable,
which keeps older exports working on Python <= 3.12.

If no trained model is present the predictor stays in `model-missing` mode and
`predict()` raises ModelUnavailableError - the API turns that into a 503 rather
than inventing a breed.

Return schema:
  primary_breed, secondary_breed, confidence, crossbreed_ratio,
  all_probabilities / all_predictions, top_predictions, model_mode
"""

from __future__ import annotations

import json
import logging
import os
from io import BytesIO
from pathlib import Path

import numpy as np
from fastapi import Request
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_LABELS = ["Crossbreed", "Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
LIVESTOCK_IMAGENET_KEYWORDS = (
    "ox",
    "bull",
    "cow",
    "calf",
    "cattle",
    "water_buffalo",
    "buffalo",
    "bison",
    "yak",
)

try:
    import torch

    TORCH_AVAILABLE = True
except ImportError:  # pragma: no cover - environment guard
    TORCH_AVAILABLE = False
    logger.warning("PyTorch is not installed - the trained breed model cannot be loaded.")

try:
    from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small

    TORCHVISION_AVAILABLE = True
except ImportError:  # pragma: no cover - optional livestock gate
    TORCHVISION_AVAILABLE = False

try:
    import tensorflow as tf

    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


class ModelUnavailableError(RuntimeError):
    """Raised when a real trained model is required but not available."""


class LivestockValidationError(ValueError):
    """Raised when the image does not appear to contain supported livestock."""

    def __init__(self, message: str, gate_result: dict):
        super().__init__(message)
        self.gate_result = gate_result


TRAIN_HINT = (
    "Train one first: `python ml-service/scripts/download_dataset.py`, "
    "`python ml-service/scripts/prepare_dataset.py`, then `python ml-service/train.py`."
)


class BreedPredictor:
    def __init__(self, model_path: str, class_index_path: str, meta_path: str | None = None):
        self.model_path = str(self._resolve_path(model_path))
        self.class_index_path = str(self._resolve_path(class_index_path))
        self.meta_path = str(self._resolve_path(meta_path)) if meta_path else self._default_meta_path()

        self.meta = self._load_meta()
        self.img_size = int(self.meta.get("img_size", 224))
        self.resize_ratio = float(self.meta.get("resize_ratio", 1.14))
        self.mean = np.array(self.meta.get("mean", IMAGENET_MEAN), dtype=np.float32)
        self.std = np.array(self.meta.get("std", IMAGENET_STD), dtype=np.float32)

        self.labels = self._load_labels()
        self.model = None
        self.gate_model = None
        self.gate_preprocess = None
        self.gate_categories = None
        self.mode = "model-missing"
        self.unavailable_reason = ""

        self._load_model()

    # ── path / metadata helpers ─────────────────────────────────────────────

    def _resolve_path(self, value: str) -> Path:
        path = Path(value)
        if path.is_absolute():
            return path
        cwd_path = Path.cwd() / path
        if cwd_path.exists():
            return cwd_path
        repo_root = Path(__file__).resolve().parents[3]
        return repo_root / path

    def _default_meta_path(self) -> str:
        return str(Path(self.model_path).with_name("model_meta.json"))

    def _load_meta(self) -> dict:
        try:
            with open(self.meta_path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except (OSError, json.JSONDecodeError):
            return {}

    def _load_labels(self) -> list[str]:
        # train.py writes both class_names.json (list) and class_indices.json (map).
        candidates = [self.class_index_path, str(Path(self.model_path).with_name("class_names.json"))]

        for candidate in candidates:
            if not candidate or not os.path.exists(candidate):
                continue
            try:
                with open(candidate, "r", encoding="utf-8") as handle:
                    data = json.load(handle)
            except (OSError, json.JSONDecodeError):
                continue

            if isinstance(data, list) and data:
                return [str(item) for item in data]
            if isinstance(data, dict) and data:
                # {"Breed": index} -> ordered by index
                return [label for label, _ in sorted(data.items(), key=lambda item: item[1])]

        return DEFAULT_LABELS.copy()

    # ── model loading ───────────────────────────────────────────────────────

    def _load_model(self) -> None:
        suffix = Path(self.model_path).suffix.lower()
        exists = os.path.exists(self.model_path)

        if suffix == ".pt" and exists and TORCH_AVAILABLE:
            try:
                self.model = torch.jit.load(self.model_path, map_location="cpu")
                self.model.eval()
                self.mode = "pytorch"
                logger.info(
                    "BreedPredictor loaded TorchScript model (%s classes, %s) from %s",
                    len(self.labels), self.meta.get("arch", "unknown"), self.model_path,
                )
                return
            except Exception as exc:
                self.unavailable_reason = f"Could not load TorchScript model: {exc}"
                logger.error("%s", self.unavailable_reason)

        elif suffix in {".h5", ".keras"} and exists and TF_AVAILABLE:
            try:
                self.model = tf.keras.models.load_model(self.model_path)
                self.mode = "tensorflow"
                logger.info("BreedPredictor loaded TensorFlow model from %s", self.model_path)
                return
            except Exception as exc:
                self.unavailable_reason = f"Could not load TensorFlow model: {exc}"
                logger.error("%s", self.unavailable_reason)

        if not self.unavailable_reason:
            if not exists:
                self.unavailable_reason = f"Model file is missing at {self.model_path}."
            elif suffix == ".pt":
                self.unavailable_reason = "PyTorch is not installed for this Python version."
            else:
                self.unavailable_reason = f"No runtime available to load {self.model_path}."

        logger.warning("%s %s", self.unavailable_reason, TRAIN_HINT)

    # ── preprocessing ───────────────────────────────────────────────────────

    def preprocess(self, pil_image: Image.Image) -> np.ndarray:
        """Resize-shorter-side then centre-crop, matching train.py's eval transform."""
        img = pil_image.convert("RGB")

        target_short = int(round(self.img_size * self.resize_ratio))
        width, height = img.size
        if width < height:
            new_w = target_short
            new_h = max(1, int(round(height * target_short / width)))
        else:
            new_h = target_short
            new_w = max(1, int(round(width * target_short / height)))
        img = img.resize((new_w, new_h), Image.BILINEAR)

        left = max(0, (new_w - self.img_size) // 2)
        top = max(0, (new_h - self.img_size) // 2)
        img = img.crop((left, top, left + self.img_size, top + self.img_size))

        arr = np.asarray(img, dtype=np.float32) / 255.0
        arr = (arr - self.mean) / self.std
        return np.transpose(arr, (2, 0, 1))[None, ...]  # NCHW

    # ── inference ───────────────────────────────────────────────────────────

    def _probabilities(self, pil_image: Image.Image) -> np.ndarray:
        if self.mode == "pytorch":
            tensor = torch.from_numpy(self.preprocess(pil_image))
            with torch.no_grad():
                logits = self.model(tensor)
            return torch.softmax(logits, dim=1)[0].cpu().numpy()

        if self.mode == "tensorflow":
            arr = np.asarray(pil_image.convert("RGB").resize((self.img_size, self.img_size)), dtype=np.float32)
            arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
            probs = self.model.predict(arr[None, ...], verbose=0)[0]
            return np.asarray(probs, dtype=np.float32)

        raise ModelUnavailableError(f"{self.unavailable_reason} {TRAIN_HINT}")

    def _load_gate_model(self):
        if self.gate_model is not None:
            return self.gate_model
        if TORCHVISION_AVAILABLE and TORCH_AVAILABLE:
            try:
                weights = MobileNet_V3_Small_Weights.DEFAULT
                model = mobilenet_v3_small(weights=weights)
                model.eval()
                self.gate_model = ("torchvision", model)
                self.gate_preprocess = weights.transforms()
                self.gate_categories = weights.meta.get("categories", [])
                return self.gate_model
            except Exception as exc:  # pragma: no cover - external model/cache
                logger.warning("TorchVision livestock gate unavailable: %s", exc)

        if not TF_AVAILABLE:
            self.gate_model = False
            return None
        try:
            self.gate_model = ("tensorflow", tf.keras.applications.MobileNetV2(weights="imagenet"))
        except Exception as exc:  # pragma: no cover - external model/cache
            logger.warning("Livestock gate unavailable: %s", exc)
            self.gate_model = False
        return self.gate_model if self.gate_model is not False else None

    def validate_livestock(self, pil_image: Image.Image) -> dict:
        """Use an ImageNet MobileNet gate to reject obvious non-cattle images."""
        if not settings.LIVESTOCK_GATE_ENABLED:
            return {"is_livestock": True, "status": "disabled", "score": None}

        gate_model = self._load_gate_model()
        if gate_model is None:
            return {"is_livestock": True, "status": "unavailable", "score": None}

        matches = []
        score = 0.0

        try:
            provider = gate_model[0] if isinstance(gate_model, tuple) else "tensorflow"
            if provider == "torchvision":
                _, model = gate_model
                tensor = self.gate_preprocess(pil_image.convert("RGB")).unsqueeze(0)
                with torch.no_grad():
                    probs = torch.softmax(model(tensor), dim=1)[0]
                top_probs, top_indices = torch.topk(probs, k=8)
                decoded = [
                    (self.gate_categories[int(idx)], float(prob))
                    for prob, idx in zip(top_probs, top_indices)
                ]
            else:
                _, model = gate_model
                arr = np.asarray(pil_image.convert("RGB").resize((224, 224)), dtype=np.float32)
                arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
                preds = model.predict(arr[None, ...], verbose=0)
                decoded = [
                    (label, float(raw_score))
                    for _, label, raw_score in tf.keras.applications.mobilenet_v2.decode_predictions(preds, top=8)[0]
                ]
        except Exception as exc:  # pragma: no cover - depends on model cache/network
            logger.warning("Livestock gate inference unavailable: %s", exc)
            return {"is_livestock": True, "status": "unavailable", "score": None}

        for label, raw_score in decoded:
            label_key = str(label).lower()
            item = {"label": label, "score": round(float(raw_score), 4)}
            if any(keyword in label_key for keyword in LIVESTOCK_IMAGENET_KEYWORDS):
                matches.append(item)
                score += float(raw_score)

        threshold = float(settings.LIVESTOCK_GATE_THRESHOLD)
        is_livestock = score >= threshold
        return {
            "is_livestock": is_livestock,
            "status": "checked",
            "score": round(score, 4),
            "threshold": threshold,
            "matches": matches,
            "top_labels": [
                {"label": label, "score": round(float(raw_score), 4)}
                for label, raw_score in decoded[:5]
            ],
        }

    def predict(self, image_bytes: bytes) -> dict:
        """Run breed classification on raw image bytes."""
        if self.model is None:
            raise ModelUnavailableError(f"{self.unavailable_reason} {TRAIN_HINT}")

        try:
            pil_image = Image.open(BytesIO(image_bytes))
            pil_image.load()
        except Exception as exc:
            raise ValueError(f"Could not decode image: {exc}") from exc

        gate = self.validate_livestock(pil_image)
        if not gate.get("is_livestock", True):
            raise LivestockValidationError(
                "Please upload a clear photo containing only a cow, bull, calf, or buffalo.",
                gate,
            )

        probs = self._probabilities(pil_image)

        labels = self.labels
        if len(labels) != len(probs):
            logger.warning(
                "Label count (%s) does not match model outputs (%s); falling back to indices.",
                len(labels), len(probs),
            )
            labels = [f"class_{i}" for i in range(len(probs))]

        order = np.argsort(probs)[::-1]
        primary_idx = int(order[0])
        secondary_idx = int(order[1]) if len(order) > 1 else primary_idx

        primary_conf = float(probs[primary_idx])
        secondary_conf = float(probs[secondary_idx]) if secondary_idx != primary_idx else 0.0
        probability_map = {labels[i]: round(float(probs[i]) * 100, 2) for i in range(len(probs))}
        top_predictions = [
            {"breed": labels[int(i)], "confidence": round(float(probs[int(i)]) * 100, 2)}
            for i in order[:5]
        ]
        min_conf = float(settings.MIN_PREDICTION_CONFIDENCE)
        if primary_conf < min_conf:
            raise LivestockValidationError(
                "Please upload a clear cow or buffalo photo. The image is too uncertain for a reliable livestock breed result.",
                {
                    **gate,
                    "status": "low_confidence",
                    "score": round(primary_conf, 4),
                    "threshold": min_conf,
                    "closest_candidate": labels[primary_idx],
                    "closest_confidence": round(primary_conf * 100, 2),
                    "top_predictions": top_predictions,
                },
            )

        total = primary_conf + secondary_conf
        crossbreed_ratio = round(secondary_conf / total, 3) if total > 0 else 0.0

        return {
            "primary_breed": labels[primary_idx],
            "secondary_breed": labels[secondary_idx],
            "confidence": round(primary_conf * 100, 2),
            "crossbreed_ratio": crossbreed_ratio,
            "all_probabilities": probability_map,
            "all_predictions": probability_map,
            "top_predictions": top_predictions,
            "confidence_format": "percent",
            "model_mode": self.mode,
            "model_arch": self.meta.get("arch"),
            "livestock_gate": gate,
        }


def get_predictor(request: Request) -> BreedPredictor:
    return request.app.state.predictor
