"""
Data access for predictions and users.

Every function tries MongoDB first and falls back to the in-memory store in
app.config when Mongo is unreachable, so the app keeps working on a machine
with no database. Analytics are computed with aggregation pipelines against
Mongo and in plain Python against the fallback store.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone

from app.config import db, memory_db

logger = logging.getLogger(__name__)

try:
    from bson import ObjectId
    from bson.errors import InvalidId

    BSON_AVAILABLE = True
except ImportError:  # pragma: no cover - environment guard
    BSON_AVAILABLE = False

    class InvalidId(Exception):
        pass

    def ObjectId(value=None):  # type: ignore[misc]
        return value


try:
    from pymongo.errors import PyMongoError
except ImportError:  # pragma: no cover - environment guard

    class PyMongoError(Exception):
        pass


# Anything that means "Mongo did not answer" and should trigger the fallback.
# RuntimeError covers the driver being bound to a closed event loop.
DB_ERRORS = (PyMongoError, OSError, AttributeError, TypeError, RuntimeError)

# Once Mongo fails we stop calling it for a while. Without this every request
# pays the full serverSelectionTimeoutMS before falling back, which makes the
# whole app feel broken on a machine with no database.
_MONGO_RETRY_SECONDS = 30.0
_mongo_down_until = 0.0

HISTORY_PROJECTION = {
    "_id": 1, "user_id": 1, "primary_breed": 1, "secondary_breed": 1,
    "confidence": 1, "image_url": 1, "timestamp": 1, "crossbreed_ratio": 1,
    "health_status": 1, "source": 1, "latitude": 1, "longitude": 1,
    "inference_ms": 1, "breed_info": 1, "all_probabilities": 1,
    "top_predictions": 1, "feedback_given": 1, "is_correct": 1,
}


def _mongo_ready() -> bool:
    return db is not memory_db and time.monotonic() >= _mongo_down_until


def _mark_mongo_down(operation: str, exc: Exception) -> None:
    global _mongo_down_until
    first_failure = time.monotonic() >= _mongo_down_until
    _mongo_down_until = time.monotonic() + _MONGO_RETRY_SECONDS
    if first_failure:
        logger.warning(
            "MongoDB %s failed (%s). Using in-memory storage; retrying in %.0fs.",
            operation, exc, _MONGO_RETRY_SECONDS,
        )


def utcnow() -> datetime:
    """Naive UTC, matching what the Mongo driver hands back on read."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _id_filter(record_id: str) -> dict:
    """Match either a real ObjectId or the uuid strings the memory store issues."""
    if BSON_AVAILABLE:
        try:
            return {"_id": ObjectId(record_id)}
        except (InvalidId, TypeError, ValueError):
            pass
    return {"_id": record_id}


