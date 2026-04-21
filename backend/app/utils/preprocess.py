"""
Image preprocessing utility for the backend.
Matches the Colab training notebook (capston.py) preprocessing exactly.
"""

import numpy as np
from PIL import Image

IMG_SIZE = (224, 224)


def preprocess_image(img: Image.Image) -> np.ndarray:
    """
    Prepare a PIL Image for MobileNetV2 inference.
    - Converts to RGB
    - Resizes to 224 x 224
    - Normalises to [0, 1]
    Returns ndarray of shape (224, 224, 3) float32.
    """
    img = img.convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr
