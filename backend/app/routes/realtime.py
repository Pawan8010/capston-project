"""
Real-time Prediction Route — POST /realtime-predict/
Accepts a base64-encoded image frame from the webcam and returns breed prediction.
Designed to be called periodically (e.g., every 2 seconds) from the frontend camera scanner.
"""

from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

from app.services.ml_service import get_predictor, BreedPredictor
from app.security import verify_token

router = APIRouter()


class FramePayload(BaseModel):
    """
    Payload for real-time prediction.
    image_b64: base64-encoded image string (data:image/jpeg;base64,... or raw base64)
    """
    image_b64: str


@router.post("/")
async def realtime_predict(
    payload: FramePayload,
    user=Depends(verify_token),
    predictor: BreedPredictor = Depends(get_predictor)
):
    """
    Accepts a base64 image frame and returns breed prediction.
    """
    import base64
    try:
        # Strip the data URI prefix if present (data:image/jpeg;base64,...)
        b64_data = payload.image_b64
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]

        img_bytes = base64.b64decode(b64_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

    try:
        result = predictor.predict(img_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

