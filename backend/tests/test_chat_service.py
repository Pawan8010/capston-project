from app.services.chat_service import ChatService, answer_with_fallback


def test_chat_service_falls_back_without_key():
    response, source = answer_with_fallback(
        text="milk yield",
        language="en",
        breed="Gir",
        service=ChatService(api_key=""),
    )

    assert source == "fallback"
    assert "Gir" in response


class _FakeMessage:
    content = "Use clean water, balanced fodder, and call a vet for urgent symptoms."


class _FakeChoice:
    message = _FakeMessage()


class _FakeResponse:
    choices = [_FakeChoice()]


class _FakeCompletions:
    def create(self, **kwargs):
        return _FakeResponse()


class _FakeChat:
    completions = _FakeCompletions()


class _FakeClient:
    chat = _FakeChat()


def test_chat_service_returns_mocked_openai_response():
    service = ChatService(client=_FakeClient(), api_key="test")

    response, source = answer_with_fallback(
        text="care advice",
        language="en",
        breed="Jersey",
        service=service,
    )

    assert source == "openai"
    assert "balanced fodder" in response
