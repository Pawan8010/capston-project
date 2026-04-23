from app.config import db
from datetime import datetime, timedelta
from bson import ObjectId

async def save_prediction(doc: dict) -> str:
    """
    Saves a prediction document to the predictions collection.
    Adds timestamp and feedback_given=False automatically.
    Returns the inserted document ID as a string.
    """
    doc["timestamp"]     = datetime.utcnow()
    doc["feedback_given"] = False
    result = await db.predictions.insert_one(doc)
    return str(result.inserted_id)

async def get_user_predictions(
    user_id: str,
    breed_filter: str = None,
    from_date: str  = None,
    limit: int      = 20
) -> list:
    """
    Returns paginated prediction history for a specific user.
    Supports optional filtering by breed name and start date.
    Results are sorted newest first.
    """
    query = {"user_id": user_id}
    if breed_filter:
        query["primary_breed"] = breed_filter
    if from_date:
        query["timestamp"] = {
            "$gte": datetime.fromisoformat(from_date)
        }
    cursor = db.predictions.find(
        query,
        {"_id": 1, "primary_breed": 1, "secondary_breed": 1,
         "confidence": 1, "image_url": 1, "timestamp": 1,
         "crossbreed_ratio": 1, "health_status": 1}
    ).sort("timestamp", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs

async def upsert_user(data: dict):
    # Set default role to farmer unless they are a predefined admin
    if "role" not in data:
        data["role"] = "admin" if data.get("email") == "admin@example.com" else "farmer"
    await db.users.update_one({"uid": data["uid"]}, {"$set": data}, upsert=True)

async def get_user_role(uid: str):
    user = await db.users.find_one({"uid": uid}, {"role": 1})
    return user.get("role", "farmer") if user else "farmer"

async def get_admin_stats():
    total_users = await db.users.count_documents({})
    total_predictions = await db.predictions.count_documents({})
    return {"total_users": total_users, "total_predictions": total_predictions}

async def delete_prediction(id: str, uid: str):
    await db.predictions.delete_one({"_id": ObjectId(id), "uid": uid})


# ── New analytics queries ───────────────────────────────────────────────────

async def get_breed_distribution():
    """Return count per breed across all predictions."""
    pipeline = [
        {"$group": {"_id": "$result.primary_breed", "count": {"$sum": 1}}},
        {"$sort":  {"count": -1}},
    ]
    result = {}
    async for doc in db.predictions.aggregate(pipeline):
        breed = doc["_id"]
        if breed:
            result[breed] = doc["count"]
    return result


async def get_daily_counts(days: int = 7):
    """Return prediction counts for the last N days."""
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match":  {"created_at": {"$gte": since}}},
        {"$group":  {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}, "count": {"$sum": 1}}},
        {"$sort":   {"_id": 1}},
    ]
    records = []
    async for doc in db.predictions.aggregate(pipeline):
        records.append({"date": doc["_id"], "count": doc["count"]})
    return records


async def get_all_users():
    """Return all users (admin view)."""
    cursor = db.users.find({}, {"_id": 0, "uid": 1, "email": 1, "displayName": 1, "role": 1})
    users = []
    async for doc in cursor:
        users.append(doc)
    return users

