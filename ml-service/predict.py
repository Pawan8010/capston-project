"""
Command-line breed prediction - for testing a trained model without the API.

It reuses the backend's BreedPredictor so the CLI and the running service share
exactly one preprocessing and decoding path. If they drifted apart, a photo could
score differently here than through /api/predict, which makes debugging useless.

Usage:
    python ml-service/predict.py path/to/cow.jpg
    python ml-service/predict.py path/to/cow.jpg --top 10
    python ml-service/predict.py photos/*.jpg
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
MODEL_DIR = BASE_DIR / "models"

# The Windows console defaults to cp1252, which cannot encode the box-drawing
# and block characters used below — printing a result would raise instead of
# showing it. Ask for UTF-8 and fall back to replacement characters rather
# than failing on a terminal that cannot do it.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):  # pragma: no cover - exotic streams
        pass

# Reuse the backend implementation rather than duplicating it here.
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.services.ml_service import BreedPredictor, ModelUnavailableError  # noqa: E402
from app.services.breed_info import get_breed_info  # noqa: E402


def build_predictor() -> BreedPredictor:
    return BreedPredictor(
        model_path=str(MODEL_DIR / "breed_model.pt"),
        class_index_path=str(MODEL_DIR / "class_names.json"),
        meta_path=str(MODEL_DIR / "model_meta.json"),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("images", nargs="+", help="Image file(s) to classify")
    parser.add_argument("--top", type=int, default=5, help="How many candidates to show")
    parser.add_argument("--json", action="store_true", help="Emit raw JSON instead of a table")
    parser.add_argument("--info", action="store_true", help="Also print the breed care card")
    args = parser.parse_args()

    predictor = build_predictor()
    if predictor.model is None:
        print(f"No model loaded: {predictor.unavailable_reason}", file=sys.stderr)
        print(
            "Train one with:\n"
            "  python ml-service/scripts/download_dataset.py\n"
            "  python ml-service/scripts/prepare_dataset.py\n"
            "  python ml-service/train.py",
            file=sys.stderr,
        )
        return 2

    print(f"Model: {predictor.meta.get('arch', 'unknown')} | {len(predictor.labels)} classes\n")

    exit_code = 0
    for raw_path in args.images:
        path = Path(raw_path)
        if not path.exists():
            print(f"{path}: not found", file=sys.stderr)
            exit_code = 1
            continue

        try:
            result = predictor.predict(path.read_bytes())
        except (ModelUnavailableError, ValueError) as exc:
            print(f"{path}: {exc}", file=sys.stderr)
            exit_code = 1
            continue

        if args.json:
            print(json.dumps(result, indent=2))
            continue

        print(f"── {path.name}")
        print(f"   {result['primary_breed'].replace('_', ' ')}  ({result['confidence']:.1f}%)")
        for entry in result["top_predictions"][: args.top]:
            bar = "█" * max(1, round(entry["confidence"] / 4))
            print(f"     {entry['breed'].replace('_', ' '):28s} {entry['confidence']:5.1f}%  {bar}")

        if result["crossbreed_ratio"] > 0.15:
            print(
                f"   Possible cross with {result['secondary_breed'].replace('_', ' ')} "
                f"({result['crossbreed_ratio'] * 100:.0f}% of the top-two mass)"
            )

        if args.info:
            info = get_breed_info(result["primary_breed"])
            if info:
                print(f"     milk    : {info.get('milk_yield', '-')}")
                print(f"     climate : {info.get('climate', '-')}")
                print(f"     feed    : {info.get('feed', '-')}")
        print()

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
