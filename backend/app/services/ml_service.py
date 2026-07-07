"""
Backend ML Service — wraps the ml-service predict module for FastAPI.

Breed classes from capston.py (Colab training notebook):
  ["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]
  (alphabetical order — matches ImageDataGenerator directory scan order)

Return schema mirrors the original predict_image() function from the notebook:
  primary_breed, secondary_breed, confidence, crossbreed_ratio, all_predictions
"""

import numpy as np
from PIL import Image

import json
import logging
import os
from pathlib import Path
from fastapi import Request

logger = logging.getLogger(__name__)
DEFAULT_LABELS = ["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]


class ModelUnavailableError(RuntimeError):
    """Raised when a real trained model is required but not available."""

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logger.warning("TensorFlow not installed. Running in MOCK prediction mode.")

class BreedPredictor:
    def __init__(self, model_path: str, class_index_path: str):
        self.model_path = str(self._resolve_path(model_path))
        self.class_index_path = str(self._resolve_path(class_index_path))
        self.IMG_SIZE = (224, 224)
        self.labels = self._load_labels()
        self.model = None
        self.mode = "model-missing"
        self.unavailable_reason = ""
        
        if TF_AVAILABLE and os.path.exists(self.model_path):
            try:
                self.model = tf.keras.models.load_model(self.model_path)
                self.mode = "tensorflow"
                logger.info("BreedPredictor initialized with TensorFlow model")
            except Exception as e:
                self.unavailable_reason = f"Could not load TensorFlow model: {e}"
                logger.error("%s", self.unavailable_reason)
        else:
            if not TF_AVAILABLE:
                self.unavailable_reason = "TensorFlow is not installed for this Python version."
            else:
                self.unavailable_reason = f"Model file is missing at {self.model_path}."
            logger.warning(
                "%s Run `python ml-service/scripts/prepare_dataset.py` and `bash scripts/train_model.sh` "
                "to create breed_model.h5.",
                self.unavailable_reason,
            )

    def _resolve_path(self, value: str) -> Path:
        path = Path(value)
        if path.is_absolute():
            return path
        cwd_path = Path.cwd() / path
        if cwd_path.exists():
            return cwd_path
        repo_root = Path(__file__).resolve().parents[3]
        return repo_root / path

    def _load_labels(self) -> list[str]:
        if not os.path.exists(self.class_index_path):
            return DEFAULT_LABELS.copy()

        with open(self.class_index_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, list):
            return data

        if isinstance(data, dict):
            # Keras flow_from_directory stores {"Breed": index}; invert it safely.
            return [label for label, _ in sorted(data.items(), key=lambda item: item[1])]

        return DEFAULT_LABELS.copy()

    def preprocess(self, pil_image: Image.Image) -> np.ndarray:
        img = pil_image.convert("RGB").resize(self.IMG_SIZE)
        arr = np.array(img, dtype=np.float32)
        if TF_AVAILABLE:
            arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
        return np.expand_dims(arr, axis=0)

    def _fallback_probabilities(self, pil_image: Image.Image) -> np.ndarray:
        """
        Content-aware local fallback used when TensorFlow or a trained model is absent.
        It is deterministic and keeps the API usable for development/tests; train a real
        model with ml-service/train.py for production accuracy.
        """
        arr = self.preprocess(pil_image)[0]
        features = np.array(
            [
                arr[:, :, 0].mean(),
                arr[:, :, 1].mean(),
                arr[:, :, 2].mean(),
                arr.mean(),
                arr.std(),
            ],
            dtype=np.float32,
        )
        prototypes = np.array(
            [
                [0.54, 0.39, 0.30, 0.41, 0.25],  # Gir
                [0.45, 0.44, 0.42, 0.44, 0.33],  # Holstein
                [0.58, 0.49, 0.39, 0.49, 0.22],  # Jersey
                [0.62, 0.34, 0.25, 0.40, 0.24],  # Red_Sindhi
                [0.50, 0.42, 0.32, 0.41, 0.20],  # Sahiwal
            ],
            dtype=np.float32,
        )[: len(self.labels)]
        distances = np.linalg.norm(prototypes - features, axis=1)
        logits = -distances * 8.0
        exp = np.exp(logits - logits.max())
        return exp / exp.sum()

    def predict(self, image_bytes: bytes) -> dict:
        """
        Runs breed classification on image bytes.
        """
        from io import BytesIO
        from PIL import Image
        import numpy as np

        pil_image = Image.open(BytesIO(image_bytes))
        
        if self.model is not None:
            tensor = self.preprocess(pil_image)
            probs = self.model.predict(tensor, verbose=0)[0]
        else:
            raise ModelUnavailableError(
                f"{self.unavailable_reason} Train the model first so predictions are real: "
                "`python ml-service/scripts/prepare_dataset.py` then `bash scripts/train_model.sh`."
            )
        
        top2_idx = np.argsort(probs)[::-1][:2]
        primary_conf   = float(probs[top2_idx[0]])
        secondary_conf = float(probs[top2_idx[1]])
        total = primary_conf + secondary_conf
        
        crossbreed_ratio = round(secondary_conf / total, 3) if total > 0 else 0.0
        
        probability_map = {
            self.labels[i]: round(float(probs[i]) * 100, 2)
            for i in range(len(probs))
        }

        return {
            "primary_breed":    self.labels[top2_idx[0]],
            "secondary_breed":  self.labels[top2_idx[1]],
            "confidence":       round(primary_conf * 100, 2),
            "crossbreed_ratio": crossbreed_ratio,
            "all_probabilities": probability_map,
            "all_predictions": probability_map,
            "confidence_format": "percent",
            "model_mode": self.mode,
        }

def get_predictor(request: Request) -> BreedPredictor:
    return request.app.state.predictor
