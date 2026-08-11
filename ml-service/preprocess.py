"""
Inference-time image preprocessing, in plain NumPy + PIL.

This mirrors the eval transform in train.py:
    Resize(shorter side to img_size * 1.14) -> CenterCrop(img_size)
    -> scale to [0,1] -> normalise with the ImageNet statistics -> CHW

Train and serve must agree here. Resizing differently (say, a straight squash to
224x224 instead of aspect-preserving crop) changes the input distribution enough
to cost real accuracy, and the bug is invisible unless you compare tensors.

The backend uses BreedPredictor.preprocess, which implements the same steps;
this module exists for standalone scripts and notebooks.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

IMG_SIZE = 224
RESIZE_RATIO = 1.14
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def resize_shorter_side(img: Image.Image, target: int) -> Image.Image:
    """Scale so the shorter side equals `target`, preserving aspect ratio."""
    width, height = img.size
    if width < height:
        new_w = target
        new_h = max(1, round(height * target / width))
    else:
        new_h = target
        new_w = max(1, round(width * target / height))
    return img.resize((new_w, new_h), Image.BILINEAR)


def center_crop(img: Image.Image, size: int) -> Image.Image:
    width, height = img.size
    left = max(0, (width - size) // 2)
    top = max(0, (height - size) // 2)
    return img.crop((left, top, left + size, top + size))


def preprocess_image(img: Image.Image, img_size: int = IMG_SIZE, batched: bool = False) -> np.ndarray:
    """
    PIL image -> normalised float32 array in CHW order.

    Returns (3, H, W), or (1, 3, H, W) when `batched` is True.
    """
    img = img.convert("RGB")
    img = resize_shorter_side(img, round(img_size * RESIZE_RATIO))
    img = center_crop(img, img_size)

    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    arr = np.transpose(arr, (2, 0, 1))
    return arr[None, ...] if batched else arr
