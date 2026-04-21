"""
Standalone preprocess utility for the ML service.
Matches the preprocessing used in the Colab training notebook (capston.py).
"""

import numpy as np
from PIL import Image

IMG_SIZE = (224, 224)


def preprocess_image(img: Image.Image) -> np.ndarray:
    """
    Convert a PIL Image to a normalised numpy array ready for MobileNetV2.
    - Converts to RGB (handles RGBA, grayscale, etc.)
    - Resizes to 224x224
    - Normalises pixel values to [0, 1]
    Returns shape (224, 224, 3) float32.
    """
    img = img.convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr
