import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase_admin is not installed. Firebase token verification is disabled.")


def resolve_credential_path() -> Path:
    backend_root = Path(__file__).resolve().parents[1]
    raw_path = os.getenv("FIREBASE_CREDENTIALS_PATH", str(backend_root / "firebase-adminsdk.json"))
    path = Path(raw_path)
    if not path.is_absolute():
        candidate = Path.cwd() / path
        if candidate.exists():
            return candidate
        return backend_root.parent / path
    return path


cred_path = resolve_credential_path()

if FIREBASE_AVAILABLE and not firebase_admin._apps:
    if not cred_path.exists():
        logger.warning(
            "Firebase Admin disabled - place your service account JSON at backend/firebase-adminsdk.json "
            "or set FIREBASE_CREDENTIALS_PATH env var. Auth endpoints will run in dev-mock mode only when "
            "AUTH_ALLOW_MOCK=true."
        )
    else:
        try:
            cred = credentials.Certificate(str(cred_path))
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized from %s", cred_path)
        except Exception as exc:
            logger.error("Failed to initialize Firebase Admin from %s: %s", cred_path, exc)
