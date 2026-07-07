from io import BytesIO

from PIL import Image

import pytest

from app.services.ml_service import DEFAULT_LABELS, BreedPredictor, ModelUnavailableError


def image_bytes(color=(180, 120, 80)):
    img = Image.new("RGB", (64, 64), color)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_predictor_reports_missing_model_without_guessing(tmp_path):
    predictor = BreedPredictor(
        model_path=str(tmp_path / "missing.h5"),
        class_index_path=str(tmp_path / "missing.json"),
    )

    assert predictor.mode == "model-missing"
    assert predictor.labels == DEFAULT_LABELS
    with pytest.raises(ModelUnavailableError):
        predictor.predict(image_bytes())


def test_predictor_loads_labels_from_class_indices(tmp_path):
    class_index_path = tmp_path / "class_indices.json"
    class_index_path.write_text('{"Holstein": 1, "Gir": 0}', encoding="utf-8")
    predictor = BreedPredictor(
        model_path=str(tmp_path / "missing.h5"),
        class_index_path=str(class_index_path),
    )

    assert predictor.labels == ["Gir", "Holstein"]
