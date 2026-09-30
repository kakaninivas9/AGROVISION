"""
=============================================================================
CropGuard Pro — CNN Model Training Script
=============================================================================
Architecture : MobileNetV2 (Transfer Learning, fine-tuned)
Dataset      : PlantVillage_small  (15 classes × 400 images = 6,000 total)
Platform     : Google Colab  (GPU runtime recommended)

Usage:
  1. Upload PlantVillage_small.zip to Colab (or mount from Drive)
  2. Run this script cell-by-cell (or as a whole notebook/script)
  3. Trained model saved as: cropguard_model.h5  +  cropguard_model.tflite
=============================================================================
"""

# ── 0. INSTALL / IMPORT ──────────────────────────────────────────────────────
import os, zipfile, random, shutil, json, datetime
import numpy as np
import matplotlib.pyplot as plt

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard
)
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

print(f"TensorFlow version : {tf.__version__}")
print(f"GPU available      : {tf.config.list_physical_devices('GPU')}")

# ── 1. CONFIGURATION ─────────────────────────────────────────────────────────
BASE_DIR    = "/content/PlantVillage_small"   # Unzipped dataset folder
ZIP_PATH    = "/content/PlantVillage_small.zip"
OUTPUT_DIR  = "/content/cropguard_output"
MODEL_H5    = os.path.join(OUTPUT_DIR, "cropguard_model.h5")
MODEL_TFLITE= os.path.join(OUTPUT_DIR, "cropguard_model.tflite")
LABELS_JSON = os.path.join(OUTPUT_DIR, "class_labels.json")
LOGS_DIR    = os.path.join(OUTPUT_DIR, "logs")

IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
EPOCHS_FROZEN  = 10    # Phase 1: train only top layers
EPOCHS_FINETUNE= 15    # Phase 2: fine-tune last 30 layers of MobileNetV2
LEARNING_RATE  = 1e-3
FINETUNE_LR    = 1e-5
VALIDATION_SPLIT = 0.15
TEST_SPLIT       = 0.15
RANDOM_SEED      = 42

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(LOGS_DIR,   exist_ok=True)
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

# ── 2. UNZIP DATASET (if not already extracted) ──────────────────────────────
if not os.path.isdir(BASE_DIR):
    print("[INFO] Extracting dataset ZIP…")
    with zipfile.ZipFile(ZIP_PATH, "r") as zf:
        zf.extractall("/content/")
    print("[INFO] Extraction complete.")
else:
    print(f"[INFO] Dataset already extracted at {BASE_DIR}")

# ── 3. DISCOVER CLASSES ───────────────────────────────────────────────────────
class_names = sorted([
    d for d in os.listdir(BASE_DIR)
    if os.path.isdir(os.path.join(BASE_DIR, d))
])
NUM_CLASSES = len(class_names)

print(f"\n[INFO] Found {NUM_CLASSES} classes:")
for i, cls in enumerate(class_names):
    img_count = len(os.listdir(os.path.join(BASE_DIR, cls)))
    print(f"  {i:>2}. {cls:<55} ({img_count} images)")

# Save class name ↔ index mapping
label_map = {name: idx for idx, name in enumerate(class_names)}
with open(LABELS_JSON, "w") as f:
    json.dump({"class_names": class_names, "label_map": label_map}, f, indent=2)
print(f"\n[INFO] Class labels saved → {LABELS_JSON}")

# ── 4. SPLIT DATASET INTO train / val / test DIRECTORIES ─────────────────────
SPLIT_DIR   = "/content/cropguard_split"
TRAIN_DIR   = os.path.join(SPLIT_DIR, "train")
VAL_DIR     = os.path.join(SPLIT_DIR, "val")
TEST_DIR    = os.path.join(SPLIT_DIR, "test")

