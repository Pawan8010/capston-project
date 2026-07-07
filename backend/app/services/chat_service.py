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
        self.api_key = api_key if api_key is not None else os.getenv("OPENAI_API_KEY", "")
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.client = client

    def _client(self):
        if self.client is not None:
            return self.client
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise RuntimeError("openai package is not installed") from exc
        self.client = OpenAI(api_key=self.api_key, timeout=15)
        return self.client

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
        client = self._client()
        safe_history = []
        for item in (history or [])[-10:]:
            role = item.get("role")
            content = item.get("content")
            if role in {"user", "assistant"} and isinstance(content, str):
                safe_history.append({"role": role, "content": content[:1200]})

        messages = [
            {"role": "system", "content": self._system_prompt(breed)},
            *safe_history,
            {
                "role": "user",
                "content": f"Language hint: {language}. User question: {text}",
            },
        ]
        response = client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3,
            max_tokens=420,
        )
        return response.choices[0].message.content.strip()


def answer_with_fallback(
    text: str,
    language: str = "en",
    breed: str | None = None,
    history: list[dict] | None = None,
    service: ChatService | None = None,
) -> tuple[str, str]:
    chat = service or ChatService()
    try:
        return chat.answer(text=text, language=language, breed=breed, history=history), "openai"
    except Exception as exc:
        logger.warning("OpenAI chat unavailable, using rule-based fallback: %s", exc)
        return rule_based_response(text=text, language=language, breed=breed), "fallback"
