"""
Database wiring.

The app must stay usable with no MongoDB running - a demo or a fresh clone
should still predict, store history and render the dashboard. So alongside the
real Motor client we always keep an in-memory store with the same async API.
`mongo_service` falls back to it whenever a Mongo call fails.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

MONGO_URI = settings.MONGO_URI
DB_NAME = settings.DB_NAME or settings.MONGO_DB


class _InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class _UpdateResult:
    def __init__(self, modified_count=0):
        self.modified_count = modified_count


class _DeleteResult:
    def __init__(self, deleted_count=0):
        self.deleted_count = deleted_count


def _matches(doc: dict, query: dict) -> bool:
    for key, condition in query.items():
        value = doc.get(key)
        if isinstance(condition, dict):
            for op, operand in condition.items():
                if op == "$gte" and not (value is not None and value >= operand):
                    return False
                if op == "$lte" and not (value is not None and value <= operand):
                    return False
                if op == "$gt" and not (value is not None and value > operand):
                    return False
                if op == "$lt" and not (value is not None and value < operand):
                    return False
                if op == "$ne" and value == operand:
                    return False
                if op == "$in" and value not in operand:
                    return False
        elif str(value) != str(condition):
            return False
    return True


class _MemoryCursor:
    def __init__(self, docs):
        self.docs = list(docs)

    def sort(self, key, direction=1):
        self.docs.sort(
            key=lambda doc: doc.get(key) or datetime.min,
            reverse=direction < 0,
        )
        return self

    def limit(self, limit):
        self.docs = self.docs[:limit]
        return self

    async def to_list(self, length=None):
        return self.docs[:length] if length else list(self.docs)

    def __aiter__(self):
        self._iter = iter(self.docs)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class _MemoryCollection:
    def __init__(self):
        self.docs: list[dict] = []

    async def insert_one(self, doc):
        inserted_id = doc.get("_id") or str(uuid.uuid4())
        self.docs.append({**doc, "_id": inserted_id})
        return _InsertResult(inserted_id)

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if _matches(doc, query):
                doc.update(update.get("$set", {}))
                return _UpdateResult(1)
        if upsert:
            self.docs.append(
                {"_id": str(uuid.uuid4()), **query, **update.get("$set", {})}
            )
            return _UpdateResult(1)
        return _UpdateResult(0)

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if _matches(doc, query):
                return dict(doc)
        return None

    def find(self, query=None, projection=None):
        return _MemoryCursor(dict(doc) for doc in self.docs if _matches(doc, query or {}))

    async def count_documents(self, query=None):
        return sum(1 for doc in self.docs if _matches(doc, query or {}))

    async def delete_one(self, query):
        for index, doc in enumerate(self.docs):
            if _matches(doc, query):
                del self.docs[index]
                return _DeleteResult(1)
        return _DeleteResult(0)

    def aggregate(self, pipeline):
        # mongo_service computes analytics in Python for the memory path,
        # so an empty cursor here is enough to keep the API shape.
        return _MemoryCursor([])


class _MemoryDB:
    def __init__(self):
        self.predictions = _MemoryCollection()
        self.users = _MemoryCollection()

    def __getitem__(self, name):
        return getattr(self, name)


# Always available, used whenever a real Mongo call fails.
memory_db = _MemoryDB()

try:
    import motor.motor_asyncio

    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=1500)
    db = client[DB_NAME]
except ImportError:
    logger.warning("motor is not installed - using in-memory storage only.")
    client = None
    db = memory_db
