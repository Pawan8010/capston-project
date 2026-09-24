"""
Train a lightweight Torch-only cattle/buffalo breed classifier.

This is the compatibility path for Windows/Python versions where torchvision is
not installed. It reads the same data/train, data/val and data/test folders as
train.py and exports the same backend artifact names:

    models/breed_model.pt
    models/class_names.json
    models/class_indices.json
    models/model_meta.json

Usage:
    python ml-service/train_torchlite.py --epochs 8 --batch-size 16
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


class ImageFolderLite(Dataset):
    def __init__(self, root: Path, img_size: int, augment: bool = False):
        self.root = root
        self.img_size = img_size
        self.augment = augment
        self.classes = sorted(path.name for path in root.iterdir() if path.is_dir())
        self.class_to_idx = {name: idx for idx, name in enumerate(self.classes)}
        self.samples = [
            (path, self.class_to_idx[class_dir.name])
            for class_dir in sorted(path for path in root.iterdir() if path.is_dir())
            for path in sorted(class_dir.iterdir())
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
        ]

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int):
        path, label = self.samples[index]
        with Image.open(path) as image:
            image = image.convert("RGB")
            if self.augment and random.random() < 0.5:
                image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            image = resize_center_crop(image, self.img_size)
            arr = np.asarray(image, dtype=np.float32) / 255.0

        mean = np.asarray(IMAGENET_MEAN, dtype=np.float32)
        std = np.asarray(IMAGENET_STD, dtype=np.float32)
        arr = (arr - mean) / std
        tensor = torch.from_numpy(arr.transpose(2, 0, 1))
        return tensor, label


def resize_center_crop(image: Image.Image, img_size: int) -> Image.Image:
    width, height = image.size
    target_short = int(round(img_size * 1.14))
    if width < height:
        new_w = target_short
        new_h = max(1, int(round(height * target_short / width)))
    else:
        new_h = target_short
        new_w = max(1, int(round(width * target_short / height)))
    image = image.resize((new_w, new_h), Image.BILINEAR)
    left = max(0, (new_w - img_size) // 2)
    top = max(0, (new_h - img_size) // 2)
    return image.crop((left, top, left + img_size, top + img_size))


class BreedNet(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.SiLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.SiLU(),
            nn.Conv2d(64, 128, 3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.SiLU(),
            nn.Conv2d(128, 192, 3, stride=2, padding=1),
            nn.BatchNorm2d(192),
            nn.SiLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.25),
            nn.Linear(192, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


def require_split(split: str) -> Path:
    path = DATA_DIR / split
    if not path.exists() or not any(path.rglob("*")):
        raise SystemExit(f"Missing or empty dataset split: {path}. Run prepare_dataset.py first.")
    return path


def build_loaders(img_size: int, batch_size: int):
    train_ds = ImageFolderLite(require_split("train"), img_size, augment=True)
    val_ds = ImageFolderLite(require_split("val"), img_size)
    test_ds = ImageFolderLite(require_split("test"), img_size)

    if not train_ds.samples:
        raise SystemExit("No training images found. Run prepare_dataset.py after downloading raw data.")
    if train_ds.classes != val_ds.classes or train_ds.classes != test_ds.classes:
        raise SystemExit("Train/val/test class folders do not match.")

    counts = Counter(label for _, label in train_ds.samples)
    weights = [1.0 / counts[label] for _, label in train_ds.samples]
    sampler = WeightedRandomSampler(weights, num_samples=len(train_ds), replacement=True)

    train_dl = DataLoader(train_ds, batch_size=batch_size, sampler=sampler)
    val_dl = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_dl = DataLoader(test_ds, batch_size=batch_size, shuffle=False)
    return train_ds, train_dl, val_dl, test_dl


def run_epoch(model, loader, optimizer, device):
    model.train(optimizer is not None)
    total_loss = 0.0
    correct = 0
    total = 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        with torch.set_grad_enabled(optimizer is not None):
            logits = model(x)
            loss = F.cross_entropy(logits, y, label_smoothing=0.05)
            if optimizer is not None:
                optimizer.zero_grad(set_to_none=True)
                loss.backward()
                optimizer.step()
        total_loss += float(loss) * len(y)
        correct += int((logits.argmax(1) == y).sum())
        total += len(y)
    return total_loss / max(total, 1), correct / max(total, 1)


def predict_all(model, loader, device):
    model.eval()
    y_true, y_pred = [], []
    with torch.no_grad():
        for x, y in loader:
            logits = model(x.to(device))
            y_true.extend(y.numpy().tolist())
            y_pred.extend(logits.argmax(1).cpu().numpy().tolist())
    return np.asarray(y_true), np.asarray(y_pred)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--img-size", type=int, default=160)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--lr", type=float, default=8e-4)
    parser.add_argument("--threads", type=int, default=0)
    parser.add_argument("--min-accuracy", type=float, default=0.0)
    args = parser.parse_args()

    if args.threads:
        torch.set_num_threads(args.threads)
    random.seed(42)
    np.random.seed(42)
    torch.manual_seed(42)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_ds, train_dl, val_dl, test_dl = build_loaders(args.img_size, args.batch_size)
    print(f"Device: {device} | classes: {len(train_ds.classes)} | train images: {len(train_ds)}")

    model = BreedNet(len(train_ds.classes)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    best = {"acc": 0.0, "state": None}

    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = run_epoch(model, train_dl, optimizer, device)
        val_loss, val_acc = run_epoch(model, val_dl, None, device)
        if val_acc >= best["acc"]:
            best = {"acc": val_acc, "state": {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}}
        print(
            f"epoch {epoch:02d}/{args.epochs} "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.3f} "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.3f}",
            flush=True,
        )

    if best["state"] is not None:
        model.load_state_dict(best["state"])
    y_true, y_pred = predict_all(model, test_dl, device)
    test_acc = float((y_true == y_pred).mean()) if len(y_true) else 0.0

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.eval().to("cpu")
    scripted = torch.jit.trace(model, torch.randn(1, 3, args.img_size, args.img_size))
    scripted = torch.jit.freeze(scripted)
    scripted.save(str(MODEL_DIR / "breed_model.pt"))
    torch.save(model.state_dict(), MODEL_DIR / "breed_model_state.pt")

    class_names = train_ds.classes
    (MODEL_DIR / "class_names.json").write_text(json.dumps(class_names, indent=2), encoding="utf-8")
    (MODEL_DIR / "class_indices.json").write_text(
        json.dumps({name: i for i, name in enumerate(class_names)}, indent=2),
        encoding="utf-8",
    )
    (MODEL_DIR / "model_meta.json").write_text(
        json.dumps(
            {
                "framework": "pytorch",
                "arch": "torchlite_cnn",
                "img_size": args.img_size,
                "mean": IMAGENET_MEAN,
                "std": IMAGENET_STD,
                "resize_ratio": 1.14,
                "num_classes": len(class_names),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (MODEL_DIR / "eval_report.json").write_text(
        json.dumps(
            {
                "test_accuracy": test_acc,
                "val_accuracy": best["acc"],
                "arch": "torchlite_cnn",
                "img_size": args.img_size,
                "num_train_images": len(train_ds),
                "class_names": class_names,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Best val accuracy: {best['acc']:.4f}")
    print(f"Test accuracy    : {test_acc:.4f}")
    print(f"Saved model      : {MODEL_DIR / 'breed_model.pt'}")
    if test_acc < args.min_accuracy:
        raise SystemExit(f"Test accuracy {test_acc:.3f} below required {args.min_accuracy:.3f}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
