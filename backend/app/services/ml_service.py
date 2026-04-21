"""
Backend ML Service — wraps the ml-service predict module for FastAPI.

Breed classes from capston.py (Colab training notebook):
  ["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]
  (alphabetical order — matches ImageDataGenerator directory scan order)

Return schema mirrors the original predict_image() function from the notebook:
  primary_breed, secondary_breed, confidence, crossbreed_ratio, all_predictions
"""

import os
import numpy as np
from PIL import Image
from io import BytesIO
import tensorflow as tf

# ── Model configuration (extracted from capston.py) ────────────────────────
# Path is relative to the project root (where uvicorn is started from)
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),           # backend/app/services/
    "..", "..", "..",                    # → project root
    "ml-service", "models", "breed_model.h5"
)
MODEL_PATH = os.path.normpath(MODEL_PATH)

# Breed classes MUST be in alphabetical order to match ImageDataGenerator indexing
CLASS_NAMES = ["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]
IMG_SIZE    = (224, 224)

# ── Singleton model ─────────────────────────────────────────────────────────
_model: tf.keras.Model = None


def load_model() -> tf.keras.Model:
    """Load the trained .h5 model once; cache in module-level variable."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"breed_model.h5 not found at:\n  {MODEL_PATH}\n"
                "Copy the file to ml-service/models/breed_model.h5"
            )
        _model = tf.keras.models.load_model(MODEL_PATH)
    return _model


def _preprocess(pil_image: Image.Image) -> np.ndarray:
    """Preprocess PIL image identical to the Colab notebook preprocessing."""
    img = pil_image.convert("RGB").resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)   # (1, 224, 224, 3)


async def predict_breed(file) -> dict:
    """
    Main prediction entry point called by the /predict route.

    Parameters
    ----------
    file : UploadFile  — FastAPI UploadFile object

    Returns
    -------
    {
        "primary_breed":    str,
        "secondary_breed":  str,
        "confidence":       float,   # 0-1 probability of primary breed
        "crossbreed_ratio": list,    # probability for each class
        "all_predictions":  dict,    # {breed_name: probability}
        "class_names":      list,    # ordered list of class names
        "filename":         str,
    }
    """
    model = load_model()

    # Read uploaded file bytes → PIL Image
    contents = await file.read()
    pil_image = Image.open(BytesIO(contents))

    arr = _preprocess(pil_image)
    preds = model.predict(arr, verbose=0)[0]   # shape: (num_classes,)

    # Top-2 predictions (descending)
    top_indices = preds.argsort()[-2:][::-1]

    primary_breed   = CLASS_NAMES[top_indices[0]]
    secondary_breed = CLASS_NAMES[top_indices[1]]
    confidence      = float(preds[top_indices[0]])

    crossbreed_ratio = preds.tolist()
    all_predictions  = {
        CLASS_NAMES[i]: float(preds[i]) for i in range(len(CLASS_NAMES))
    }

    return {
        "primary_breed":    primary_breed,
        "secondary_breed":  secondary_breed,
        "confidence":       round(confidence, 4),
        "crossbreed_ratio": [round(p, 4) for p in crossbreed_ratio],
        "all_predictions":  {k: round(v, 4) for k, v in all_predictions.items()},
        "class_names":      CLASS_NAMES,
        "filename":         file.filename,
    }
