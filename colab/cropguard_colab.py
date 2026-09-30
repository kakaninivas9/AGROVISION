"""
=============================================================================
CropGuard Pro — Google Colab All-in-One Script
=============================================================================
Run this file top-to-bottom in a single Google Colab session to:
  Step 1 → Mount Google Drive
  Step 2 → Extract dataset
  Step 3 → Train the CNN
  Step 4 → Evaluate & visualise results
  Step 5 → Export TFLite model
  Step 6 → Start Flask API with ngrok public URL
  Step 7 → Test the API with a sample image

Recommended Colab runtime: GPU (T4 or better)
=============================================================================
"""

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 0 — Install extra dependencies                            ║
# ╚══════════════════════════════════════════════════════════════════╝
import subprocess, sys

def pip_install(*packages):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *packages])

pip_install("flask", "pyngrok", "seaborn", "scikit-learn")
print("✅ Dependencies installed.")

# ── Core imports ────────────────────────────────────────────────────
import os, json, zipfile, shutil, random, datetime, io, threading
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.metrics i gtmport classification_report, confusion_matrix

print(f"TensorFlow : {tf.__version__}")
print(f"GPU        : {tf.config.list_physical_devices('GPU')}")

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 1 — Mount Google Drive (optional — skip if uploading ZIP) ║
# ╚══════════════════════════════════════════════════════════════════╝
USE_DRIVE   = False   # ← Set True if your ZIP is in Google Drive
DRIVE_ZIP   = "/content/drive/MyDrive/PlantVillage_small.zip"
LOCAL_ZIP   = "/content/PlantVillage_small.zip"

if USE_DRIVE:
    from google.colab import drive
    drive.mount("/content/drive")
    print("✅ Google Drive mounted.")
else:
    print("ℹ Using local ZIP. Upload PlantVillage_small.zip to Colab files panel.")
    # Uncomment to trigger manual upload:
    # from google.colab import files
    # uploaded = files.upload()

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 2 — Extract Dataset                                        ║
# ╚══════════════════════════════════════════════════════════════════╝
ZIP_PATH  = DRIVE_ZIP if USE_DRIVE else LOCAL_ZIP
BASE_DIR  = "/content/PlantVillage_small"
OUT_DIR   = "/content/cropguard_output"
SPLIT_DIR = "/content/cropguard_split"

os.makedirs(OUT_DIR, exist_ok=True)

if not os.path.isdir(BASE_DIR):
    print(f"Extracting {ZIP_PATH} …")
    with zipfile.ZipFile(ZIP_PATH, "r") as zf:
        zf.extractall("/content/")
    print("✅ Extraction complete.")
else:
    print("✅ Dataset already present.")

# ── Class discovery ────────────────────────────────────────────────
class_names = sorted([d for d in os.listdir(BASE_DIR) if os.path.isdir(os.path.join(BASE_DIR, d))])
NUM_CLASSES = len(class_names)
print(f"\nClasses found: {NUM_CLASSES}")
for i, c in enumerate(class_names):
    imgs = len(os.listdir(os.path.join(BASE_DIR, c)))
    print(f"  {i:>2}. {c:<55} {imgs} images")

label_map = {"class_names": class_names, "label_map": {n:i for i,n in enumerate(class_names)}}
with open(os.path.join(OUT_DIR, "class_labels.json"), "w") as f:
    json.dump(label_map, f, indent=2)

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 3 — Split  →  train / val / test                          ║
# ╚══════════════════════════════════════════════════════════════════╝
IMG_SIZE   = (224, 224)
BATCH_SIZE = 32
VAL_SPLIT  = 0.15
TEST_SPLIT = 0.15
SEED       = 42

random.seed(SEED); np.random.seed(SEED); tf.random.set_seed(SEED)

TRAIN_DIR = os.path.join(SPLIT_DIR, "train")
VAL_DIR   = os.path.join(SPLIT_DIR, "val")
TEST_DIR  = os.path.join(SPLIT_DIR, "test")

if os.path.isdir(SPLIT_DIR):
    shutil.rmtree(SPLIT_DIR)

