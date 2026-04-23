from fastapi import APIRouter, Depends
from app.services.mongo_service import db
from app.security import verify_token
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/user")
async def get_user_analytics(user: dict = Depends(verify_token)):
    uid = user["uid"]
    
    # 1. Total Scans
    total_scans = await db.predictions.count_documents({"user_id": uid})
    
    # 2. Breed distribution
    pipeline_breed = [
        {"$match": {"user_id": uid}},
        {"$group": {"_id": "$primary_breed", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    cursor_breed = db.predictions.aggregate(pipeline_breed)
    breed_distribution = {}
    async for doc in cursor_breed:
        if doc["_id"]:
            breed_distribution[doc["_id"]] = doc["count"]
            
    # 3. Scans per day (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    pipeline_dates = [
        {"$match": {"user_id": uid, "timestamp": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    cursor_dates = db.predictions.aggregate(pipeline_dates)
    scans_per_day = []
    async for doc in cursor_dates:
        scans_per_day.append({"date": doc["_id"], "count": doc["count"]})
        
    return {
        "total_scans": total_scans,
        "breed_distribution": breed_distribution,
        "scans_per_day": scans_per_day
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
