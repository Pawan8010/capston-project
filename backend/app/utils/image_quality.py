import cv2
import numpy as np
from app.core.config import settings

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
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if img is None:
        return {"is_sharp": False, "score": 0.0, 
                "threshold": settings.BLUR_THRESHOLD}
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    
    return {
        "is_sharp": score >= settings.BLUR_THRESHOLD,
        "score": round(score, 2),
        "threshold": settings.BLUR_THRESHOLD
    }
