from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.security import verify_token
from app.services.mongo_service import (
    get_admin_stats,
    get_average_confidence,
    get_breed_distribution,
    get_daily_counts,
    get_user_predictions,
    get_user_role,
    utcnow,
)

router = APIRouter()


@router.get("/user")
async def get_user_analytics(user: dict = Depends(verify_token)):
    predictions = await get_user_predictions(user["uid"], limit=500)

    breed_distribution: dict[str, int] = {}
    scans_by_date: dict[str, int] = {}
    confidence_values: list[float] = []
    realtime_count = 0
    upload_count = 0

    thirty_days_ago = utcnow() - timedelta(days=30)

    for prediction in predictions:
        breed = prediction.get("primary_breed")
        if breed:
            breed_distribution[breed] = breed_distribution.get(breed, 0) + 1

        if (prediction.get("source") or "upload") == "realtime":
            realtime_count += 1
        else:
            upload_count += 1

        confidence = prediction.get("confidence")
        if isinstance(confidence, (int, float)):
            # Stored as a percentage; normalise to 0-1 for the average.
            confidence_values.append(confidence if confidence <= 1 else confidence / 100)

        timestamp = prediction.get("timestamp")
        if isinstance(timestamp, datetime):
            if timestamp.tzinfo is not None:
                timestamp = timestamp.replace(tzinfo=None)
            if timestamp >= thirty_days_ago:
                key = timestamp.strftime("%Y-%m-%d")
                scans_by_date[key] = scans_by_date.get(key, 0) + 1

    average_confidence = (
        round(sum(confidence_values) / len(confidence_values), 4) if confidence_values else 0
    )

    return {
        "total_scans": len(predictions),
        "breed_distribution": breed_distribution,
        "scans_per_day": [{"date": d, "count": c} for d, c in sorted(scans_by_date.items())],
        "average_confidence": average_confidence,
        "realtime_count": realtime_count,
        "upload_count": upload_count,
        "latest_predictions": predictions[:6],
    }


@router.get("/admin")
async def get_admin_analytics(user: dict = Depends(verify_token)):
    if await get_user_role(user["uid"]) != "admin":
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")

    stats = await get_admin_stats()
    breeds = await get_breed_distribution()
    most_common_breed = next(iter(breeds), "—")

    return {
        "total_predictions_global": stats["total_predictions"],
        "total_users": stats["total_users"],
        "most_common_breed": most_common_breed,
        "breed_distribution": breeds,
        "daily_usage": await get_daily_counts(days=30),
        "average_confidence": await get_average_confidence(),
    }
