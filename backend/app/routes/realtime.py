"""
Real-time Prediction Route — POST /realtime-predict/
Accepts a base64-encoded image frame from the webcam and returns breed prediction.
Designed to be called periodically (e.g., every 2 seconds) from the frontend camera scanner.
"""

from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from app.services.ml_service import get_predictor, BreedPredictor, ModelUnavailableError
from app.security import verify_token
from app.services.breed_info import get_breed_info
from app.services.mongo_service import save_prediction
import time

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
    save: bool = Query(False, description="Persist this realtime scan to prediction history."),
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
        start = time.perf_counter()
        try:
            result = predictor.predict(img_bytes)
        except ModelUnavailableError as exc:
            raise HTTPException(status_code=503, detail=str(exc))
        result["inference_ms"] = round((time.perf_counter() - start) * 1000, 2)
        breed_info = get_breed_info(result.get("primary_breed", ""))
        result["breed_info"] = breed_info
        result["source"] = "realtime"

        if save:
            doc = {
                "user_id": user["uid"],
                "image_url": "",
                "primary_breed": result.get("primary_breed"),
                "secondary_breed": result.get("secondary_breed"),
                "confidence": result.get("confidence"),
                "crossbreed_ratio": result.get("crossbreed_ratio"),
                "all_probabilities": result.get("all_probabilities"),
                "all_predictions": result.get("all_predictions"),
                "breed_info": breed_info,
                "health_status": "Live scan",
                "health_issue": None,
                "latitude": None,
                "longitude": None,
                "inference_ms": result.get("inference_ms"),
                "source": "realtime",
                "model_mode": result.get("model_mode"),
            }
            result["id"] = await save_prediction(doc)

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