for cls in class_names:
    for split in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
        os.makedirs(os.path.join(split, cls), exist_ok=True)

for cls in class_names:
    imgs = [f for f in os.listdir(os.path.join(BASE_DIR, cls)) if f.lower().endswith((".jpg",".jpeg",".png"))]
    random.shuffle(imgs)
    n = len(imgs)
    nt, nv = max(1, int(n*TEST_SPLIT)), max(1, int(n*VAL_SPLIT))
    for dest, subset in [(TEST_DIR, imgs[:nt]), (VAL_DIR, imgs[nt:nt+nv]), (TRAIN_DIR, imgs[nt+nv:])]:
        for f in subset:
            shutil.copy(os.path.join(BASE_DIR, cls, f), os.path.join(dest, cls, f))

print(f"\n✅ Split complete → {SPLIT_DIR}")

# ── Data generators ────────────────────────────────────────────────
train_gen = ImageDataGenerator(
    rescale=1/255, rotation_range=20, width_shift_range=0.15,
    height_shift_range=0.15, zoom_range=0.2, horizontal_flip=True,
    brightness_range=[0.8,1.2], fill_mode="nearest"
).flow_from_directory(TRAIN_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, shuffle=True,  seed=SEED, class_mode="categorical")

val_gen = ImageDataGenerator(rescale=1/255).flow_from_directory(
    VAL_DIR,  target_size=IMG_SIZE, batch_size=BATCH_SIZE, shuffle=False, class_mode="categorical")
test_gen = ImageDataGenerator(rescale=1/255).flow_from_directory(
    TEST_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE, shuffle=False, class_mode="categorical")

print(f"  Train: {train_gen.samples} | Val: {val_gen.samples} | Test: {test_gen.samples}")

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 4 — Build MobileNetV2 Model                               ║
# ╚══════════════════════════════════════════════════════════════════╝
base = MobileNetV2(input_shape=(*IMG_SIZE, 3), include_top=False, weights="imagenet")
base.trainable = False

inp = keras.Input(shape=(*IMG_SIZE, 3))
x   = base(inp, training=False)
x   = layers.GlobalAveragePooling2D()(x)
x   = layers.Dense(256, activation="relu")(x)
x   = layers.BatchNormalization()(x)
x   = layers.Dropout(0.4)(x)
out = layers.Dense(NUM_CLASSES, activation="softmax")(x)
model = keras.Model(inp, out, name="CropGuard_MobileNetV2")

MODEL_PATH = os.path.join(OUT_DIR, "cropguard_model.h5")

# ── Phase 1 ────────────────────────────────────────────────────────
model.compile(optimizer=keras.optimizers.Adam(1e-3), loss="categorical_crossentropy", metrics=["accuracy"])
cb1 = [EarlyStopping(patience=5, restore_best_weights=True, monitor="val_accuracy"),
       ReduceLROnPlateau(factor=0.5, patience=3, min_lr=1e-6),
       ModelCheckpoint(MODEL_PATH, save_best_only=True, monitor="val_accuracy")]
print("\n── Phase 1: Training top layers ──")
h1 = model.fit(train_gen, epochs=10, validation_data=val_gen, callbacks=cb1)

# ── Phase 2 Fine-tune ──────────────────────────────────────────────
base.trainable = True
for layer in base.layers[:-30]:
    layer.trainable = False
model.compile(optimizer=keras.optimizers.Adam(1e-5), loss="categorical_crossentropy", metrics=["accuracy"])
cb2 = [EarlyStopping(patience=7, restore_best_weights=True, monitor="val_accuracy"),
       ReduceLROnPlateau(factor=0.3, patience=3, min_lr=1e-7),
       ModelCheckpoint(MODEL_PATH, save_best_only=True, monitor="val_accuracy")]
print("\n── Phase 2: Fine-tuning last 30 layers ──")
h2 = model.fit(train_gen, epochs=15, validation_data=val_gen, callbacks=cb2)

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 5 — Evaluate & Visualise                                  ║
# ╚══════════════════════════════════════════════════════════════════╝
model.load_weights(MODEL_PATH)
loss, acc = model.evaluate(test_gen, verbose=0)
print(f"\n✅ Test Accuracy: {acc*100:.2f}%  |  Loss: {loss:.4f}")

