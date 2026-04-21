import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()  # loads backend/.env automatically

# MongoDB connection — database: finalyearproject
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/finalyearproject")
DB_NAME   = os.getenv("DB_NAME",   "finalyearproject")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db     = client[DB_NAME]
