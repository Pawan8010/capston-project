from fastapi import HTTPException, Header
from app.core.config import settings

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

async def verify_token(authorization: str = Header(None)):
    if settings.AUTH_ALLOW_MOCK and authorization == "Bearer demo-token":
        return {"uid": "demo_user_123", "email": "demo@livestock.ai", "role": "farmer"}

    if settings.AUTH_ALLOW_MOCK and (not FIREBASE_AVAILABLE or not firebase_admin._apps):
        return {"uid": "mock_user_123", "email": "test@example.com"}

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
