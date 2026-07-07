from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "livestockai"
    MODEL_PATH: str = "ml-service/models/breed_model.h5"
    CLASS_INDEX_PATH: str = "ml-service/models/class_indices.json"
    FIREBASE_CREDENTIALS_PATH: str = "backend/firebase-adminsdk.json"
    BLUR_THRESHOLD: float = 100.0
    AUTH_ALLOW_MOCK: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
