from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "livestockai"
    MODEL_PATH: str = "ml_models/livestock_breed_model.h5"
    CLASS_INDEX_PATH: str = "ml_models/class_indices.json"
    BLUR_THRESHOLD: float = 100.0

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
