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

import json
import logging
import random
from fastapi import Request

logger = logging.getLogger(__name__)

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logger.warning("TensorFlow not installed. Running in MOCK prediction mode.")

class BreedPredictor:
    def __init__(self, model_path: str, class_index_path: str):
        self.model_path = model_path
        self.class_index_path = class_index_path
        self.IMG_SIZE = (224, 224)
        
        self.labels = ["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]
        if os.path.exists(self.class_index_path):
            with open(self.class_index_path, "r") as f:
                self.labels = json.load(f)

        if TF_AVAILABLE:
            try:
                if not os.path.exists(self.model_path):
                    logger.error(f"Model file missing: {self.model_path}")
                    raise RuntimeError(f"breed_model.h5 not found at {self.model_path}")
                
                self.model = tf.keras.models.load_model(self.model_path)
                logger.info("BreedPredictor initialized successfully")
            except Exception as e:
                logger.error(f"Failed to load BreedPredictor: {e}")
                raise RuntimeError(f"Could not load ML model: {e}")
        else:
            self.model = None

    def preprocess(self, pil_image: Image.Image) -> np.ndarray:
        img = pil_image.convert("RGB").resize(self.IMG_SIZE)
        arr = np.array(img, dtype=np.float32) / 255.0
        return np.expand_dims(arr, axis=0)

    def predict(self, image_bytes: bytes) -> dict:
        """
        Runs breed classification on image bytes.
        """
        from io import BytesIO
        from PIL import Image
        import numpy as np

        pil_image = Image.open(BytesIO(image_bytes))
        
        if TF_AVAILABLE and self.model:
            tensor = self.preprocess(pil_image)
            probs = self.model.predict(tensor, verbose=0)[0]
        else:
            # Mock mode
            import random
            probs = np.random.dirichlet(np.ones(len(self.labels)), size=1)[0]
        
        top2_idx = np.argsort(probs)[::-1][:2]
        primary_conf   = float(probs[top2_idx[0]])
        secondary_conf = float(probs[top2_idx[1]])
        total = primary_conf + secondary_conf
        
        crossbreed_ratio = round(secondary_conf / total, 3) if total > 0 else 0.0
        
        return {
            "primary_breed":    self.labels[top2_idx[0]],
            "secondary_breed":  self.labels[top2_idx[1]],
            "confidence":       round(primary_conf * 100, 2),
            "crossbreed_ratio": crossbreed_ratio,
            "all_probabilities": {
                self.labels[i]: round(float(probs[i]) * 100, 2)
                for i in range(len(probs))
            }
        }

def get_predictor(request: Request) -> BreedPredictor:
    return request.app.state.predictor
