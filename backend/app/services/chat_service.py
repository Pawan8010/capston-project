import logging
import os
from typing import Any

from app.services.breed_info import BREED_INFO, get_breed_info

logger = logging.getLogger(__name__)


def rule_based_response(text: str, language: str = "en", breed: str | None = None) -> str:
    query = (text or "").lower()

    if breed:
        info = get_breed_info(breed)
        display_breed = breed.replace("_", " ")
        if info:
            if "milk" in query or "yield" in query:
                return f"The {display_breed} breed typically yields {info['milk_yield']}."
            if "feed" in query or "diet" in query or "eat" in query:
                return f"For a {display_breed}, the recommended feed is {info['feed']}."
            if "disease" in query or "health" in query or "sick" in query:
                risks = ", ".join(info.get("disease_risks", []))
                return f"Watch out for these diseases in {display_breed}: {risks}."
            if "weight" in query:
                return f"The average weight of a {display_breed} is {info['avg_weight_kg']} kg."
            if "climate" in query or "weather" in query:
                return f"The {display_breed} breed thrives in {info['climate']} climates."
            return f"This looks like {display_breed}. It is best for {info['best_for']}."

    if "which breed" in query or "what breed" in query:
        return "Please scan the animal using the camera or upload a photo to identify the breed."
    if "milk" in query:
        return "Different breeds have different milk yields. Holstein often yields 25-35 litres/day, while Gir often yields 10-15 litres/day."
    return "I am your livestock AI assistant. I can answer questions about milk yield, feed, diseases, climate, and breed care for the supported breeds."


class ChatService:
    def __init__(self, client: Any | None = None, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key if api_key is not None else os.getenv("GEMINI_API_KEY", "")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(self.model)
            except ImportError:
                self.client = None
        else:
            self.client = None

    def _system_prompt(self, breed: str | None) -> str:
        supported = ", ".join(["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"])
        breed_context = get_breed_info(breed or "")
        return (
            "You are LivestockAI's dairy and cattle assistant. "
            f"The app supports these breed classes: {supported}. "
            "Answer practically for farmers using only the provided breed data when a breed fact is requested. "
            "If the data does not contain a fact, say you do not know instead of inventing numbers. "
            f"Known breed database: {BREED_INFO}. "
            f"Current detected breed context: {breed or 'none'}. "
            f"Current breed info: {breed_context or {}}."
        )

    def answer(self, text: str, language: str = "en", breed: str | None = None, history: list[dict] | None = None) -> str:
        if not self.client:
            raise RuntimeError("Gemini client not initialized. Check API key and google-generativeai installation.")
        
        system_instruction = self._system_prompt(breed)
        
        # Format history for Gemini
        formatted_history = []
        for item in (history or [])[-10:]:
            role = item.get("role")
            content = item.get("content")
            if role in {"user", "assistant"} and isinstance(content, str):
                formatted_role = "model" if role == "assistant" else "user"
                formatted_history.append({"role": formatted_role, "parts": [content[:1200]]})
        
        try:
            chat_session = self.client.start_chat(history=formatted_history)
            prompt = f"System Rules: {system_instruction}\n\nLanguage hint: {language}\nUser question: {text}"
            response = chat_session.send_message(prompt)
            return response.text.strip()
        except Exception as e:
            raise RuntimeError(f"Gemini API Error: {str(e)}")


def answer_with_fallback(
    text: str,
    language: str = "en",
    breed: str | None = None,
    history: list[dict] | None = None,
    service: ChatService | None = None,
) -> tuple[str, str]:
    chat = service or ChatService()
    try:
        return chat.answer(text=text, language=language, breed=breed, history=history), "gemini"
    except Exception as exc:
        logger.warning("Gemini chat unavailable, using rule-based fallback: %s", exc)
        return rule_based_response(text=text, language=language, breed=breed), "fallback"
