"""
Import an externally trained checkpoint into the format the backend loads.

The training pipeline in train.py is not the only way a model can arrive —
a checkpoint trained elsewhere just needs converting into the four files
the FastAPI service expects:

    models/breed_model.pt        TorchScript graph (what the backend loads)
    models/breed_model_state.pt  raw state_dict, kept for re-export
    models/class_names.json      label order
    models/model_meta.json       arch, image size, normalisation constants

Expected checkpoint shape (a dict saved with torch.save):

    {
      "model_state": <state_dict>,
      "class_names": [...],          # or config["class_names"]
      "config": {"backbone": "mobilenet_v3_small", "image_size": 224, ...}
    }

A bare state_dict also works if --arch and --classes are passed.

Usage:
    python ml-service/scripts/import_model.py final_model.pt.zip
    python ml-service/scripts/import_model.py ckpt.pt --arch resnet50
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models as tvm

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"

# Most transfer-learning pipelines normalise with the ImageNet statistics the
# pretrained backbone was trained on. The checkpoint does not record them, so
# this is an assumption — override with --mean/--std if the source pipeline
# used something else, because getting it wrong quietly degrades accuracy
# rather than raising.
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# arch name -> (builder, attribute holding the classifier)
ARCHES = {
    "mobilenet_v3_small": (tvm.mobilenet_v3_small, "classifier"),
    "mobilenet_v3_large": (tvm.mobilenet_v3_large, "classifier"),
    "mobilenet_v2": (tvm.mobilenet_v2, "classifier"),
    "efficientnet_b0": (tvm.efficientnet_b0, "classifier"),
    "efficientnet_b1": (tvm.efficientnet_b1, "classifier"),
    "resnet18": (tvm.resnet18, "fc"),
    "resnet50": (tvm.resnet50, "fc"),
    "convnext_tiny": (tvm.convnext_tiny, "classifier"),
}


def build_model(arch: str, num_classes: int) -> nn.Module:
    """Same architecture, randomly initialised — the weights come from the
    checkpoint, so downloading pretrained weights here would be wasted."""
    if arch not in ARCHES:
        raise SystemExit(f"Unknown arch {arch!r}. Choose from: {', '.join(sorted(ARCHES))}")

    builder, head_attr = ARCHES[arch]
    model = builder(weights=None)
    head = getattr(model, head_attr)

    if isinstance(head, nn.Sequential):
        for idx in range(len(head) - 1, -1, -1):
            if isinstance(head[idx], nn.Linear):
                head[idx] = nn.Linear(head[idx].in_features, num_classes)
                break
        else:
            raise SystemExit(f"No Linear layer found in the {arch} head")
    else:
        setattr(model, head_attr, nn.Linear(head.in_features, num_classes))

    return model


def unwrap(checkpoint) -> tuple[dict, list[str] | None, dict]:
    """Pull (state_dict, class_names, config) out of the several shapes these
    checkpoints get saved in."""
    if not isinstance(checkpoint, dict):
        raise SystemExit("Checkpoint is not a dict. A full pickled nn.Module is not supported.")

    config = checkpoint.get("config") or {}

    state = None
    for key in ("model_state", "state_dict", "model_state_dict", "model"):
        if key in checkpoint and isinstance(checkpoint[key], dict):
            state = checkpoint[key]
            break
    if state is None:
        # Assume the dict is itself a state_dict.
        state = {k: v for k, v in checkpoint.items() if isinstance(v, torch.Tensor)}
        if not state:
            raise SystemExit(f"No weights found. Top-level keys: {list(checkpoint)[:10]}")

    class_names = checkpoint.get("class_names") or config.get("class_names")

    # Strip a DataParallel/compile prefix if present.
    for prefix in ("module.", "_orig_mod."):
        if all(k.startswith(prefix) for k in state):
            state = {k[len(prefix):]: v for k, v in state.items()}

    return state, class_names, config


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkpoint", help="Path to the .pt/.pth checkpoint")
    parser.add_argument("--arch", help="Override the backbone recorded in the checkpoint")
    parser.add_argument("--img-size", type=int, help="Override the image size")
    parser.add_argument("--classes", help="JSON file with the label list, if the checkpoint has none")
    parser.add_argument("--mean", type=float, nargs=3, default=IMAGENET_MEAN)
    parser.add_argument("--std", type=float, nargs=3, default=IMAGENET_STD)
    parser.add_argument("--out", default=str(MODEL_DIR), help="Output directory")
    args = parser.parse_args()

    source = Path(args.checkpoint)
    if not source.exists():
        raise SystemExit(f"No checkpoint at {source}")

    print(f"Reading {source} ...")
    checkpoint = torch.load(source, map_location="cpu", weights_only=False)
    state, class_names, config = unwrap(checkpoint)

    if args.classes:
        class_names = json.loads(Path(args.classes).read_text(encoding="utf-8"))
    if not class_names:
        raise SystemExit("Checkpoint has no class_names. Pass --classes with a JSON label list.")

    arch = args.arch or config.get("backbone") or config.get("arch")
    if not arch:
        raise SystemExit("Checkpoint records no backbone. Pass --arch.")

    img_size = args.img_size or int(config.get("image_size") or config.get("img_size") or 224)
    num_classes = len(class_names)

    print(f"  arch        : {arch}")
    print(f"  classes     : {num_classes}")
    print(f"  image size  : {img_size}")
    print(f"  parameters  : {sum(v.numel() for v in state.values()):,}")

    model = build_model(arch, num_classes)
    missing, unexpected = model.load_state_dict(state, strict=False)

    # A head mismatch means the label list and the weights disagree — that
    # would silently map every prediction to the wrong breed.
    blocking = [k for k in list(missing) + list(unexpected) if "classifier" in k or k.startswith("fc.")]
    if blocking:
        raise SystemExit(
            f"Classifier weights do not match {arch} with {num_classes} classes.\n"
            f"  missing: {list(missing)[:5]}\n  unexpected: {list(unexpected)[:5]}"
        )
    if missing or unexpected:
        print(f"  note        : {len(missing)} missing / {len(unexpected)} unexpected non-head keys")

    model.eval()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    example = torch.randn(1, 3, img_size, img_size)
    with torch.no_grad():
        logits = model(example)
    if logits.shape[-1] != num_classes:
        raise SystemExit(f"Model outputs {logits.shape[-1]} logits but {num_classes} labels were given.")

    # TorchScript so the backend needs torch alone, not torchvision.
    scripted = torch.jit.freeze(torch.jit.trace(model, example))
    scripted.save(str(out_dir / "breed_model.pt"))
    torch.save(model.state_dict(), out_dir / "breed_model_state.pt")

    (out_dir / "class_names.json").write_text(json.dumps(class_names, indent=2), encoding="utf-8")
    (out_dir / "class_indices.json").write_text(
        json.dumps({name: i for i, name in enumerate(class_names)}, indent=2), encoding="utf-8"
    )
    (out_dir / "model_meta.json").write_text(
        json.dumps(
            {
                "framework": "pytorch",
                "arch": arch,
                "img_size": img_size,
                "mean": list(args.mean),
                "std": list(args.std),
                "resize_ratio": 1.14,
                "num_classes": num_classes,
                "source": source.name,
                "imported": True,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    # Round-trip the saved graph so a broken export fails here, not at runtime.
    reloaded = torch.jit.load(str(out_dir / "breed_model.pt"), map_location="cpu")
    with torch.no_grad():
        check = reloaded(example)
    if not torch.allclose(check, logits, atol=1e-4):
        raise SystemExit("Exported TorchScript disagrees with the source model.")

    print(f"\nWrote {out_dir}")
    print("  breed_model.pt, breed_model_state.pt, class_names.json, class_indices.json, model_meta.json")
    print(f"\nNormalisation assumed ImageNet mean/std ({args.mean}). Pass --mean/--std if the")
    print("source pipeline used different constants.")
    print("\nRestart the backend to pick it up.")


if __name__ == "__main__":
    sys.exit(main())
