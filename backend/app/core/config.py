from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> parents[2] == backend/, parents[3] == repo root
BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "livestockai"
    DB_NAME: str = "finalyearproject"

    # Trained by ml-service/train.py. TorchScript so the backend needs torch only.
    MODEL_PATH: str = str(REPO_ROOT / "ml-service" / "models" / "breed_model.pt")
    CLASS_INDEX_PATH: str = str(REPO_ROOT / "ml-service" / "models" / "class_names.json")
    MODEL_META_PATH: str = str(REPO_ROOT / "ml-service" / "models" / "model_meta.json")

    FIREBASE_CREDENTIALS_PATH: str = str(BACKEND_DIR / "firebase-adminsdk.json")
    BLUR_THRESHOLD: float = 100.0
    AUTH_ALLOW_MOCK: bool = False

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Comma-separated emails granted the admin role on first sync.
    ADMIN_EMAILS: str = ""

    # Comma-separated list, or "*" to allow any origin.
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://localhost:5174,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174"
    )

    # Absolute path so the backend finds backend/.env no matter where it is launched from.
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return origins or ["*"]

    @property
    def admin_emails(self) -> set[str]:
        return {email.strip().lower() for email in self.ADMIN_EMAILS.split(",") if email.strip()}


settings = Settings()
