import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()  # loads backend/.env automatically

# MongoDB connection — database: finalyearproject
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/finalyearproject")
DB_NAME   = os.getenv("DB_NAME",   "finalyearproject")

class _InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class _UpdateResult:
    def __init__(self, modified_count=0):
        self.modified_count = modified_count


class _MemoryCursor:
    def __init__(self, docs):
        self.docs = list(docs)

    def sort(self, key, direction):
        reverse = direction < 0
        self.docs.sort(key=lambda doc: doc.get(key, datetime.min), reverse=reverse)
        return self

    def limit(self, limit):
        self.docs = self.docs[:limit]
        return self

    async def to_list(self, length=None):
        return self.docs[:length]

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
        self.docs = []

    async def insert_one(self, doc):
        inserted_id = str(uuid.uuid4())
        self.docs.append({**doc, "_id": inserted_id})
        return _InsertResult(inserted_id)

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                doc.update(update.get("$set", {}))
                return _UpdateResult(1)
        if upsert:
            self.docs.append({**query, **update.get("$set", {})})
            return _UpdateResult(1)
        return _UpdateResult(0)

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def find(self, query=None, projection=None):
        query = query or {}
        docs = [doc for doc in self.docs if all(doc.get(k) == v for k, v in query.items())]
        return _MemoryCursor(docs)

    async def count_documents(self, query):
        return len([doc for doc in self.docs if all(doc.get(k) == v for k, v in query.items())])

    async def delete_one(self, query):
        self.docs = [doc for doc in self.docs if not all(str(doc.get(k)) == str(v) for k, v in query.items())]

    def aggregate(self, pipeline):
        return _MemoryCursor([])


class _MemoryDB:
    def __init__(self):
        self.predictions = _MemoryCollection()
        self.users = _MemoryCollection()


try:
    import motor.motor_asyncio
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=500)
    db = client[DB_NAME]
except ImportError:
    client = None
    db = _MemoryDB()