def _stringify(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    result = dict(doc)
    if "_id" in result:
        result["_id"] = str(result["_id"])
    return result


# ── predictions ─────────────────────────────────────────────────────────────


async def save_prediction(doc: dict) -> str:
    doc = {**doc, "timestamp": utcnow(), "feedback_given": False}

    if _mongo_ready():
        try:
            result = await db.predictions.insert_one(dict(doc))
            return str(result.inserted_id)
        except DB_ERRORS as exc:
            _mark_mongo_down("insert", exc)

    result = await memory_db.predictions.insert_one(dict(doc))
    return str(result.inserted_id)


async def get_user_predictions(
    user_id: str,
    breed_filter: str | None = None,
    from_date: str | None = None,
    limit: int = 20,
) -> list[dict]:
    query: dict = {"user_id": user_id}
    if breed_filter:
        query["primary_breed"] = breed_filter
    if from_date:
        try:
            query["timestamp"] = {"$gte": datetime.fromisoformat(from_date)}
        except ValueError:
            logger.warning("Ignoring unparseable from_date=%r", from_date)

    if _mongo_ready():
        try:
            cursor = db.predictions.find(query, HISTORY_PROJECTION).sort("timestamp", -1).limit(limit)
            docs = await cursor.to_list(length=limit)
            if docs:
                return [_stringify(doc) for doc in docs]
        except DB_ERRORS as exc:
            _mark_mongo_down("history query", exc)

    cursor = memory_db.predictions.find(query).sort("timestamp", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_stringify(doc) for doc in docs]


async def get_prediction_by_id(record_id: str, user_id: str) -> dict | None:
    if _mongo_ready():
        try:
            doc = await db.predictions.find_one({**_id_filter(record_id), "user_id": user_id})
            if doc:
                return _stringify(doc)
        except DB_ERRORS as exc:
            _mark_mongo_down("find_one", exc)

    doc = await memory_db.predictions.find_one({"_id": record_id, "user_id": user_id})
    return _stringify(doc)


async def delete_prediction(record_id: str, user_id: str) -> int:
    if _mongo_ready():
        try:
            result = await db.predictions.delete_one({**_id_filter(record_id), "user_id": user_id})
            if getattr(result, "deleted_count", 0):
                return result.deleted_count
        except DB_ERRORS as exc:
            _mark_mongo_down("delete", exc)

    result = await memory_db.predictions.delete_one({"_id": record_id, "user_id": user_id})
    return getattr(result, "deleted_count", 0)


async def set_feedback(record_id: str, user_id: str, is_correct: bool | None) -> int:
    update = {"$set": {"feedback_given": True, "is_correct": is_correct}}

    if _mongo_ready():
        try:
            result = await db.predictions.update_one(
                {**_id_filter(record_id), "user_id": user_id}, update
            )
            if getattr(result, "modified_count", 0):
                return result.modified_count
        except DB_ERRORS as exc:
            _mark_mongo_down("feedback update", exc)

    result = await memory_db.predictions.update_one(
        {"_id": record_id, "user_id": user_id}, update
    )
    return getattr(result, "modified_count", 0)


# ── users ───────────────────────────────────────────────────────────────────


async def upsert_user(data: dict) -> None:
    payload = {k: v for k, v in data.items() if v is not None}
    payload.setdefault("created_at", utcnow())
    payload["last_seen"] = utcnow()

    if _mongo_ready():
        try:
            await db.users.update_one({"uid": payload["uid"]}, {"$set": payload}, upsert=True)
            return
        except DB_ERRORS as exc:
            _mark_mongo_down("user upsert", exc)

    await memory_db.users.update_one({"uid": payload["uid"]}, {"$set": payload}, upsert=True)


async def get_user_role(uid: str) -> str:
    if _mongo_ready():
        try:
            user = await db.users.find_one({"uid": uid}, {"role": 1})
            if user:
                return user.get("role") or "farmer"
        except DB_ERRORS as exc:
            _mark_mongo_down("role lookup", exc)

    user = await memory_db.users.find_one({"uid": uid})
    return (user or {}).get("role") or "farmer"


async def get_all_users() -> list[dict]:
    projection = {"_id": 0, "uid": 1, "email": 1, "displayName": 1, "role": 1, "last_seen": 1}

    if _mongo_ready():
        try:
            docs = await db.users.find({}, projection).to_list(length=1000)
            if docs:
                return docs
        except DB_ERRORS as exc:
            _mark_mongo_down("user list", exc)

    docs = await memory_db.users.find({}).to_list(length=1000)
    return [{k: v for k, v in doc.items() if k != "_id"} for doc in docs]


# ── analytics ───────────────────────────────────────────────────────────────


async def get_admin_stats() -> dict:
    if _mongo_ready():
        try:
            return {
                "total_users": await db.users.count_documents({}),
                "total_predictions": await db.predictions.count_documents({}),
            }
        except DB_ERRORS as exc:
            _mark_mongo_down("stats", exc)

    return {
        "total_users": await memory_db.users.count_documents({}),
        "total_predictions": await memory_db.predictions.count_documents({}),
    }


async def get_breed_distribution() -> dict[str, int]:
    """Count per predicted breed. The field is top-level `primary_breed`."""
    if _mongo_ready():
        pipeline = [
            {"$group": {"_id": "$primary_breed", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        try:
            result: dict[str, int] = {}
            async for doc in db.predictions.aggregate(pipeline):
                if doc.get("_id"):
                    result[doc["_id"]] = doc["count"]
            if result:
                return result
        except DB_ERRORS as exc:
            _mark_mongo_down("breed aggregate", exc)

    counts: dict[str, int] = {}
    for doc in memory_db.predictions.docs:
        breed = doc.get("primary_breed")
        if breed:
            counts[breed] = counts.get(breed, 0) + 1
    return dict(sorted(counts.items(), key=lambda item: -item[1]))


async def get_average_confidence() -> float:
    """Mean confidence across all predictions, as a percentage."""
    if _mongo_ready():
        pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$confidence"}}}]
        try:
            async for doc in db.predictions.aggregate(pipeline):
                if doc.get("avg") is not None:
                    return round(float(doc["avg"]), 2)
        except DB_ERRORS as exc:
            _mark_mongo_down("confidence aggregate", exc)

    values = [
        doc["confidence"] for doc in memory_db.predictions.docs
        if isinstance(doc.get("confidence"), (int, float))
    ]
    return round(sum(values) / len(values), 2) if values else 0.0


async def get_daily_counts(days: int = 7) -> list[dict]:
    """Prediction counts per day. Documents are timestamped with `timestamp`."""
    since = utcnow() - timedelta(days=days)

    if _mongo_ready():
        pipeline = [
            {"$match": {"timestamp": {"$gte": since}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id": 1}},
        ]
        try:
            records = []
            async for doc in db.predictions.aggregate(pipeline):
                records.append({"date": doc["_id"], "count": doc["count"]})
            if records:
                return records
        except DB_ERRORS as exc:
            _mark_mongo_down("daily aggregate", exc)

    buckets: dict[str, int] = {}
    for doc in memory_db.predictions.docs:
        stamp = doc.get("timestamp")
        if isinstance(stamp, datetime) and stamp >= since:
            key = stamp.strftime("%Y-%m-%d")
            buckets[key] = buckets.get(key, 0) + 1
    return [{"date": date, "count": count} for date, count in sorted(buckets.items())]