def build_split_dirs():
    if os.path.isdir(SPLIT_DIR):
        shutil.rmtree(SPLIT_DIR)
    for split in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
        for cls in class_names:
            os.makedirs(os.path.join(split, cls), exist_ok=True)

    for cls in class_names:
        cls_src = os.path.join(BASE_DIR, cls)
        images  = [f for f in os.listdir(cls_src)
                   if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        random.shuffle(images)

        n         = len(images)
        n_test    = max(1, int(n * TEST_SPLIT))
        n_val     = max(1, int(n * VALIDATION_SPLIT))
        n_train   = n - n_test - n_val

        splits = {
            TRAIN_DIR: images[:n_train],
            VAL_DIR:   images[n_train:n_train + n_val],
            TEST_DIR:  images[n_train + n_val:],
        }
        for dest_root, file_list in splits.items():
            for fname in file_list:
                shutil.copy(
                    os.path.join(cls_src, fname),
                    os.path.join(dest_root, cls, fname)
                )
    print(f"[INFO] Dataset split → train/val/test in {SPLIT_DIR}")

build_split_dirs()

# ── 5. DATA AUGMENTATION & GENERATORS ─────────────────────────────────────────
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    rotation_range=20,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2],
    fill_mode="nearest",
)

val_test_datagen = ImageDataGenerator(rescale=1.0 / 255)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=True,
    seed=RANDOM_SEED,
)

val_gen = val_test_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,
)

test_gen = val_test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,
)

print(f"\n[INFO] Training samples   : {train_gen.samples}")
print(f"[INFO] Validation samples : {val_gen.samples}")
print(f"[INFO] Test samples       : {test_gen.samples}")

# ── 6. BUILD MODEL (MobileNetV2 + Custom Head) ────────────────────────────────
def build_model(num_classes: int) -> keras.Model:
    """
    Transfer Learning Model:
      • Base  : MobileNetV2 pretrained on ImageNet (frozen initially)
      • Head  : GlobalAveragePooling → Dense(256, ReLU) → Dropout → Softmax
    """
    base = MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,       # Remove ImageNet classification head
        weights="imagenet",
    )
    base.trainable = False       # Freeze base during Phase 1

    inputs  = keras.Input(shape=(*IMG_SIZE, 3))
    x       = base(inputs, training=False)
    x       = layers.GlobalAveragePooling2D()(x)
    x       = layers.Dense(256, activation="relu")(x)
    x       = layers.BatchNormalization()(x)
    x       = layers.Dropout(0.4)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs, outputs, name="CropGuard_MobileNetV2")
    return model, base

model, base_model = build_model(NUM_CLASSES)
model.summary()

