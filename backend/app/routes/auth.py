from fastapi import APIRouter, Body
from app.services.db_service import upsert_user

router = APIRouter()

@router.post("/sync")
async def sync_user(data: dict = Body(...)):
    await upsert_user(data)
    return {"status": "synced"}
