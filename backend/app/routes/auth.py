from fastapi import APIRouter, Body
from app.services.mongo_service import upsert_user, get_user_role

router = APIRouter()

@router.post("/sync")
async def sync_user(data: dict = Body(...)):
    await upsert_user(data)
    role = await get_user_role(data["uid"])
    return {"status": "synced", "role": role}
