import json
from io import BytesIO
from pathlib import Path

import pytest
from PIL import Image

from app.services.breed_info import get_breed_info
from app.services.ml_service import DEFAULT_LABELS, BreedPredictor, ModelUnavailableError


def image_bytes(color=(180, 120, 80), size=(64, 64)) -> bytes:
    buf = BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


def test_predictor_reports_missing_model_without_guessing(tmp_path):
    predictor = BreedPredictor(
        model_path=str(tmp_path / "missing.pt"),
        class_index_path=str(tmp_path / "missing.json"),
    )

    assert predictor.mode == "model-missing"
    assert predictor.labels == DEFAULT_LABELS
    with pytest.raises(ModelUnavailableError):
        predictor.predict(image_bytes())


def test_predictor_loads_labels_from_class_indices(tmp_path):
    path = tmp_path / "class_indices.json"
    path.write_text('{"Holstein": 1, "Gir": 0}', encoding="utf-8")

    predictor = BreedPredictor(model_path=str(tmp_path / "missing.pt"), class_index_path=str(path))

    assert predictor.labels == ["Gir", "Holstein"]


def test_predictor_loads_labels_from_class_names_list(tmp_path):
    path = tmp_path / "class_names.json"
    path.write_text(json.dumps(["Cattle_Gir", "Buffalo_Murrah"]), encoding="utf-8")

    predictor = BreedPredictor(model_path=str(tmp_path / "missing.pt"), class_index_path=str(path))

    assert predictor.labels == ["Cattle_Gir", "Buffalo_Murrah"]


def test_predictor_reads_preprocessing_meta(tmp_path):
    meta = tmp_path / "model_meta.json"
    meta.write_text(
        json.dumps({"img_size": 260, "mean": [0.5, 0.5, 0.5], "std": [0.5, 0.5, 0.5], "arch": "resnet50"}),
        encoding="utf-8",
    )

    predictor = BreedPredictor(
        model_path=str(tmp_path / "missing.pt"),
        class_index_path=str(tmp_path / "missing.json"),
        meta_path=str(meta),
    )

    assert predictor.img_size == 260
    assert predictor.meta["arch"] == "resnet50"


def test_preprocess_emits_normalised_nchw_tensor(tmp_path):
    predictor = BreedPredictor(
        model_path=str(tmp_path / "missing.pt"),
        class_index_path=str(tmp_path / "missing.json"),
    )

    # Non-square input exercises the resize-shorter-side + centre-crop path.
    arr = predictor.preprocess(Image.new("RGB", (400, 220), (120, 90, 60)))

    assert arr.shape == (1, 3, predictor.img_size, predictor.img_size)
    assert arr.dtype.name == "float32"


@pytest.mark.parametrize(
    "name",
    ["Cattle_Gir", "Gir", "gir", "Red_Sindhi", "Red Sindhi", "Buffalo_Murrah", "murrah"],
)
def test_breed_info_lookup_is_tolerant(name):
    info = get_breed_info(name)
    assert info, f"expected breed info for {name!r}"
    assert info["milk_yield"]
    assert info["species"] in {"Cattle", "Buffalo"}


def test_breed_info_returns_empty_for_unknown_breed():
    assert get_breed_info("Not A Breed") == {}
    assert get_breed_info("") == {}


@pytest.mark.parametrize(
    ("dataset_spelling", "expected_origin_fragment"),
    [
        ("Buffalo_Jaffrabadi", "Gujarat"),
        ("Cattle_Gangatri", "Bihar"),
        ("Buffalo_Luit", "Assam"),
        ("Cattle_Ongole_Dwarf", "Andhra"),
    ],
)
def test_breed_info_resolves_dataset_spellings(dataset_spelling, expected_origin_fragment):
    """
    The training folders spell several breeds differently from the reference
    tables. These resolve through the alias map; without it a breed the model
    genuinely predicts would render with no husbandry guidance at all.
    """
    info = get_breed_info(dataset_spelling)

    assert info, f"no breed info for dataset class {dataset_spelling!r}"
    assert expected_origin_fragment in info["origin"]


def test_every_trained_class_has_breed_info():
    """Guard the model -> guidance seam: each predictable class needs a card."""
    class_names_path = (
        Path(__file__).resolve().parents[2] / "ml-service" / "models" / "class_names.json"
    )
    if not class_names_path.exists():
        pytest.skip("no trained class list yet - run prepare_dataset.py")

    class_names = json.loads(class_names_path.read_text(encoding="utf-8"))
    missing = [name for name in class_names if not get_breed_info(name)]

    assert not missing, f"classes with no breed info: {missing}"
