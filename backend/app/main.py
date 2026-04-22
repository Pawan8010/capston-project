from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.firebase_admin  # initializes Firebase Admin SDK on startup
from app.routes import predict, auth, history

app = FastAPI(title="Livestock AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/predict", tags=["Prediction"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(history.router, prefix="/history", tags=["History"])

@app.get("/")
def root():
    return {"message": "Livestock AI API is running"}
