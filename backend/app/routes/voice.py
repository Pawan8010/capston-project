from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.security import verify_token
from app.services.chat_service import answer_with_fallback

router = APIRouter()

class VoiceQueryPayload(BaseModel):
    text: str
    language: str
    breed: Optional[str] = None
    confidence: Optional[float] = None
    history: Optional[list[dict]] = None

@router.post("/")
async def voice_query(payload: VoiceQueryPayload, user=Depends(verify_token)):
    """
    Accepts voice/text query, returns a contextual answer about livestock.
    """
    response, source = answer_with_fallback(
        text=payload.text,
        language=payload.language,
        breed=payload.breed,
        history=payload.history or [],
    )
    return {"response": response, "language": payload.language, "source": source}
