import os
import logging

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase_admin not installed. Running without Firebase.")

cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-adminsdk.json")

if FIREBASE_AVAILABLE and not firebase_admin._apps:
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        logger.error(f"Failed to initialize firebase_admin: {e}")
