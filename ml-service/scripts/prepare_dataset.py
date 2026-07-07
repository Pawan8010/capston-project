"""
Prepare a 5-class cattle breed dataset for LivestockAI.

This script downloads community cattle-breed datasets from Kaggle when Kaggle
credentials are configured, keeps only the target classes, removes corrupt and
duplicate images, and writes fixed train/val/test splits plus a manifest.

Important: public livestock datasets are community collected and can contain
mislabeled images. Visually spot-check every class folder before training.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import logging
import os
import random
import shutil
import subprocess
import sys
import tempfile
import zipfile
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image

LOGGER = logging.getLogger("prepare_dataset")

TARGET_CLASSES = ["Gir", "Holstein", "Jersey", "Red_Sindhi", "Sahiwal"]
MIN_IMAGES_PER_CLASS = 150
RANDOM_SEED = 42
DATASETS = [
    "atharvadarpude/indian-cattle-image-dataset",
    "anandkumarsahu09/cattle-breeds-dataset",
    "zaidworks0508/cow-breed-classification-dataset",
    "priyanshu594/cattle-breeds",
]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


@dataclass(frozen=True)
class ImageRecord:
    source_path: Path
    class_name: str
    source_dataset: str
    sha256: str


def normalize_name(value: str) -> str:
    return "".join(ch for ch in value.lower() if ch.isalnum())


def normalize_dataset_ref(value: str) -> str:
    """
    Accept either a Kaggle slug (owner/dataset) or a URL such as
    https://www.kaggle.com/datasets/owner/dataset.
    """
    text = value.strip().rstrip("/")
    parsed = urlparse(text)
    if parsed.scheme and parsed.netloc:
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) >= 3 and parts[0] == "datasets":
            return f"{parts[1]}/{parts[2]}"
    return text


ALIASES = {
    "gir": "Gir",
    "gircow": "Gir",
    "gircattle": "Gir",
    "holstein": "Holstein",
    "holsteinfriesian": "Holstein",
    "friesian": "Holstein",
    "hf": "Holstein",
    "jersey": "Jersey",
    "jerseycow": "Jersey",
    "redsindhi": "Red_Sindhi",
    "redsindhicow": "Red_Sindhi",
    "red_sindhi": "Red_Sindhi",
    "sindhi": "Red_Sindhi",
    "sahiwal": "Sahiwal",
    "sahiwalcow": "Sahiwal",
}


def map_class(path: Path) -> str | None:
    for part in reversed(path.parts):
        normalized = normalize_name(part)
        if normalized in ALIASES:
            return ALIASES[normalized]
    return None


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_image(path: Path) -> bool:
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            image.convert("RGB")
        return True
    except Exception:
        return False


def run_kaggle_download(dataset: str, destination: Path) -> bool:
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists() and not (os.getenv("KAGGLE_USERNAME") and os.getenv("KAGGLE_KEY")):
        LOGGER.warning(
            "Skipping %s because Kaggle credentials were not found. Add %s or set KAGGLE_USERNAME/KAGGLE_KEY.",
            dataset,
            kaggle_json,
        )
        return False

    commands = [
        [sys.executable, "-m", "kaggle", "datasets", "download", "-d", dataset, "-p", str(destination), "--unzip"],
        ["kaggle", "datasets", "download", "-d", dataset, "-p", str(destination), "--unzip"],
    ]
    for command in commands:
        try:
            LOGGER.info("Downloading Kaggle dataset %s", dataset)
            subprocess.run(command, check=True, timeout=1800)
            return True
        except subprocess.TimeoutExpired:
            LOGGER.warning("Kaggle download timed out for %s.", dataset)
            return False
        except (FileNotFoundError, subprocess.CalledProcessError):
            continue
    LOGGER.warning(
        "Could not download %s. Configure Kaggle credentials at %%USERPROFILE%%\\.kaggle\\kaggle.json "
        "or manually place extracted datasets under ml-service/data/raw.",
        dataset,
    )
    return False


def extract_zip_files(raw_dir: Path) -> None:
    for zip_path in raw_dir.rglob("*.zip"):
        target = zip_path.with_suffix("")
        target.mkdir(parents=True, exist_ok=True)
        try:
            with zipfile.ZipFile(zip_path) as archive:
                archive.extractall(target)
        except zipfile.BadZipFile:
            LOGGER.warning("Removing invalid zip file left from an interrupted download: %s", zip_path)
            zip_path.unlink(missing_ok=True)


def collect_records(raw_dir: Path) -> list[ImageRecord]:
    seen_hashes: set[str] = set()
    records: list[ImageRecord] = []
    corrupt = 0
    duplicate = 0

    for image_path in raw_dir.rglob("*"):
        if not image_path.is_file() or image_path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        class_name = map_class(image_path.parent)
        if not class_name:
            continue
        if not verify_image(image_path):
            corrupt += 1
            continue
        file_hash = sha256_file(image_path)
        if file_hash in seen_hashes:
            duplicate += 1
            continue
        seen_hashes.add(file_hash)
        source_dataset = "local-or-manual"
        try:
            relative_parts = image_path.relative_to(raw_dir).parts
            if relative_parts:
                source_dataset = relative_parts[0].replace("__", "/")
        except ValueError:
            pass
        records.append(ImageRecord(image_path, class_name, source_dataset, file_hash))

    LOGGER.info("Collected %s valid images; skipped %s corrupt and %s duplicate files", len(records), corrupt, duplicate)
    return records


def clear_split_dirs(data_dir: Path) -> None:
    for split in ("train", "val", "test"):
        split_dir = data_dir / split
        if split_dir.exists():
            shutil.rmtree(split_dir)
        for class_name in TARGET_CLASSES:
            (split_dir / class_name).mkdir(parents=True, exist_ok=True)


def split_records(records: list[ImageRecord]) -> list[tuple[ImageRecord, str]]:
    random.seed(RANDOM_SEED)
    by_class: dict[str, list[ImageRecord]] = {class_name: [] for class_name in TARGET_CLASSES}
    for record in records:
        by_class[record.class_name].append(record)

    split_rows: list[tuple[ImageRecord, str]] = []
    for class_name, class_records in by_class.items():
        random.shuffle(class_records)
        count = len(class_records)
        if count < MIN_IMAGES_PER_CLASS:
            needed = MIN_IMAGES_PER_CLASS - count
            LOGGER.warning(
                "%s has only %s images. Add about %s more from ICAR-NBAGR, state animal husbandry sites, "
                "or Roboflow Universe Indian cattle breed projects before trusting accuracy.",
                class_name,
                count,
                needed,
            )

        train_end = int(count * 0.8)
        val_end = train_end + int(count * 0.1)
        for index, record in enumerate(class_records):
            split = "train" if index < train_end else "val" if index < val_end else "test"
            split_rows.append((record, split))
    return split_rows


def copy_splits(data_dir: Path, split_rows: list[tuple[ImageRecord, str]]) -> None:
    manifest_path = data_dir / "dataset_manifest.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["filename", "class", "split", "source_dataset", "sha256"])
        writer.writeheader()
        for record, split in split_rows:
            extension = record.source_path.suffix.lower()
            filename = f"{record.sha256[:16]}{extension}"
            destination = data_dir / split / record.class_name / filename
            shutil.copy2(record.source_path, destination)
            writer.writerow(
                {
                    "filename": str(destination.relative_to(data_dir)).replace(os.sep, "/"),
                    "class": record.class_name,
                    "split": split,
                    "source_dataset": record.source_dataset,
                    "sha256": record.sha256,
                }
            )
    LOGGER.info("Wrote manifest to %s", manifest_path)


def print_summary(split_rows: list[tuple[ImageRecord, str]]) -> None:
    counts = defaultdict(lambda: defaultdict(int))
    for record, split in split_rows:
        counts[record.class_name][split] += 1

    print("\nDataset summary")
    print("| class | train | val | test | total |")
    print("|---|---:|---:|---:|---:|")
    grand_total = 0
    for class_name in TARGET_CLASSES:
        train_count = counts[class_name]["train"]
        val_count = counts[class_name]["val"]
        test_count = counts[class_name]["test"]
        total = train_count + val_count + test_count
        grand_total += total
        print(f"| {class_name} | {train_count} | {val_count} | {test_count} | {total} |")
    print(f"| TOTAL | | | | {grand_total} |")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default=Path(__file__).resolve().parents[1] / "data", type=Path)
    parser.add_argument("--skip-download", action="store_true", help="Use files already present under data/raw")
    parser.add_argument(
        "--dataset",
        action="append",
        dest="datasets",
        help="Kaggle dataset slug to download. Repeat to use multiple. Defaults to the known cattle datasets.",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    data_dir = args.data_dir.resolve()
    raw_dir = data_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    LOGGER.warning(
        "Public cattle datasets are not verified ground truth. Spot-check each class folder before training."
    )

    if not args.skip_download:
        with tempfile.TemporaryDirectory(dir=raw_dir) as tmp:
            tmp_dir = Path(tmp)
            for dataset in [normalize_dataset_ref(item) for item in (args.datasets or DATASETS)]:
                dataset_dir = tmp_dir / dataset.replace("/", "__")
                dataset_dir.mkdir(parents=True, exist_ok=True)
                run_kaggle_download(dataset, dataset_dir)
            extract_zip_files(tmp_dir)
            for item in tmp_dir.iterdir():
                destination = raw_dir / item.name
                if destination.exists():
                    for child in item.iterdir():
                        child_destination = destination / child.name
                        if not child_destination.exists():
                            shutil.move(str(child), child_destination)
                    continue
                shutil.move(str(item), destination)

    extract_zip_files(raw_dir)
    records = collect_records(raw_dir)
    if not records:
        LOGGER.error(
            "No usable images were found. Install Kaggle support with `pip install kaggle`, configure "
            "%%USERPROFILE%%\\.kaggle\\kaggle.json, or manually place extracted datasets under %s.",
            raw_dir,
        )
        return 2
    clear_split_dirs(data_dir)
    split_rows = split_records(records)
    copy_splits(data_dir, split_rows)
    print_summary(split_rows)

    LOGGER.info("Prepared %s images in %s", len(split_rows), data_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
