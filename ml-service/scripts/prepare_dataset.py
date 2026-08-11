"""
Turn the raw Hugging Face download into a clean train/val/test image dataset.

The raw repo ships every breed twice — once under "<Group> Breeds/" and again
under "<Group> Images/" — and the two overlap heavily. It also contains corrupt
files, duplicates saved at different qualities, and a long tail of breeds with
only 7-15 photos. All of that has to go before training, otherwise the same
photo lands in both train and test and the reported accuracy is a lie.

Pipeline:
  1. Walk data/raw and group files by normalised class name (Cattle_Gir, ...).
  2. Open every file with PIL and re-encode to RGB JPEG; drop anything corrupt.
  3. De-duplicate on a hash of the decoded 64x64 pixels, so re-encodes and
     resizes of the same photo collapse to one copy.
  4. Drop classes left with fewer than --min-images photos.
  5. Stratified split into train/val/test with a fixed seed.
  6. Write data/{train,val,test}/<Class>/*.jpg plus a manifest and class list.

Usage:
    python ml-service/scripts/prepare_dataset.py
    python ml-service/scripts/prepare_dataset.py --min-images 60
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = False

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
MANIFEST_PATH = DATA_DIR / "dataset_manifest.csv"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
SPLITS = ("train", "val", "test")

# The raw folder names are inconsistent: "Nili_Ravi" vs "Nili Ravi",
# "Red Kandhari" vs "Red_Kandhari", "Malnad_gidda" vs "Malnad Gidda".
# Normalise to Title_Case_With_Underscores so both spellings merge.
CANONICAL_OVERRIDES = {
    "Nili_Ravi": "Nili_Ravi",
    "Red_Kandhari": "Red_Kandhari",
    "Malnad_Gidda": "Malnad_Gidda",
    "Krishna_Valley": "Krishna_Valley",
    "Red_Sindhi": "Red_Sindhi",
    "South_Kanara": "South_Kanara",
    "Karan_Swiss": "Karan_Swiss",
    "Ongole_Dwarf_(Kavali)": "Ongole_Dwarf",
}

# Matched case-insensitively: str.capitalize() lowercases anything after a
# leading punctuation character, so "(Kavali)" arrives as "(kavali)" and an
# exact-case lookup would silently miss.
_OVERRIDES_CI = {key.lower(): value for key, value in CANONICAL_OVERRIDES.items()}


def canonical_class(group: str, breed: str) -> str:
    """Cattle/Buffalo prefix + normalised breed name."""
    cleaned = re.sub(r"[\s\-]+", "_", breed.strip())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    cleaned = "_".join(part.capitalize() for part in cleaned.split("_"))
    cleaned = _OVERRIDES_CI.get(cleaned.lower(), cleaned)
    return f"{group}_{cleaned}"


def detect_group(path: Path) -> str | None:
    """Infer Cattle vs Buffalo from the '<Group> Breeds'/'<Group> Images' folder."""
    for part in path.parts:
        lowered = part.lower()
        if lowered.startswith("buffalo"):
            return "Buffalo"
        if lowered.startswith("cattle"):
            return "Cattle"
    return None


def pixel_hash(image: Image.Image) -> str:
    """Hash decoded pixels so re-encodes/resizes of one photo collapse together."""
    thumb = image.convert("RGB").resize((64, 64), Image.BILINEAR)
    return hashlib.sha256(thumb.tobytes()).hexdigest()


def collect(raw_dir: Path) -> tuple[dict[str, list[tuple[Path, Image.Image]]], dict[str, int]]:
    buckets: dict[str, list[tuple[Path, str]]] = defaultdict(list)
    seen: set[str] = set()
    stats = {"scanned": 0, "corrupt": 0, "duplicate": 0, "no_group": 0, "kept": 0}

    files = sorted(p for p in raw_dir.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES)
    for path in files:
        if ".cache" in path.parts:
            continue
        stats["scanned"] += 1

        group = detect_group(path.relative_to(raw_dir))
        if group is None:
            stats["no_group"] += 1
            continue

        try:
            with Image.open(path) as img:
                img.load()
                digest = pixel_hash(img)
        except Exception:
            stats["corrupt"] += 1
            continue

        if digest in seen:
            stats["duplicate"] += 1
            continue
        seen.add(digest)

        buckets[canonical_class(group, path.parent.name)].append((path, digest))
        stats["kept"] += 1

        if stats["scanned"] % 500 == 0:
            print(f"   scanned {stats['scanned']}/{len(files)} ...", flush=True)

    return buckets, stats


def write_split(
    buckets: dict[str, list[tuple[Path, str]]],
    min_images: int,
    seed: int,
    val_frac: float,
    test_frac: float,
) -> tuple[list[str], list[dict]]:
    rng = random.Random(seed)
    kept = {name: items for name, items in buckets.items() if len(items) >= min_images}
    dropped = sorted(
        ((name, len(items)) for name, items in buckets.items() if len(items) < min_images),
        key=lambda item: -item[1],
    )

    print(f"\nKeeping {len(kept)} classes with >= {min_images} images.")
    if dropped:
        preview = ", ".join(f"{name}({count})" for name, count in dropped[:8])
        print(f"Dropping {len(dropped)} sparse classes: {preview}{' ...' if len(dropped) > 8 else ''}")

    for split in SPLITS:
        target = DATA_DIR / split
        if target.exists():
            shutil.rmtree(target)

    class_names = sorted(kept)
    manifest: list[dict] = []

    for class_name in class_names:
        items = list(kept[class_name])
        rng.shuffle(items)

        total = len(items)
        n_test = max(1, round(total * test_frac))
        n_val = max(1, round(total * val_frac))
        # Guarantee train keeps the majority even for the smallest classes.
        n_val = min(n_val, max(1, total - n_test - 1))

        assignments = (
            [("test", item) for item in items[:n_test]]
            + [("val", item) for item in items[n_test : n_test + n_val]]
            + [("train", item) for item in items[n_test + n_val :]]
        )

        for split, (path, digest) in assignments:
            out_dir = DATA_DIR / split / class_name
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"{digest[:16]}.jpg"
            try:
                with Image.open(path) as img:
                    img.convert("RGB").save(out_path, "JPEG", quality=92)
            except Exception:
                continue
            manifest.append(
                {
                    "class": class_name,
                    "split": split,
                    "file": str(out_path.relative_to(DATA_DIR)),
                    "source": str(path.relative_to(RAW_DIR)),
                    "hash": digest,
                }
            )

    return class_names, manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw", default=str(RAW_DIR))
    parser.add_argument("--min-images", type=int, default=40, help="Drop classes below this count")
    parser.add_argument("--val-frac", type=float, default=0.15)
    parser.add_argument("--test-frac", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    raw_dir = Path(args.raw)
    if not raw_dir.exists() or not any(raw_dir.rglob("*.jpg")):
        raise SystemExit(
            f"No raw images at {raw_dir}.\n"
            "Run: python ml-service/scripts/download_dataset.py"
        )

    print(f"Scanning {raw_dir} ...")
    buckets, stats = collect(raw_dir)
    print(
        f"\nScanned {stats['scanned']} files: kept {stats['kept']}, "
        f"{stats['duplicate']} duplicates, {stats['corrupt']} corrupt, "
        f"{stats['no_group']} outside a breed folder."
    )

    class_names, manifest = write_split(
        buckets, args.min_images, args.seed, args.val_frac, args.test_frac
    )

    if len(class_names) < 2:
        raise SystemExit("Need at least 2 classes to train. Lower --min-images.")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    CLASS_NAMES_PATH.write_text(json.dumps(class_names, indent=2), encoding="utf-8")

    with MANIFEST_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["class", "split", "file", "source", "hash"])
        writer.writeheader()
        writer.writerows(manifest)

    counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for row in manifest:
        counts[row["class"]][row["split"]] += 1

    print(f"\n{'class':32s} {'train':>6s} {'val':>5s} {'test':>5s}")
    print("-" * 52)
    for name in class_names:
        row = counts[name]
        print(f"{name:32s} {row['train']:6d} {row['val']:5d} {row['test']:5d}")

    totals = {split: sum(1 for row in manifest if row["split"] == split) for split in SPLITS}
    print("-" * 52)
    print(f"{'TOTAL':32s} {totals['train']:6d} {totals['val']:5d} {totals['test']:5d}")
    print(f"\nClasses written to {CLASS_NAMES_PATH}")
    print(f"Manifest written to {MANIFEST_PATH}")
    print("\nNext: python ml-service/train.py")


if __name__ == "__main__":
    sys.exit(main())
