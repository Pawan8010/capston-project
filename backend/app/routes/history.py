from fastapi import APIRouter, Depends
from app.services.db_service import get_history, delete_prediction
from app.security import verify_token

router = APIRouter()

@router.get("/")
async def fetch_history(user=Depends(verify_token)):
    return await get_history(user["uid"])

@router.delete("/{id}")
async def remove(id: str, user=Depends(verify_token)):
    await delete_prediction(id, user["uid"])
    return {"status": "deleted"}
