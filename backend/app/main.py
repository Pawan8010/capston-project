import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import app.firebase_admin  # noqa: F401  - initializes Firebase Admin SDK on import
from app.firebase_admin import firebase_ready
from app.config import client
from app.core.config import settings
from app.routes import admin, analytics, auth, history, predict, realtime, voice
from app.services.ml_service import BreedPredictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Probe MongoDB and load the breed model once, at startup."""
    app.state.mongo_connected = False
    if client is None:
        logger.warning("MongoDB driver unavailable - using in-memory fallback storage.")
    else:
        try:
            await client.admin.command("ping")
            app.state.mongo_connected = True
            logger.info("MongoDB connected.")
        except Exception as exc:
            logger.warning("MongoDB unreachable - using in-memory fallback storage: %s", exc)

    app.state.predictor = BreedPredictor(
        model_path=settings.MODEL_PATH,
        class_index_path=settings.CLASS_INDEX_PATH,
        meta_path=settings.MODEL_META_PATH,
    )
    logger.info(
        "ML predictor ready in %s mode with %s classes.",
        app.state.predictor.mode,
        len(app.state.predictor.labels),
    )

    # When mock auth is on and Firebase Admin never initialised, verify_token
    # cannot check anything and every request — including one with no
    # Authorization header at all — resolves to a signed-in user. That is the
    # intended local-dev fallback, but it must never be mistaken for a
    # protected API, so say so in as many words.
    if settings.AUTH_ALLOW_MOCK and not firebase_ready():
        logger.warning(
            "AUTH IS DISABLED: AUTH_ALLOW_MOCK=true and Firebase Admin is not "
            "initialised, so every request is treated as a signed-in user, even "
            "with no credentials. Fine for local development. Before exposing "
            "this service, set AUTH_ALLOW_MOCK=false and provide a Firebase "
            "service account."
        )

    yield


app = FastAPI(title="LivestockAI API", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    logger.info(
        "%s %s - %s - %.4fs",
        request.method, request.url.path, response.status_code, time.time() - start_time,
    )
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(realtime.router, prefix="/api/realtime-predict", tags=["Realtime"])
app.include_router(voice.router, prefix="/api/voice-query", tags=["Voice"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/health")
def health_check():
    predictor = getattr(app.state, "predictor", None)
    return {
        "status": "ok",
        "model_loaded": predictor is not None and predictor.model is not None,
        "model_mode": getattr(predictor, "mode", "not_loaded"),
        "model_arch": (predictor.meta.get("arch") if predictor else None),
        "num_classes": len(predictor.labels) if predictor else 0,
        "mongo_connected": getattr(app.state, "mongo_connected", False),
        # False means tokens are not being verified and every request resolves
        # to a signed-in user. Surfaced so this is visible from outside the
        # process, not only in the startup log.
        "auth_enforced": firebase_ready() or not settings.AUTH_ALLOW_MOCK,
        "version": "1.0.0",
    }


@app.get("/api/breeds")
def list_breeds():
    """Breeds the loaded model can predict, with their info cards."""
    from app.services.breed_info import get_breed_info

    predictor = getattr(app.state, "predictor", None)
    labels = predictor.labels if predictor else []
    return {
        "count": len(labels),
        "breeds": [{"name": label, **(get_breed_info(label) or {})} for label in labels],
    }


@app.get("/")
def root():
    return {"message": "LivestockAI API is running", "docs": "/docs", "health": "/health"}
