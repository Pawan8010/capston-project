from fastapi import APIRouter, Depends
from app.config import db
from app.security import verify_token
from app.services.mongo_service import get_user_predictions
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/user")
async def get_user_analytics(user: dict = Depends(verify_token)):
    uid = user["uid"]

    predictions = await get_user_predictions(uid, limit=500)
    total_scans = len(predictions)

    breed_distribution = {}
    scans_by_date = {}
    confidence_values = []
    realtime_count = 0
    upload_count = 0

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    for prediction in predictions:
        breed = prediction.get("primary_breed")
        if breed:
            breed_distribution[breed] = breed_distribution.get(breed, 0) + 1

        source = prediction.get("source") or "upload"
        if source == "realtime":
            realtime_count += 1
        else:
            upload_count += 1

        confidence = prediction.get("confidence")
        if confidence is not None:
            confidence_values.append(confidence if confidence <= 1 else confidence / 100)

        timestamp = prediction.get("timestamp")
        if isinstance(timestamp, datetime) and timestamp >= thirty_days_ago:
            key = timestamp.strftime("%Y-%m-%d")
            scans_by_date[key] = scans_by_date.get(key, 0) + 1

    scans_per_day = [{"date": date, "count": count} for date, count in sorted(scans_by_date.items())]
    average_confidence = round(sum(confidence_values) / len(confidence_values), 4) if confidence_values else 0

    return {
        "total_scans": total_scans,
        "breed_distribution": breed_distribution,
        "scans_per_day": scans_per_day,
        "average_confidence": average_confidence,
        "realtime_count": realtime_count,
        "upload_count": upload_count,
        "latest_predictions": predictions[:6],
    }

@router.get("/admin")
async def get_admin_analytics(user: dict = Depends(verify_token)):
    # Simple admin check since role_guard isn't active yet, will add later or assume token has role
    # Step 15 adds require_admin
    # For now, just return the data or we can wait for role_guard
    total_predictions_global = await db.predictions.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Most common breed
    pipeline_breed = [
        {"$group": {"_id": "$primary_breed", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    cursor_breed = db.predictions.aggregate(pipeline_breed)
    most_common_breed = "—"
    async for doc in cursor_breed:
        if doc["_id"]:
            most_common_breed = doc["_id"]
            
    # Avg confidence
    pipeline_conf = [
        {"$group": {"_id": None, "avg_conf": {"$avg": "$confidence"}}}
    ]
    cursor_conf = db.predictions.aggregate(pipeline_conf)
    average_confidence = 0
    async for doc in cursor_conf:
        if doc.get("avg_conf"):
            average_confidence = round(doc["avg_conf"], 2)

    # Daily usage
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    pipeline_dates = [
        {"$match": {"timestamp": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    cursor_dates = db.predictions.aggregate(pipeline_dates)
    daily_usage = []
    async for doc in cursor_dates:
        daily_usage.append({"date": doc["_id"], "count": doc["count"]})

    return {
        "total_predictions_global": total_predictions_global,
        "most_common_breed": most_common_breed,
        "daily_usage": daily_usage,
        "total_users": total_users,
        "average_confidence": average_confidence
    }
