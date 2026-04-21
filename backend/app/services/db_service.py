from app.config import db
from datetime import datetime
from bson import ObjectId

async def save_prediction(uid: str, result: dict):
    doc = {"uid": uid, "result": result, "created_at": datetime.utcnow()}
    await db.predictions.insert_one(doc)

async def get_history(uid: str):
    cursor = db.predictions.find({"uid": uid}).sort("created_at", -1)
    records = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        records.append(doc)
    return records

async def upsert_user(data: dict):
    await db.users.update_one({"uid": data["uid"]}, {"$set": data}, upsert=True)

async def delete_prediction(id: str, uid: str):
    await db.predictions.delete_one({"_id": ObjectId(id), "uid": uid})