test_gen.reset()
preds = np.argmax(model.predict(test_gen, verbose=0), axis=1)
print("\n── Classification Report ──")
print(classification_report(test_gen.classes, preds, target_names=class_names))

# Confusion matrix
fig, ax = plt.subplots(figsize=(14,12))
sns.heatmap(confusion_matrix(test_gen.classes, preds), annot=True, fmt="d",
            cmap="Greens", xticklabels=class_names, yticklabels=class_names, ax=ax)
ax.set_title("CropGuard Pro — Confusion Matrix"); ax.set_xlabel("Predicted"); ax.set_ylabel("True")
plt.xticks(rotation=45, ha="right", fontsize=8); plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "confusion_matrix.png"), dpi=150); plt.show()

# Training curves
def merge(h1, h2, k): return h1.history[k] + h2.history[k]
fig, axes = plt.subplots(1, 2, figsize=(14,5))
for ax, (m, vm), title in zip(axes, [("accuracy","val_accuracy"),("loss","val_loss")], ["Accuracy","Loss"]):
    ax.plot(merge(h1,h2,m), label="Train"); ax.plot(merge(h1,h2,vm), label="Val")
    ax.axvline(x=len(h1.history[m]), color="gray", linestyle="--", label="Fine-tune")
    ax.set_title(f"CropGuard — {title}"); ax.legend()
plt.tight_layout()
plt.savefig(os.path.join(OUT_DIR, "training_curves.png"), dpi=150); plt.show()

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 6 — Export TFLite                                         ║
# ╚══════════════════════════════════════════════════════════════════╝
TFLITE_PATH = os.path.join(OUT_DIR, "cropguard_model.tflite")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
with open(TFLITE_PATH, "wb") as f:
    f.write(converter.convert())
print(f"✅ TFLite exported: {os.path.getsize(TFLITE_PATH)/1e6:.1f} MB")

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 7 — Start Flask API + ngrok tunnel                        ║
# ╚══════════════════════════════════════════════════════════════════╝
NGROK_TOKEN = ""   # ← Paste your ngrok auth token here (free at ngrok.com)

def run_flask():
    # Import app from api/app.py or inline minimal server
    import importlib.util, sys as _sys
    spec = importlib.util.spec_from_file_location("cropguard_api", "/content/api/app.py")
    if spec:
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        mod.MODEL_PATH  = MODEL_PATH
        mod.LABELS_PATH = os.path.join(OUT_DIR, "class_labels.json")
        mod.load_model_and_labels()
        mod.app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
    else:
        print("[API] app.py not found — upload api/app.py to /content/api/")

if NGROK_TOKEN:
    from pyngrok import ngrok, conf
    conf.get_default().auth_token = NGROK_TOKEN
    public_url = ngrok.connect(5000)
    print(f"\n🌐 Public API URL : {public_url}")
    print(f"   Predict endpoint: {public_url}/predict\n")
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
else:
    print("ℹ Skipping API server — set NGROK_TOKEN to enable.")

# ╔══════════════════════════════════════════════════════════════════╗
# ║  STEP 8 — Download All Outputs                                  ║
# ╚══════════════════════════════════════════════════════════════════╝
from google.colab import files

print("\n── Downloading model outputs ──")
for f in ["cropguard_model.h5", "cropguard_model.tflite", "class_labels.json",
          "confusion_matrix.png", "training_curves.png"]:
    path = os.path.join(OUT_DIR, f)
    if os.path.exists(path):
        files.download(path)
        print(f"  ↓ {f}")
    else:
        print(f"  ⚠ Not found: {f}")

print("\n╔══════════════════════════════════════════════╗")
print("║  CropGuard Pro — Training Pipeline Complete  ║")
print(f"║  Final Test Accuracy: {acc*100:.2f}%               ║")
print("╚══════════════════════════════════════════════╝")
