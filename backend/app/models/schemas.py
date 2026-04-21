from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class PredictionResponse(BaseModel):
    breed: str
    confidence: float
    all_predictions: Dict[str, float]
    filename: str

class UserSync(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = None

class HistoryRecord(BaseModel):
    id: str
    uid: str
    result: PredictionResponse
    created_at: datetime
