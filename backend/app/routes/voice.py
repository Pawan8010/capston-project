from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.security import verify_token
from app.services.breed_info import BREED_INFO

router = APIRouter()

class VoiceQueryPayload(BaseModel):
    text: str
    language: str
    breed: Optional[str] = None
    confidence: Optional[float] = None

@router.post("/")
async def voice_query(payload: VoiceQueryPayload, user=Depends(verify_token)):
    """
    Accepts voice/text query, returns a contextual answer about livestock.
    """
    text = payload.text.lower()
    breed = payload.breed
    
    # 1. Provide info about current breed if context exists
    if breed and breed in BREED_INFO:
        info = BREED_INFO[breed]
        
        if "milk" in text or "yield" in text:
            response = f"The {breed.replace('_', ' ')} breed typically yields {info['milk_yield']}."
        elif "feed" in text or "diet" in text or "eat" in text:
            response = f"For a {breed.replace('_', ' ')}, the recommended feed is {info['feed']}."
        elif "disease" in text or "health" in text or "sick" in text:
            risks = ", ".join(info.get("disease_risks", []))
            response = f"Watch out for these diseases in {breed.replace('_', ' ')}: {risks}."
        elif "weight" in text:
            response = f"The average weight of a {breed.replace('_', ' ')} is {info['avg_weight_kg']} kg."
        elif "climate" in text or "weather" in text:
            response = f"The {breed.replace('_', ' ')} breed thrives in {info['climate']} climates."
        else:
            response = f"You asked about {text}. I know this is a {breed.replace('_', ' ')}. They are best for {info['best_for']}."
    
    # 2. General livestock questions (fallback)
    elif "which breed" in text or "what breed" in text:
        response = "Please scan the animal using the camera or upload a photo to identify the breed."
    elif "milk" in text:
        response = "Different breeds have different milk yields. For example, Holsteins yield 25-35 liters per day, while Gir yields 10-15 liters."
    else:
        response = "I am your livestock AI assistant. I can answer questions about milk yield, feed, diseases, and climate for various breeds. Please upload a photo or mention a breed."

    # Return response (Multilingual support is currently handled client-side via Text-to-Speech)
    return {"response": response, "language": payload.language}
