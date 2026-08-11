#!/bin/bash
# Full training pipeline: download -> clean/split -> train.
#
# Each step is resumable, so re-running after an interruption picks up where it
# stopped rather than starting over.
#
# Usage:
#   bash scripts/train_model.sh
#   MIN_IMAGES=80 EPOCHS_FINETUNE=35 ARCH=resnet50 bash scripts/train_model.sh
set -e

cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-python}"
if [ -x ".venv/Scripts/python.exe" ]; then
  PYTHON=".venv/Scripts/python.exe"      # Windows venv
elif [ -x ".venv/bin/python" ]; then
  PYTHON=".venv/bin/python"              # macOS / Linux venv
fi

MIN_IMAGES="${MIN_IMAGES:-40}"
ARCH="${ARCH:-efficientnet_b0}"
EPOCHS_HEAD="${EPOCHS_HEAD:-6}"
EPOCHS_FINETUNE="${EPOCHS_FINETUNE:-25}"
MIN_ACCURACY="${MIN_ACCURACY:-0.0}"

echo "== 1/3  Downloading dataset =="
"$PYTHON" ml-service/scripts/download_dataset.py

echo
echo "== 2/3  Cleaning, de-duplicating and splitting (min ${MIN_IMAGES} images/class) =="
"$PYTHON" ml-service/scripts/prepare_dataset.py --min-images "$MIN_IMAGES"

echo
echo "== 3/3  Training ${ARCH} =="
"$PYTHON" ml-service/train.py \
  --arch "$ARCH" \
  --epochs-head "$EPOCHS_HEAD" \
  --epochs-finetune "$EPOCHS_FINETUNE" \
  --min-accuracy "$MIN_ACCURACY"

echo
echo "Done. Restart the backend to load the new model, then check:"
echo "  curl http://127.0.0.1:8000/health"
