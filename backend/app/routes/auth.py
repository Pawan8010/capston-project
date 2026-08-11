"""
User sync - called by the frontend after a successful Firebase login.

The identity comes from the verified token, never from the request body.
An earlier version trusted a client-supplied dict, which let anyone overwrite
any user record and hand themselves `role: "admin"`.
"""

from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.security import verify_token
from app.services.mongo_service import get_user_role, upsert_user

router = APIRouter()


class SyncPayload(BaseModel):
    displayName: str | None = None
    photoURL: str | None = None


@router.post("/sync")
async def sync_user(payload: SyncPayload = Body(default=SyncPayload()), user=Depends(verify_token)):
    uid = user["uid"]
    email = (user.get("email") or "").lower()

    # Keep an existing role; only promote via the ADMIN_EMAILS allowlist.
    current_role = await get_user_role(uid)
    role = current_role if current_role != "farmer" else (
        "admin" if email and email in settings.admin_emails else "farmer"
    )

    await upsert_user(
        {
            "uid": uid,
            "email": user.get("email"),
            "displayName": payload.displayName or user.get("name"),
            "photoURL": payload.photoURL or user.get("picture"),
            "role": role,
        }
    )
    return {"status": "synced", "uid": uid, "role": role}


@router.get("/me")
async def me(user=Depends(verify_token)):
    return {
        "uid": user["uid"],
        "email": user.get("email"),
        "role": await get_user_role(user["uid"]),
    }
