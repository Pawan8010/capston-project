"""
Real-time Prediction Route — POST /realtime-predict/
Accepts a base64-encoded image frame from the webcam and returns breed prediction.
Designed to be called periodically (e.g., every 2 seconds) from the frontend camera scanner.
"""

import base64
from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from PIL import Image

from app.services.ml_service import load_model, _preprocess, CLASS_NAMES
from app.security import verify_token

import numpy as np

router = APIRouter()


class FramePayload(BaseModel):
    """
    Payload for real-time prediction.
    image_b64: base64-encoded image string (data:image/jpeg;base64,... or raw base64)
    """
    image_b64: str


@router.post("/")
async def realtime_predict(payload: FramePayload, user=Depends(verify_token)):
    """
    Accepts a base64 image frame and returns breed prediction.

    Returns:
    - primary_breed:    Most likely breed
    - secondary_breed:  Second most likely breed
    - confidence:       Probability of primary breed (0-1)
    - all_predictions:  Dict of {breed: probability}
    - class_names:      Ordered list of breed class names
    """
    try:
        # Strip the data URI prefix if present (data:image/jpeg;base64,...)
        b64_data = payload.image_b64
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]

        img_bytes = base64.b64decode(b64_data)
        pil_image = Image.open(BytesIO(img_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

    try:
        model = load_model()
        arr = _preprocess(pil_image)
        preds = model.predict(arr, verbose=0)[0]  # shape: (num_classes,)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Top-2 indices (descending)
    top_indices = preds.argsort()[-2:][::-1]
    primary_breed   = CLASS_NAMES[top_indices[0]]
    secondary_breed = CLASS_NAMES[top_indices[1]]
    confidence      = float(preds[top_indices[0]])

    all_predictions = {CLASS_NAMES[i]: round(float(preds[i]), 4) for i in range(len(CLASS_NAMES))}

    return {
        "primary_breed":    primary_breed,
        "secondary_breed":  secondary_breed,
        "confidence":       round(confidence, 4),
        "all_predictions":  all_predictions,
        "class_names":      CLASS_NAMES,
    }
