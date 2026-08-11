"""
Train the LivestockAI Indian cattle/buffalo breed classifier (PyTorch).

Why PyTorch and not TensorFlow: TF has no wheel for Python 3.13+, and this
project runs on 3.14. Torch does, so the whole pipeline stays on one runtime.

Expected layout (produced by scripts/prepare_dataset.py):
    data/train/<Class>/*.jpg
    data/val/<Class>/*.jpg
    data/test/<Class>/*.jpg

Two-phase transfer learning:
    Phase 1 - freeze the backbone, train the classifier head only.
    Phase 2 - unfreeze the top blocks, fine-tune everything at a low LR
              on a cosine schedule.

Outputs into models/:
    breed_model.pt        TorchScript graph, loaded by the FastAPI backend
    breed_model_state.pt  raw state_dict, for resuming or re-export
    class_names.json      label order
    model_meta.json       arch, image size, normalisation constants
    eval_report.json      held-out test metrics + per-class report
    confusion_matrix.png  held-out test confusion matrix

Usage:
    python ml-service/train.py
    python ml-service/train.py --arch resnet50 --epochs-head 8 --epochs-finetune 30
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from collections import Counter
from pathlib import Path

import numpy as np

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, WeightedRandomSampler
    from torchvision import datasets, transforms
    from torchvision import models as tvm
except ModuleNotFoundError as exc:  # pragma: no cover - environment guard
    raise SystemExit(
        "PyTorch/torchvision are missing. Run:\n"
        "    pip install -r ml-service/requirements.txt"
    ) from exc

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# arch -> (torchvision builder, default weights enum, attribute holding the classifier)
ARCHES = {
    "efficientnet_b0": (tvm.efficientnet_b0, "EfficientNet_B0_Weights", "classifier"),
    "mobilenet_v3_small": (tvm.mobilenet_v3_small, "MobileNet_V3_Small_Weights", "classifier"),
    "mobilenet_v3_large": (tvm.mobilenet_v3_large, "MobileNet_V3_Large_Weights", "classifier"),
    "resnet50": (tvm.resnet50, "ResNet50_Weights", "fc"),
    "convnext_tiny": (tvm.convnext_tiny, "ConvNeXt_Tiny_Weights", "classifier"),
}


# ── data ────────────────────────────────────────────────────────────────────


def build_transforms(img_size: int) -> tuple[transforms.Compose, transforms.Compose]:
    train_tf = transforms.Compose(
        [
            transforms.RandomResizedCrop(img_size, scale=(0.55, 1.0), ratio=(0.75, 1.33)),
            transforms.RandomHorizontalFlip(),
            transforms.RandAugment(num_ops=2, magnitude=7),
            transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25, hue=0.03),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
            transforms.RandomErasing(p=0.25, scale=(0.02, 0.15)),
        ]
    )
    eval_tf = transforms.Compose(
        [
            transforms.Resize(int(img_size * 1.14)),
            transforms.CenterCrop(img_size),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )
    return train_tf, eval_tf


def require_split(split: str) -> Path:
    path = DATA_DIR / split
    if not path.exists() or not any(path.iterdir()):
        raise SystemExit(
            f"Missing dataset split: {path}\n"
            "Run: python ml-service/scripts/prepare_dataset.py"
        )
    return path


def build_loaders(img_size: int, batch_size: int, workers: int):
    train_tf, eval_tf = build_transforms(img_size)

    train_ds = datasets.ImageFolder(require_split("train"), transform=train_tf)
    val_ds = datasets.ImageFolder(require_split("val"), transform=eval_tf)
    test_ds = datasets.ImageFolder(require_split("test"), transform=eval_tf)

    # Oversample rare breeds so the loss is not dominated by Ongole/Murrah.
    counts = Counter(label for _, label in train_ds.samples)
    weights = [1.0 / counts[label] for _, label in train_ds.samples]
    sampler = WeightedRandomSampler(weights, num_samples=len(train_ds), replacement=True)

    common = {"num_workers": workers, "pin_memory": False, "persistent_workers": workers > 0}
    train_dl = DataLoader(train_ds, batch_size=batch_size, sampler=sampler, **common)
    val_dl = DataLoader(val_ds, batch_size=batch_size, shuffle=False, **common)
    test_dl = DataLoader(test_ds, batch_size=batch_size, shuffle=False, **common)
    return train_ds, train_dl, val_dl, test_dl


# ── model ───────────────────────────────────────────────────────────────────


def build_model(arch: str, num_classes: int) -> nn.Module:
    if arch not in ARCHES:
        raise SystemExit(f"Unknown arch {arch!r}. Choose from: {', '.join(ARCHES)}")

    builder, weights_enum_name, head_attr = ARCHES[arch]
    weights = getattr(tvm, weights_enum_name).DEFAULT
    model = builder(weights=weights)

    head = getattr(model, head_attr)
    if isinstance(head, nn.Sequential):
        # EfficientNet/MobileNet/ConvNeXt keep the Linear at the end of a Sequential.
        for idx in range(len(head) - 1, -1, -1):
            if isinstance(head[idx], nn.Linear):
                head[idx] = nn.Linear(head[idx].in_features, num_classes)
                break
        else:
            raise SystemExit(f"No Linear layer found in {arch} head")
    else:
        setattr(model, head_attr, nn.Linear(head.in_features, num_classes))
    return model


def init_backbone_from(model: nn.Module, checkpoint_path: str, arch: str) -> int:
    """
    Warm-start the backbone from another checkpoint of the same architecture.

    ImageNet features are generic; a backbone already trained to separate
    cattle breeds starts far closer to this task. The classifier is skipped
    on purpose — it is sized for the source label set, and carrying it over
    would map the old breeds onto the new ones.

    Returns the number of tensors actually copied.
    """
    head_attr = ARCHES[arch][2]
    raw = torch.load(checkpoint_path, map_location="cpu", weights_only=False)

    if isinstance(raw, dict):
        state = None
        for key in ("model_state", "state_dict", "model_state_dict"):
            if key in raw and isinstance(raw[key], dict):
                state = raw[key]
                break
        if state is None:
            state = {k: v for k, v in raw.items() if isinstance(v, torch.Tensor)}
    else:
        raise SystemExit(f"{checkpoint_path} is not a checkpoint dict")

    for prefix in ("module.", "_orig_mod."):
        if state and all(k.startswith(prefix) for k in state):
            state = {k[len(prefix):]: v for k, v in state.items()}

    target = model.state_dict()
    transfer = {
        k: v
        for k, v in state.items()
        if not k.startswith(head_attr) and k in target and target[k].shape == v.shape
    }

    if not transfer:
        raise SystemExit(
            f"No backbone tensors from {checkpoint_path} matched {arch}. "
            "Is --arch the same architecture the checkpoint was trained with?"
        )

    model.load_state_dict(transfer, strict=False)
    return len(transfer)


def set_backbone_trainable(model: nn.Module, arch: str, trainable: bool, top_blocks: int = 0) -> None:
    head_attr = ARCHES[arch][2]
    for name, param in model.named_parameters():
        param.requires_grad = name.startswith(head_attr) or trainable

    if trainable and top_blocks:
        # Freeze everything except the last `top_blocks` stages + head.
        stages = model.features if hasattr(model, "features") else None
        if stages is not None:
            cutoff = max(0, len(stages) - top_blocks)
            for idx, block in enumerate(stages):
                if idx < cutoff:
                    for param in block.parameters():
                        param.requires_grad = False


# ── train / eval loops ──────────────────────────────────────────────────────


def run_epoch(model, loader, criterion, optimizer, device, scheduler=None) -> tuple[float, float]:
    training = optimizer is not None
    model.train(training)

    total_loss = 0.0
    correct = 0
    seen = 0

    with torch.set_grad_enabled(training):
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)

            if training:
                optimizer.zero_grad(set_to_none=True)

            logits = model(images)
            loss = criterion(logits, labels)

            if training:
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
                optimizer.step()
                if scheduler is not None:
                    scheduler.step()

            total_loss += loss.item() * labels.size(0)
            correct += (logits.argmax(1) == labels).sum().item()
            seen += labels.size(0)

    return total_loss / max(seen, 1), correct / max(seen, 1)


def predict_all(model, loader, device) -> tuple[np.ndarray, np.ndarray]:
    model.eval()
    trues, preds = [], []
    with torch.no_grad():
        for images, labels in loader:
            logits = model(images.to(device))
            preds.extend(logits.argmax(1).cpu().tolist())
            trues.extend(labels.tolist())
    return np.array(trues), np.array(preds)


def train_phase(
    name, model, train_dl, val_dl, criterion, optimizer, scheduler, device, epochs, best
) -> dict:
    for epoch in range(1, epochs + 1):
        started = time.time()
        tr_loss, tr_acc = run_epoch(model, train_dl, criterion, optimizer, device, scheduler)
        va_loss, va_acc = run_epoch(model, val_dl, criterion, None, device)

        marker = ""
        if va_acc > best["acc"]:
            best.update(acc=va_acc, state={k: v.detach().cpu().clone() for k, v in model.state_dict().items()})
            marker = "  <- best"

        print(
            f"[{name}] epoch {epoch:2d}/{epochs}  "
            f"train {tr_loss:.3f}/{tr_acc:.3f}  val {va_loss:.3f}/{va_acc:.3f}  "
            f"{time.time() - started:.0f}s{marker}",
            flush=True,
        )
    return best


# ── reporting ───────────────────────────────────────────────────────────────


def save_confusion_matrix(matrix: np.ndarray, class_names: list[str], path: Path) -> None:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ModuleNotFoundError:
        print("matplotlib missing - skipping confusion matrix image")
        return

    size = max(8, len(class_names) * 0.45)
    fig, ax = plt.subplots(figsize=(size, size * 0.9))
    image = ax.imshow(matrix, interpolation="nearest", cmap="Greens")
    fig.colorbar(image, ax=ax, fraction=0.046)
    ax.set(
        xticks=np.arange(len(class_names)),
        yticks=np.arange(len(class_names)),
        xticklabels=class_names,
        yticklabels=class_names,
        ylabel="True breed",
        xlabel="Predicted breed",
        title="Breed confusion matrix (held-out test set)",
    )
    plt.setp(ax.get_xticklabels(), rotation=90, ha="center", fontsize=7)
    plt.setp(ax.get_yticklabels(), fontsize=7)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def build_report(y_true, y_pred, class_names, extra) -> dict:
    try:
        from sklearn.metrics import classification_report, confusion_matrix

        report = classification_report(
            y_true, y_pred, labels=list(range(len(class_names))),
            target_names=class_names, output_dict=True, zero_division=0,
        )
        matrix = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names))))
        accuracy = float(report["accuracy"])
        macro_f1 = float(report["macro avg"]["f1-score"])
    except ModuleNotFoundError:
        accuracy = float((y_true == y_pred).mean())
        matrix = np.zeros((len(class_names), len(class_names)), dtype=int)
        for t, p in zip(y_true, y_pred):
            matrix[t, p] += 1
        report, macro_f1 = {}, 0.0

    return {
        "test_accuracy": accuracy,
        "test_macro_f1": macro_f1,
        "class_names": class_names,
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
        **extra,
    }, matrix


# ── main ────────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--arch", default="efficientnet_b0", choices=sorted(ARCHES))
    parser.add_argument("--img-size", type=int, default=224)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--epochs-head", type=int, default=6)
    parser.add_argument("--epochs-finetune", type=int, default=25)
    parser.add_argument("--lr-head", type=float, default=1e-3)
    parser.add_argument("--lr-finetune", type=float, default=2e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--label-smoothing", type=float, default=0.1)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--threads", type=int, default=0, help="torch CPU threads (0 = auto)")
    parser.add_argument("--min-accuracy", type=float, default=0.0, help="Fail below this test accuracy")
    parser.add_argument(
        "--init-from",
        help="Warm-start the backbone from another checkpoint of the same arch "
        "(e.g. a model already trained on cattle) instead of ImageNet",
    )
    args = parser.parse_args()

    if args.threads:
        torch.set_num_threads(args.threads)
    torch.manual_seed(42)
    np.random.seed(42)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device} | threads: {torch.get_num_threads()} | arch: {args.arch}")

    train_ds, train_dl, val_dl, test_dl = build_loaders(args.img_size, args.batch_size, args.workers)
    class_names = train_ds.classes
    print(f"{len(class_names)} classes, {len(train_ds)} training images\n")

    model = build_model(args.arch, len(class_names))
    if args.init_from:
        copied = init_backbone_from(model, args.init_from, args.arch)
        print(f"Warm-started {copied} backbone tensors from {args.init_from}\n")
    model = model.to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)
    best = {"acc": 0.0, "state": None}

    # Phase 1 - head only.
    set_backbone_trainable(model, args.arch, trainable=False)
    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad], lr=args.lr_head, weight_decay=args.weight_decay
    )
    best = train_phase("head", model, train_dl, val_dl, criterion, optimizer, None, device, args.epochs_head, best)

    # Phase 2 - full fine-tune on a cosine schedule.
    set_backbone_trainable(model, args.arch, trainable=True)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr_finetune, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer,
        max_lr=args.lr_finetune,
        total_steps=args.epochs_finetune * max(1, len(train_dl)),
        pct_start=0.25,
    )
    best = train_phase(
        "fine", model, train_dl, val_dl, criterion, optimizer, scheduler, device, args.epochs_finetune, best
    )

    if best["state"] is not None:
        model.load_state_dict(best["state"])
    print(f"\nBest validation accuracy: {best['acc']:.4f}")

    # Held-out test evaluation.
    y_true, y_pred = predict_all(model, test_dl, device)
    payload, matrix = build_report(
        y_true, y_pred, class_names,
        {
            "val_accuracy": best["acc"],
            "arch": args.arch,
            "img_size": args.img_size,
            "num_train_images": len(train_ds),
        },
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.eval().to("cpu")

    # TorchScript so the backend needs torch only - no torchvision at inference.
    scripted = torch.jit.trace(model, torch.randn(1, 3, args.img_size, args.img_size))
    scripted = torch.jit.freeze(scripted)
    scripted.save(str(MODEL_DIR / "breed_model.pt"))
    torch.save(model.state_dict(), MODEL_DIR / "breed_model_state.pt")

    (MODEL_DIR / "class_names.json").write_text(json.dumps(class_names, indent=2), encoding="utf-8")
    (MODEL_DIR / "class_indices.json").write_text(
        json.dumps({name: i for i, name in enumerate(class_names)}, indent=2), encoding="utf-8"
    )
    (MODEL_DIR / "model_meta.json").write_text(
        json.dumps(
            {
                "framework": "pytorch",
                "arch": args.arch,
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
    (MODEL_DIR / "eval_report.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    save_confusion_matrix(matrix, class_names, MODEL_DIR / "confusion_matrix.png")

    print(f"Test accuracy : {payload['test_accuracy']:.4f}")
    print(f"Test macro F1 : {payload['test_macro_f1']:.4f}")
    print(f"Saved to      : {MODEL_DIR}")

    if payload["test_accuracy"] < args.min_accuracy:
        raise SystemExit(
            f"Test accuracy {payload['test_accuracy']:.3f} below required {args.min_accuracy:.3f}."
        )


if __name__ == "__main__":
    sys.exit(main())
