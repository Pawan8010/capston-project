from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.security import verify_token
from app.services.mongo_service import (
    delete_prediction,
    get_prediction_by_id,
    get_user_predictions,
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
