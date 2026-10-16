from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.security import verify_token
from app.core.config import settings
from app.services.breed_info import get_breed_info
from app.services.ml_service import BreedPredictor, get_predictor
from app.services.mongo_service import (
    delete_prediction,
    get_prediction_by_id,
    get_user_predictions,
    save_prediction,
    set_feedback,
)

router = APIRouter()


class FeedbackPayload(BaseModel):
    is_correct: bool | None = None
    correct_breed: str | None = None


@router.get("/")
async def fetch_history(
    breed: str = Query(None),
    from_date: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token),
):
    """Prediction history for the logged-in user. Supports ?breed= and ?from_date=."""
    predictions = await get_user_predictions(
        user_id=user["uid"],
        breed_filter=breed,
        from_date=from_date,
        limit=limit,
    )
    return {"predictions": predictions, "count": len(predictions)}


@router.post("/sample-data")
async def seed_sample_data(
    user: dict = Depends(verify_token),
    predictor: BreedPredictor = Depends(get_predictor),
):
    """Populate a local demo account with one removable sample per model breed."""
    if not settings.AUTH_ALLOW_MOCK:
        raise HTTPException(status_code=403, detail="Sample data is available only in local demo mode.")

    existing = await get_user_predictions(user_id=user["uid"], limit=100)
    existing_breeds = {
        record.get("primary_breed")
        for record in existing
        if record.get("source") == "sample"
    }
    supported_breeds = list(predictor.labels)
    created = 0

    for index, primary in enumerate(supported_breeds):
        if primary in existing_breeds:
            continue
        secondary = supported_breeds[(index + 1) % len(supported_breeds)]
        confidence = round(93.5 - (index % 7) * 1.3, 1)
        primary_info = get_breed_info(primary)
        await save_prediction(
            {
                "user_id": user["uid"],
                "image_url": "",
                "primary_breed": primary,
                "secondary_breed": secondary,
                "confidence": confidence,
                "crossbreed_ratio": round((100 - confidence) / 100, 3),
                "all_probabilities": {primary: confidence, secondary: round(100 - confidence, 2)},
                "all_predictions": {primary: confidence, secondary: round(100 - confidence, 2)},
                "breed_info": primary_info,
                "health_status": "Sample record",
                "health_issue": None,
                "latitude": None,
                "longitude": None,
                "inference_ms": 0,
                "source": "sample",
                "model_mode": "demo",
            }
        )
        created += 1

    return {
        "created": created,
        "existing": len(existing_breeds),
        "total_supported_breeds": len(supported_breeds),
    }


@router.get("/{record_id}")
async def fetch_one(record_id: str, user=Depends(verify_token)):
    """Single prediction, scoped to the owner."""
    record = await get_prediction_by_id(record_id, user["uid"])
    if record is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return record


@router.delete("/{record_id}")
async def remove(record_id: str, user=Depends(verify_token)):
    deleted = await delete_prediction(record_id, user["uid"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"status": "deleted", "id": record_id}


@router.post("/{record_id}/feedback")
async def submit_feedback(record_id: str, payload: FeedbackPayload, user=Depends(verify_token)):
    modified = await set_feedback(record_id, user["uid"], payload.is_correct)
    if not modified:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"status": "success", "modified": modified}
