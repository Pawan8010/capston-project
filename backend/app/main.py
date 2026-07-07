from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import app.firebase_admin  # initializes Firebase Admin SDK on startup
from app.routes import predict, auth, history, admin, realtime, voice, analytics
from app.services.ml_service import BreedPredictor
from app.core.config import settings
from app.config import client

app = FastAPI(title="Livestock AI API", version="1.0.0")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(admin.router,    prefix="/api/admin",            tags=["Admin"])
app.include_router(realtime.router, prefix="/api/realtime-predict",  tags=["Realtime"])
app.include_router(voice.router,    prefix="/api/voice-query",        tags=["Voice"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.on_event("startup")
async def startup_event():
    """Load ML model once when the server starts."""
    app.state.mongo_connected = False
    if client is None:
        logger.warning("MongoDB driver unavailable - running with in-memory fallback storage.")
    else:
        try:
            await client.admin.command("ping")
            app.state.mongo_connected = True
            logger.info("MongoDB connected successfully.")
        except Exception as exc:
            logger.warning("MongoDB connection failed - app may use in-memory fallback where implemented: %s", exc)

    app.state.predictor = BreedPredictor(
        model_path=settings.MODEL_PATH,
        class_index_path=settings.CLASS_INDEX_PATH
    )
    logger.info("ML predictor ready in %s mode", app.state.predictor.mode)

@app.get("/health")
def health_check():
    predictor = getattr(app.state, "predictor", None)
    return {
        "status": "ok",
        "model_loaded": predictor is not None,
        "model_mode": getattr(predictor, "mode", "not_loaded"),
        "mongo_connected": getattr(app.state, "mongo_connected", False),
        "version": "1.0.0",
    }

@app.get("/")
def root():
    return {"message": "Livestock AI API is running"}
