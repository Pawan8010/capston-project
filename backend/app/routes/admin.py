from fastapi import APIRouter, Depends, HTTPException
from app.services.mongo_service import (
    get_admin_stats, get_user_role, get_breed_distribution,
    get_daily_counts, get_all_users
)
from app.security import verify_token

router = APIRouter()


@router.get("/stats")
async def fetch_admin_stats(user=Depends(verify_token)):
    """Return comprehensive admin statistics (admin-only)."""
    role = await get_user_role(user["uid"])
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")

    stats  = await get_admin_stats()
    breeds = await get_breed_distribution()
    daily  = await get_daily_counts()

    return {**stats, "breed_distribution": breeds, "daily_counts": daily}


@router.get("/users")
async def fetch_all_users(user=Depends(verify_token)):
    """Return list of all users (admin-only)."""
    role = await get_user_role(user["uid"])
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")

    users = await get_all_users()
    return users