# ── 7. PHASE 1 — TRAIN ONLY THE TOP LAYERS ───────────────────────────────────
model.compile(
    optimizer=keras.optimizers.Adam(LEARNING_RATE),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

callbacks_phase1 = [
    EarlyStopping(patience=5, restore_best_weights=True, monitor="val_accuracy"),
    ReduceLROnPlateau(factor=0.5, patience=3, min_lr=1e-6, verbose=1),
    ModelCheckpoint(MODEL_H5, save_best_only=True, monitor="val_accuracy", verbose=1),
    TensorBoard(log_dir=os.path.join(LOGS_DIR, "phase1")),
]

print("\n[PHASE 1] Training top layers (base frozen)…")
history1 = model.fit(
    train_gen,
    epochs=EPOCHS_FROZEN,
    validation_data=val_gen,
    callbacks=callbacks_phase1,
)

# ── 8. PHASE 2 — FINE-TUNE LAST 30 LAYERS OF MobileNetV2 ─────────────────────
print("\n[PHASE 2] Fine-tuning last 30 layers of MobileNetV2…")
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

# Re-compile with very low learning rate
model.compile(
    optimizer=keras.optimizers.Adam(FINETUNE_LR),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

callbacks_phase2 = [
    EarlyStopping(patience=7, restore_best_weights=True, monitor="val_accuracy"),
    ReduceLROnPlateau(factor=0.3, patience=3, min_lr=1e-7, verbose=1),
    ModelCheckpoint(MODEL_H5, save_best_only=True, monitor="val_accuracy", verbose=1),
    TensorBoard(log_dir=os.path.join(LOGS_DIR, "phase2")),
]

history2 = model.fit(
    train_gen,
    epochs=EPOCHS_FINETUNE,
    validation_data=val_gen,
    callbacks=callbacks_phase2,
)

# ── 9. EVALUATE ON TEST SET ──────────────────────────────────────────────────
print("\n[INFO] Evaluating on test set…")
model.load_weights(MODEL_H5)
loss, accuracy = model.evaluate(test_gen, verbose=1)
print(f"\n  Test Accuracy : {accuracy * 100:.2f}%")
print(f"  Test Loss     : {loss:.4f}")

# Detailed classification report
test_gen.reset()
preds      = model.predict(test_gen, verbose=1)
pred_labels= np.argmax(preds, axis=1)
true_labels= test_gen.classes

print("\n── Classification Report ──────────────────────────────────────────")
print(classification_report(true_labels, pred_labels, target_names=class_names))

# ── 10. CONFUSION MATRIX PLOT ────────────────────────────────────────────────
cm = confusion_matrix(true_labels, pred_labels)
plt.figure(figsize=(14, 12))
sns.heatmap(cm, annot=True, fmt="d", cmap="Greens",
            xticklabels=class_names, yticklabels=class_names)
plt.title("CropGuard Pro — Confusion Matrix", fontsize=14)
plt.ylabel("True Label")
plt.xlabel("Predicted Label")
plt.xticks(rotation=45, ha="right", fontsize=8)
plt.tight_layout()
cm_path = os.path.join(OUTPUT_DIR, "confusion_matrix.png")
plt.savefig(cm_path, dpi=150)
plt.show()
print(f"[INFO] Confusion matrix saved → {cm_path}")

# ── 11. TRAINING CURVES PLOT ─────────────────────────────────────────────────
def merge_histories(h1, h2, key):
    return h1.history[key] + h2.history[key]

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for ax, metric, title in zip(
    axes,
    [("accuracy", "val_accuracy"), ("loss", "val_loss")],
    ["Accuracy", "Loss"]
):
    ax.plot(merge_histories(history1, history2, metric[0]), label="Train")
    ax.plot(merge_histories(history1, history2, metric[1]), label="Validation")
    ax.axvline(x=EPOCHS_FROZEN, color="gray", linestyle="--", label="Fine-tune start")
    ax.set_title(f"CropGuard Pro — {title}")
    ax.set_xlabel("Epoch")
    ax.legend()
plt.tight_layout()
curves_path = os.path.join(OUTPUT_DIR, "training_curves.png")
plt.savefig(curves_path, dpi=150)
plt.show()
print(f"[INFO] Training curves saved → {curves_path}")

# ── 12. EXPORT TO TFLite (for edge deployment / mobile) ──────────────────────
print("\n[INFO] Converting model to TFLite…")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]   # Post-training quantization
tflite_model = converter.convert()
with open(MODEL_TFLITE, "wb") as f:
    f.write(tflite_model)
tflite_size = os.path.getsize(MODEL_TFLITE) / (1024 ** 2)
print(f"[INFO] TFLite model saved → {MODEL_TFLITE}  ({tflite_size:.1f} MB)")

# ── 13. PRINT FINAL SUMMARY ──────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  CropGuard Pro — Training Complete")
print("=" * 60)
print(f"  Model (.h5)     : {MODEL_H5}")
print(f"  Model (.tflite) : {MODEL_TFLITE}")
print(f"  Class labels    : {LABELS_JSON}")
print(f"  Test accuracy   : {accuracy * 100:.2f}%")
print(f"  Classes         : {NUM_CLASSES}")
print("=" * 60)

# ── 14. DOWNLOAD OUTPUTS FROM COLAB ──────────────────────────────────────────
print("\n[INFO] Run to download model files:")
print("  from google.colab import files")
print(f'  files.download("{MODEL_H5}")')
print(f'  files.download("{MODEL_TFLITE}")')
print(f'  files.download("{LABELS_JSON}")')
