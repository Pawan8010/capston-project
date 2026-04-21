from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import predict, auth, history

app = FastAPI(title="Livestock AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
