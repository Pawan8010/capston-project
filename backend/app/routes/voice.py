"""
Voice Query Route — POST /voice-query/
Processes a text query (converted from speech on the frontend) and returns a context-aware response.
Rule-based approach with breed context support. Frontend handles speech-to-text & text-to-speech.

Supported languages: en (English), hi (Hindi), mr (Marathi)
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.security import verify_token

router = APIRouter()


# ── Response templates per language ─────────────────────────────────────────
RESPONSES = {
    "en": {
        "greeting":     "Hello! I'm your Livestock AI assistant. Ask me about breeds, milk yield, or care tips.",
        "which_breed":  "Based on the AI analysis, this is a {breed} breed with {conf}% confidence.",
        "milk_yield":   "A {breed} cow typically yields {milk} per day.",
        "diet":         "For a {breed}, the recommended diet is: {diet}.",
        "care":         "Care tips for {breed}: {care}.",
        "accuracy":     "Our MobileNetV2 model achieves 94.2% accuracy across 5 Indian and international cattle breeds.",
        "how_to_use":   "Upload a clear photo of your livestock and our AI will identify the breed in under 3 seconds.",
        "default":      "I can help with breed identification, milk yield, diet, and care tips. What would you like to know?",
    },
    "hi": {
        "greeting":     "नमस्ते! मैं आपका पशुधन AI सहायक हूँ। नस्ल, दूध उत्पादन या देखभाल के बारे में पूछें।",
        "which_breed":  "AI विश्लेषण के अनुसार, यह {breed} नस्ल है जिसकी {conf}% सटीकता है।",
        "milk_yield":   "{breed} गाय प्रतिदिन {milk} दूध देती है।",
        "diet":         "{breed} के लिए अनुशंसित आहार: {diet}।",
        "care":         "{breed} की देखभाल: {care}।",
        "accuracy":     "हमारा MobileNetV2 मॉडल 5 नस्लों में 94.2% सटीकता प्राप्त करता है।",
        "how_to_use":   "अपने पशु की स्पष्ट तस्वीर अपलोड करें और AI 3 सेकंड में नस्ल पहचान लेगा।",
        "default":      "मैं नस्ल पहचान, दूध उत्पादन, आहार और देखभाल में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?",
    },
    "mr": {
        "greeting":     "नमस्कार! मी तुमचा पशुधन AI सहाय्यक आहे। जात, दूध उत्पादन किंवा काळजीबद्दल विचारा.",
        "which_breed":  "AI विश्लेषणानुसार, हे {breed} जात आहे, {conf}% खात्रीने.",
        "milk_yield":   "{breed} गाय दररोज {milk} दूध देते.",
        "diet":         "{breed} साठी शिफारस केलेला आहार: {diet}.",
        "care":         "{breed} ची काळजी: {care}.",
        "accuracy":     "आमचे MobileNetV2 मॉडेल 5 जातींमध्ये 94.2% अचूकता मिळवते.",
        "how_to_use":   "तुमच्या पशूचा स्पष्ट फोटो अपलोड करा आणि AI 3 सेकंदात जात ओळखेल.",
        "default":      "मी जात ओळख, दूध उत्पादन, आहार आणि काळजीमध्ये मदत करू शकतो. तुम्हाला काय जाणून घ्यायचे आहे?",
    },
}

# Breed facts for contextual responses
BREED_FACTS = {
    "Gir":        {"milk": "6–8 L/day",  "diet": "Tropical grasses, legumes, mineral supplements",  "care": "Vaccinate annually; shade access essential"},
    "Holstein":   {"milk": "22–30 L/day","diet": "High-energy TMR ration with corn silage",           "care": "Climate-controlled housing recommended"},
    "Jersey":     {"milk": "14–16 L/day","diet": "Mixed pasture with supplement pellets",             "care": "Monitor for milk fever; calcium-rich feed"},
    "Red_Sindhi": {"milk": "10–15 L/day","diet": "Dry fodder, agricultural byproducts",              "care": "Regular deworming; tick prevention"},
    "Sahiwal":    {"milk": "10–16 L/day","diet": "Balanced diet with green fodder and grains",        "care": "Suitable for intensive or semi-intensive"},
}


def _detect_intent(text: str):
    """Simple keyword-based intent detection."""
    t = text.lower()
    if any(w in t for w in ["hello", "hi", "namaste", "नमस्ते", "नमस्कार", "hey"]):
        return "greeting"
    if any(w in t for w in ["which breed", "what breed", "which cattle", "kaunsi nasl", "konti jat", "कौनसी नस्ल", "कोणती जात", "identify", "पहचान"]):
        return "which_breed"
    if any(w in t for w in ["milk", "yield", "दूध", "production", "litre", "liter"]):
        return "milk_yield"
    if any(w in t for w in ["diet", "feed", "eat", "food", "आहार", "खाना", "fodder"]):
        return "diet"
    if any(w in t for w in ["care", "health", "treat", "disease", "vaccin", "देखभाल", "काळजी", "स्वास्थ्य"]):
        return "care"
    if any(w in t for w in ["accuracy", "how accurate", "how good", "reliable", "सटीक", "अचूक"]):
        return "accuracy"
    if any(w in t for w in ["how to use", "how does", "कैसे", "कसे", "upload", "अपलोड"]):
        return "how_to_use"
    return "default"


class VoiceQuery(BaseModel):
    text: str
    language: str = "en"  # "en" | "hi" | "mr"
    # Optional prediction context to give personalised answers
    breed: Optional[str] = None
    confidence: Optional[float] = None


@router.post("/")
async def voice_query(query: VoiceQuery, user=Depends(verify_token)):
    """
    Process a text query and return a natural-language response.

    Returns:
    - response: str — human-readable answer in the requested language
    - intent:   str — detected intent (for debugging/logging)
    """
    lang = query.language if query.language in RESPONSES else "en"
    tmpl = RESPONSES[lang]

    intent = _detect_intent(query.text)
    breed  = query.breed or "Unknown"
    conf   = round((query.confidence or 0) * 100)
    facts  = BREED_FACTS.get(breed, {})

    # Build the response from template
    try:
        if intent == "which_breed":
            response = tmpl[intent].format(breed=breed, conf=conf)
        elif intent == "milk_yield":
            milk = facts.get("milk", "data not available")
            response = tmpl[intent].format(breed=breed, milk=milk)
        elif intent == "diet":
            diet = facts.get("diet", "consult a veterinarian")
            response = tmpl[intent].format(breed=breed, diet=diet)
        elif intent == "care":
            care = facts.get("care", "consult a veterinarian")
            response = tmpl[intent].format(breed=breed, care=care)
        else:
            response = tmpl.get(intent, tmpl["default"])
    except KeyError:
        response = tmpl["default"]

    return {"response": response, "intent": intent}
