import numpy as np
from io import BytesIO
from PIL import Image, ImageFilter
from app.core.config import settings

try:
    import cv2
except ImportError:
    cv2 = None

def check_image_sharpness(image_bytes: bytes) -> dict:
    """
    Detects whether an uploaded image is too blurry for ML inference.
    
    Uses the Laplacian variance method:
    - Converts image to grayscale
    - Applies Laplacian filter to detect edges
    - Computes variance of the result
    - Low variance = blurry image (few sharp edges)
    
    Parameters:
        image_bytes: Raw image file bytes
    
    Returns:
        dict with keys:
          "is_sharp" (bool): True if image is clear enough
          "score" (float): Sharpness score (higher = sharper)
          "threshold" (float): The threshold used
    """
    if cv2 is not None:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return {"is_sharp": False, "score": 0.0, "threshold": settings.BLUR_THRESHOLD}
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    else:
        try:
            img = Image.open(BytesIO(image_bytes)).convert("L")
        except Exception:
            return {"is_sharp": False, "score": 0.0, "threshold": settings.BLUR_THRESHOLD}
        edges = img.filter(ImageFilter.FIND_EDGES)
        score = float(np.array(edges, dtype=np.float32).var())
    
    return {
        "is_sharp": score >= settings.BLUR_THRESHOLD,
        "score": round(score, 2),
        "threshold": settings.BLUR_THRESHOLD
    }
