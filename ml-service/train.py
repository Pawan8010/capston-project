"""
Train the LivestockAI cattle breed classifier.

Expected dataset layout:
  data/train/Gir/*.jpg
  data/val/Gir/*.jpg
  data/test/Gir/*.jpg
  ...same for Holstein, Jersey, Red_Sindhi, Sahiwal
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np

try:
    import tensorflow as tf
except ModuleNotFoundError as exc:
    raise SystemExit(
        "TensorFlow is not installed. Use Python 3.11 or 3.12, then run "
        "`pip install -r ml-service/requirements.txt`. The current Python "
        f"is {sys.version.split()[0]}."
    ) from exc

try:
    import matplotlib.pyplot as plt
    from sklearn.metrics import classification_report, confusion_matrix
    from sklearn.utils.class_weight import compute_class_weight
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Missing ML evaluation dependencies. Run `pip install -r ml-service/requirements.txt`."
    ) from exc

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
PHASE_1_EPOCHS = int(os.getenv("PHASE_1_EPOCHS", "15"))
PHASE_2_EPOCHS = int(os.getenv("PHASE_2_EPOCHS", "15"))
MIN_TEST_ACCURACY = float(os.getenv("MIN_TEST_ACCURACY", "0.70"))
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
H5_MODEL_PATH = MODEL_DIR / "breed_model.h5"
KERAS_MODEL_PATH = MODEL_DIR / "breed_model.keras"
CLASS_INDEX_PATH = MODEL_DIR / "class_indices.json"
EVAL_REPORT_PATH = MODEL_DIR / "eval_report.json"
CONFUSION_MATRIX_PATH = MODEL_DIR / "confusion_matrix.png"


def require_split(split: str) -> Path:
    path = DATA_DIR / split
    if not path.exists():
        raise FileNotFoundError(
            f"Missing dataset split: {path}. Run `python ml-service/scripts/prepare_dataset.py` first."
        )
    return path


def load_dataset(split: str, shuffle: bool) -> tf.data.Dataset:
    return tf.keras.utils.image_dataset_from_directory(
        require_split(split),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        shuffle=shuffle,
        seed=42,
        label_mode="categorical",
    )


def optimize(ds: tf.data.Dataset) -> tf.data.Dataset:
    return ds.cache().prefetch(tf.data.AUTOTUNE)


def preprocess_batch(images, labels):
    return tf.keras.applications.mobilenet_v2.preprocess_input(images), labels


def prepare_train_dataset(ds: tf.data.Dataset) -> tf.data.Dataset:
    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.15),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomContrast(0.1),
        ],
        name="augmentation",
    )
    return ds.map(lambda x, y: (augmentation(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE).map(
        preprocess_batch,
        num_parallel_calls=tf.data.AUTOTUNE,
    )


def class_weights_from_dataset(train_ds: tf.data.Dataset) -> dict[int, float]:
    labels = []
    for _, y_batch in train_ds.unbatch():
        labels.append(int(tf.argmax(y_batch).numpy()))
    classes = np.unique(labels)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=np.array(labels))
    return {int(class_id): float(weight) for class_id, weight in zip(classes, weights)}


def build_model(num_classes: int) -> tuple[tf.keras.Model, tf.keras.Model]:
    base = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3))
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
    model = tf.keras.Model(inputs, outputs, name="livestockai_mobilenetv2")
    return model, base


def plot_confusion_matrix(matrix: np.ndarray, class_names: list[str]) -> None:
    fig, ax = plt.subplots(figsize=(8, 7))
    image = ax.imshow(matrix, interpolation="nearest", cmap="Blues")
    fig.colorbar(image, ax=ax)
    ax.set(
        xticks=np.arange(len(class_names)),
        yticks=np.arange(len(class_names)),
        xticklabels=class_names,
        yticklabels=class_names,
        ylabel="True label",
        xlabel="Predicted label",
        title="Cattle Breed Confusion Matrix",
    )
    plt.setp(ax.get_xticklabels(), rotation=35, ha="right", rotation_mode="anchor")
    threshold = matrix.max() / 2 if matrix.size else 0
    for row in range(matrix.shape[0]):
        for col in range(matrix.shape[1]):
            ax.text(
                col,
                row,
                format(matrix[row, col], "d"),
                ha="center",
                va="center",
                color="white" if matrix[row, col] > threshold else "black",
            )
    fig.tight_layout()
    fig.savefig(CONFUSION_MATRIX_PATH, dpi=160)
    plt.close(fig)


def evaluate_and_save(model: tf.keras.Model, test_ds: tf.data.Dataset, class_names: list[str]) -> dict:
    y_true = []
    y_pred = []
    for x_batch, y_batch in test_ds:
        probs = model.predict(x_batch, verbose=0)
        y_true.extend(np.argmax(y_batch.numpy(), axis=1).tolist())
        y_pred.extend(np.argmax(probs, axis=1).tolist())

    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True, zero_division=0)
    matrix = confusion_matrix(y_true, y_pred)
    accuracy = float(report["accuracy"])
    payload = {
        "accuracy": accuracy,
        "minimum_required_accuracy": MIN_TEST_ACCURACY,
        "class_names": class_names,
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
    }
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_REPORT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    plot_confusion_matrix(matrix, class_names)
    return payload


def train() -> None:
    train_ds_raw = load_dataset("train", shuffle=True)
    val_ds = optimize(load_dataset("val", shuffle=False).map(preprocess_batch, num_parallel_calls=tf.data.AUTOTUNE))
    test_ds = optimize(load_dataset("test", shuffle=False).map(preprocess_batch, num_parallel_calls=tf.data.AUTOTUNE))
    class_names = train_ds_raw.class_names
    num_classes = len(class_names)

    if num_classes < 2:
        raise RuntimeError("Dataset must contain at least two classes.")

    weights = class_weights_from_dataset(train_ds_raw)
    train_ds = optimize(prepare_train_dataset(train_ds_raw))

    model, base = build_model(num_classes)
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", patience=2, factor=0.3, min_lr=1e-7),
    ]

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=PHASE_1_EPOCHS,
        class_weight=weights,
        callbacks=callbacks,
    )

    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=PHASE_2_EPOCHS,
        class_weight=weights,
        callbacks=callbacks,
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.save(H5_MODEL_PATH)
    model.save(KERAS_MODEL_PATH)
    CLASS_INDEX_PATH.write_text(
        json.dumps({class_name: index for index, class_name in enumerate(class_names)}, indent=2),
        encoding="utf-8",
    )

    eval_report = evaluate_and_save(model, test_ds, class_names)
    print(json.dumps(eval_report, indent=2))
    if eval_report["accuracy"] < MIN_TEST_ACCURACY:
        raise SystemExit(
            f"Test accuracy {eval_report['accuracy']:.3f} is below required {MIN_TEST_ACCURACY:.3f}. "
            "Review dataset quality before using this model."
        )


if __name__ == "__main__":
    train()
