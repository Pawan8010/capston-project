"""
Download the raw cattle/buffalo breed images from the Hugging Face Hub.

Unlike the Kaggle path, this needs no account or API token — the repo is public.

Source: https://huggingface.co/datasets/mr-rxa/Cattle-Buffalo-Datatset
        (Indian cattle + buffalo breeds, real photographs, ~7k files)

The repo ships each breed twice, under "<Group> Breeds/" and "<Group> Images/".
"<Group> Images/" is a strict subset of "<Group> Breeds/", so we only fetch the
latter - half the download, same photos. prepare_dataset.py still de-duplicates
by content hash because breeds repeat inside a folder too.

Usage:
    python ml-service/scripts/download_dataset.py
    python ml-service/scripts/download_dataset.py --repo other/dataset
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
RAW_DIR = BASE_DIR / "data" / "raw"
DEFAULT_REPO = "mr-rxa/Cattle-Buffalo-Datatset"


def download(repo_id: str, dest: Path, attempts: int = 6) -> Path:
    # The Hub's xet CAS backend intermittently drops connections on large
    # snapshots. Plain HTTP transfer is slower but far more reliable here.
    os.environ.setdefault("HF_HUB_DISABLE_XET", "1")

    try:
        from huggingface_hub import snapshot_download
    except ModuleNotFoundError as exc:  # pragma: no cover - environment guard
        raise SystemExit(
            "huggingface_hub is not installed. Run:\n"
            "    pip install -r ml-service/requirements.txt"
        ) from exc

    dest.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {repo_id} -> {dest}")
    print("A few hundred MB, and only the missing files are fetched on a retry.")

    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            local = snapshot_download(
                repo_id=repo_id,
                repo_type="dataset",
                local_dir=str(dest),
                allow_patterns=["Dataset/Cattle Breeds/**", "Dataset/Buffalo Breeds/**"],
                max_workers=4,
            )
            return Path(local)
        except (OSError, RuntimeError) as exc:
            # snapshot_download resumes, so each retry starts from what is on disk.
            last_error = exc
            wait = min(30, 3 * attempt)
            print(f"\n  attempt {attempt}/{attempts} failed: {type(exc).__name__}: {exc}")
            if attempt < attempts:
                print(f"  retrying in {wait}s (already-downloaded files are kept)...\n")
                time.sleep(wait)

    raise SystemExit(
        f"Download failed after {attempts} attempts: {last_error}\n"
        "Re-run this script to resume from where it stopped."
    )


def summarise(root: Path) -> None:
    groups: dict[str, int] = {}
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
            groups[path.parent.name] = groups.get(path.parent.name, 0) + 1

    total = sum(groups.values())
    print(f"\nDownloaded {total} images across {len(groups)} breed folders.")
    for name, count in sorted(groups.items(), key=lambda item: -item[1])[:15]:
        print(f"   {name:32s} {count}")
    if len(groups) > 15:
        print(f"   ... and {len(groups) - 15} more")
    print("\nNext: python ml-service/scripts/prepare_dataset.py")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=DEFAULT_REPO, help="Hugging Face dataset repo id")
    parser.add_argument("--dest", default=str(RAW_DIR), help="Where to place raw images")
    parser.add_argument("--force", action="store_true", help="Delete any existing download first")
    args = parser.parse_args()

    dest = Path(args.dest)
    if args.force and dest.exists():
        shutil.rmtree(dest)

    # A marker file, not "does the folder exist" - an interrupted download leaves
    # partial folders behind and must resume rather than be treated as done.
    marker = dest / ".download_complete"
    if marker.exists():
        print(f"{dest} already complete. Use --force to re-download.")
        summarise(dest)
        return

    root = download(args.repo, dest)
    marker.write_text(args.repo, encoding="utf-8")
    summarise(root)


if __name__ == "__main__":
    sys.exit(main())
