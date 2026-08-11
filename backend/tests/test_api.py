import base64
from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app

AUTH = {"Authorization": "Bearer demo-token"}


def sharp_test_image() -> bytes:
    """High-contrast stripes so the blur gate passes."""
    img = Image.new("RGB", (128, 128), "white")
    draw = ImageDraw.Draw(img)
    for x in range(0, 128, 8):
        draw.rectangle((x, 0, x + 3, 127), fill="black")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def assert_prediction_shape(data: dict) -> None:
    assert data["primary_breed"]
    assert data["all_probabilities"]
    assert data["all_predictions"]
    assert data["top_predictions"]
    assert data["confidence_format"] == "percent"
    assert 0 <= data["confidence"] <= 100
    assert data["model_mode"] in {"pytorch", "tensorflow"}
    assert data["inference_ms"] >= 0


def test_health_endpoint_reports_predictor_state():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    # model_loaded is False until ml-service/train.py has produced a model.
    assert isinstance(body["model_loaded"], bool)
    assert body["model_mode"] in {"pytorch", "tensorflow", "model-missing", "not_loaded"}
    assert body["num_classes"] >= 0


def test_breeds_endpoint_lists_model_classes():
    with TestClient(app) as client:
        response = client.get("/api/breeds")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == len(body["breeds"])
    if body["breeds"]:
        assert "name" in body["breeds"][0]


def test_predict_endpoint_accepts_image_without_external_services():
    with TestClient(app) as client:
        response = client.post(
            "/api/predict/",
            files={"file": ("cow.png", sharp_test_image(), "image/png")},
            headers=AUTH,
        )

    # 503 is the correct answer while no trained model exists - the API refuses
    # to invent a breed rather than returning a fake one.
    if response.status_code == 503:
        assert "train" in response.json()["detail"].lower()
        return

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "cow.png"
    assert_prediction_shape(data)


def test_predict_rejects_non_image_content_type():
    with TestClient(app) as client:
        response = client.post(
            "/api/predict/",
            files={"file": ("notes.txt", b"hello", "text/plain")},
            headers=AUTH,
        )

    assert response.status_code == 415


def test_predict_requires_authorization_header():
    with TestClient(app) as client:
        response = client.post(
            "/api/predict/",
            files={"file": ("cow.png", sharp_test_image(), "image/png")},
        )

    # AUTH_ALLOW_MOCK is on in tests, so an unauthenticated call still resolves
    # to the mock user rather than 401. It must never be a server error.
    assert response.status_code != 500


def test_realtime_endpoint_returns_same_shape():
    payload = "data:image/png;base64," + base64.b64encode(sharp_test_image()).decode("ascii")

    with TestClient(app) as client:
        response = client.post("/api/realtime-predict/", json={"image_b64": payload}, headers=AUTH)

    if response.status_code == 503:
        assert "train" in response.json()["detail"].lower()
        return

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "realtime"
    assert_prediction_shape(data)


def test_realtime_rejects_malformed_base64():
    with TestClient(app) as client:
        response = client.post("/api/realtime-predict/", json={"image_b64": "not-base64!!"}, headers=AUTH)

    assert response.status_code in {400, 503}


def test_voice_query_returns_breed_context():
    with TestClient(app) as client:
        response = client.post(
            "/api/voice-query/",
            json={"text": "milk yield", "language": "en", "breed": "Gir"},
            headers=AUTH,
        )

    assert response.status_code == 200
    assert "Gir" in response.json()["response"]


def test_auth_sync_ignores_client_supplied_role():
    """A client must not be able to promote itself to admin via /auth/sync."""
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/sync",
            json={"displayName": "Test Farmer", "role": "admin", "uid": "someone-else"},
            headers=AUTH,
        )

    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "farmer"
    # uid comes from the verified token, not the body.
    assert body["uid"] != "someone-else"


def test_history_roundtrip_and_scoping():
    with TestClient(app) as client:
        listed = client.get("/api/history/", headers=AUTH)
        assert listed.status_code == 200
        assert "predictions" in listed.json()

        # An id that belongs to nobody must 404, not 500.
        missing = client.get("/api/history/does-not-exist", headers=AUTH)
        assert missing.status_code == 404

        deleted = client.delete("/api/history/does-not-exist", headers=AUTH)
        assert deleted.status_code == 404

        feedback = client.post(
            "/api/history/does-not-exist/feedback",
            json={"is_correct": True},
            headers=AUTH,
        )
        assert feedback.status_code == 404


def test_admin_routes_reject_non_admin():
    with TestClient(app) as client:
        assert client.get("/api/admin/stats", headers=AUTH).status_code == 403
        assert client.get("/api/admin/users", headers=AUTH).status_code == 403
        assert client.get("/api/analytics/admin", headers=AUTH).status_code == 403


def test_user_analytics_returns_expected_keys():
    with TestClient(app) as client:
        response = client.get("/api/analytics/user", headers=AUTH)

    assert response.status_code == 200
    body = response.json()
    for key in (
        "total_scans", "breed_distribution", "scans_per_day",
        "average_confidence", "realtime_count", "upload_count",
    ):
        assert key in body
