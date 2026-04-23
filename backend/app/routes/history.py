from fastapi import APIRouter, Depends, Query
from app.services.mongo_service import get_user_predictions, delete_prediction
from app.security import verify_token

router = APIRouter()

@router.get("/")
async def fetch_history(
    breed: str = Query(None),
    from_date: str = Query(None),
    user: dict = Depends(verify_token)
):
    """
    Returns the prediction history for the logged-in user.
    Supports ?breed=Gir and ?from_date=2024-01-01 filters.
    """
    predictions = await get_user_predictions(
        user_id=user["uid"],
        breed_filter=breed,
        from_date=from_date
    )
    return {"predictions": predictions, "count": len(predictions)}

@router.delete("/{id}")
async def remove(id: str, user=Depends(verify_token)):
    await delete_prediction(id, user["uid"])
    return {"status": "deleted"}

@router.post("/{id}/feedback")
async def submit_feedback(id: str, request: dict, user=Depends(verify_token)):
    from app.services.mongo_service import db
    from bson import ObjectId
    result = await db.predictions.update_one(
        {"_id": ObjectId(id), "user_id": user["uid"]},
        {"$set": {"feedback_given": True, "is_correct": request.get("is_correct")}}
    )
    return {"status": "success", "modified": result.modified_count}
