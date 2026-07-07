from io import BytesIO
import base64

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from app.main import app


client = TestClient(app)


def sharp_test_image():
    img = Image.new("RGB", (128, 128), "white")
    draw = ImageDraw.Draw(img)
    for x in range(0, 128, 8):
        draw.rectangle((x, 0, x + 3, 127), fill="black")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health_endpoint_reports_predictor():
    with TestClient(app) as local_client:
        response = local_client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["model_loaded"] is True


def test_predict_endpoint_accepts_image_without_external_services():
    with TestClient(app) as local_client:
        response = local_client.post(
            "/api/predict/",
            files={"file": ("cow.png", sharp_test_image(), "image/png")},
            headers={"Authorization": "Bearer demo-token"},
        )

    if response.status_code == 503:
        assert "Train the model first" in response.json()["detail"]
        return

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "cow.png"
    assert data["primary_breed"]
    assert data["model_mode"] == "tensorflow"
    assert data["all_probabilities"]
    assert data["all_predictions"]
    assert data["confidence_format"] == "percent"
    assert data["inference_ms"] >= 0


def test_voice_query_returns_breed_context():
    response = client.post(
        "/api/voice-query/",
        json={"text": "milk yield", "language": "en", "breed": "Gir"},
        headers={"Authorization": "Bearer demo-token"},
    )

    assert response.status_code == 200
    assert "Gir" in response.json()["response"]


def test_realtime_endpoint_returns_result_artifact_shape():
    payload = "data:image/png;base64," + base64.b64encode(sharp_test_image()).decode("ascii")

    with TestClient(app) as local_client:
        response = local_client.post(
            "/api/realtime-predict/",
            json={"image_b64": payload},
            headers={"Authorization": "Bearer demo-token"},
        )

    if response.status_code == 503:
        assert "Train the model first" in response.json()["detail"]
        return

    assert response.status_code == 200
    data = response.json()
    assert data["primary_breed"]
    assert data["all_probabilities"]
    assert data["all_predictions"]
    assert data["confidence_format"] == "percent"
    assert data["inference_ms"] >= 0
