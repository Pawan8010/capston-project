"""
ML Prediction Module — Livestock Breed Classifier
Extracted from capston.py (Google Colab training notebook).

Model: MobileNetV2 transfer learning
Input: 224x224 RGB image, normalised to [0,1]
Classes: Gir, Holstein, Jersey, Sahiwal, Red_Sindhi
"""

import os
import numpy as np
from PIL import Image
import tensorflow as tf

# ── Path to the trained .h5 model ──────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "breed_model.h5")

# ── Breed classes — MUST match the order used during training ───────────────
# ImageDataGenerator sorts directories alphabetically, so this order is:
CLASS_NAMES = ["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]

# ── Image preprocessing constants (same as Colab notebook) ─────────────────
IMG_SIZE = (224, 224)

# ── Singleton model ─────────────────────────────────────────────────────────
_model = None


def load_model() -> tf.keras.Model:
    """Load the .h5 model once and cache it."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found at: {MODEL_PATH}\n"
                "Make sure 'breed_model.h5' is placed inside ml-service/models/"
            )
        _model = tf.keras.models.load_model(MODEL_PATH)
    return _model


def preprocess_image(pil_image: Image.Image) -> np.ndarray:
    """
    Resize and normalise a PIL image for MobileNetV2 input.
    Matches the Colab preprocessing:  img / 255.0
    """
    img = pil_image.convert("RGB").resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr  # shape: (224, 224, 3)


def predict_image(pil_image: Image.Image) -> dict:
    """
    Run breed prediction on a PIL Image object.

    Returns
    -------
    {
        "primary_breed":    str,    # top predicted breed
        "secondary_breed":  str,    # second most likely breed
        "confidence":       float,  # probability of primary breed (0-1)
        "crossbreed_ratio": list,   # probability for every class (same order as CLASS_NAMES)
        "all_predictions":  dict,   # {breed_name: probability}
    }
    """
    model = load_model()

    arr = preprocess_image(pil_image)
    arr = np.expand_dims(arr, axis=0)          # → (1, 224, 224, 3)

    preds = model.predict(arr, verbose=0)[0]   # → (num_classes,)

    # Top-2 indices (descending confidence)
    top_indices = preds.argsort()[-2:][::-1]

    primary_breed   = CLASS_NAMES[top_indices[0]]
    secondary_breed = CLASS_NAMES[top_indices[1]]
    confidence      = float(preds[top_indices[0]])

    crossbreed_ratio = preds.tolist()   # all class probabilities
    all_predictions  = {
        CLASS_NAMES[i]: float(preds[i]) for i in range(len(CLASS_NAMES))
    }

    return {
        "primary_breed":    primary_breed,
        "secondary_breed":  secondary_breed,
        "confidence":       confidence,
        "crossbreed_ratio": crossbreed_ratio,
        "all_predictions":  all_predictions,
        "class_names":      CLASS_NAMES,
    }


def predict_from_path(img_path: str) -> dict:
    """Convenience wrapper — load image from file path then predict."""
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Image not found: {img_path}")
    pil_image = Image.open(img_path)
    return predict_image(pil_image)


# ── CLI test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    result = predict_from_path(sys.argv[1])
    print(json.dumps(result, indent=2))
