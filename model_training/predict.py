"""
=============================================================================
CropGuard Pro — Model Inference & Prediction Script
=============================================================================
Purpose  : Load the trained cropguard_model.h5 (or .tflite) and predict
           plant disease from a single leaf image or a folder of images.
Platform : Google Colab  |  Local Python ≥ 3.8
=============================================================================
Usage (Colab / command line):
    python predict.py --image /path/to/leaf.jpg
    python predict.py --folder /path/to/images/
    python predict.py --image leaf.jpg --thingspeak   # also posts result
=============================================================================
"""

import os
import json
import argparse
import datetime
import numpy as np
from PIL import Image

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
MODEL_H5_PATH    = "/content/cropguard_output/cropguard_model.h5"
MODEL_TFLITE_PATH= "/content/cropguard_output/cropguard_model.tflite"
LABELS_JSON_PATH = "/content/cropguard_output/class_labels.json"
IMG_SIZE         = (224, 224)

# Minimum confidence to consider a prediction reliable
CONFIDENCE_THRESHOLD = 0.60

# Valid image extensions
VALID_EXTS = {".jpg", ".jpeg", ".png", ".bmp"}

# ── HELPER: Friendly disease names ────────────────────────────────────────────
# Maps raw class folder names → readable labels
FRIENDLY_NAMES = {
    "Pepper__bell___Bacterial_spot"                     : "Bell Pepper – Bacterial Spot",
    "Pepper__bell___healthy"                            : "Bell Pepper – Healthy",
    "Potato___Early_blight"                             : "Potato – Early Blight",
    "Potato___healthy"                                  : "Potato – Healthy",
    "Potato___Late_blight"                              : "Potato – Late Blight",
    "Tomato_Bacterial_spot"                             : "Tomato – Bacterial Spot",
    "Tomato_Early_blight"                               : "Tomato – Early Blight",
    "Tomato_healthy"                                    : "Tomato – Healthy",
    "Tomato_Late_blight"                                : "Tomato – Late Blight",
    "Tomato_Leaf_Mold"                                  : "Tomato – Leaf Mold",
    "Tomato_Septoria_leaf_spot"                         : "Tomato – Septoria Leaf Spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite"       : "Tomato – Spider Mites",
    "Tomato__Target_Spot"                               : "Tomato – Target Spot",
    "Tomato__Tomato_mosaic_virus"                       : "Tomato – Mosaic Virus",
    "Tomato__Tomato_YellowLeaf__Curl_Virus"             : "Tomato – Yellow Leaf Curl Virus",
}

# Which diseases are considered critical (need urgent action)
CRITICAL_DISEASES = {
    "Potato___Late_blight",
    "Tomato_Late_blight",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato__Tomato_mosaic_virus",
}

# ── LOAD LABELS ───────────────────────────────────────────────────────────────
def load_labels(json_path: str) -> list:
    with open(json_path, "r") as f:
        data = json.load(f)
    return data["class_names"]

# ── IMAGE PRE-PROCESSING ──────────────────────────────────────────────────────
def preprocess_image(image_path: str) -> np.ndarray:
    """Load an image, resize to 224×224, normalise to [0,1], add batch dim."""
    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)   # shape: (1, 224, 224, 3)

# ── LOAD MODEL (Keras .h5 or TFLite) ─────────────────────────────────────────
def load_keras_model(path: str):
    """Load a full Keras (.h5) model."""
    import tensorflow as tf
    print(f"[INFO] Loading Keras model from {path}…")
    return tf.keras.models.load_model(path)

def load_tflite_model(path: str):
    """Load a TFLite interpreter."""
    import tensorflow as tf
    print(f"[INFO] Loading TFLite model from {path}…")
    interpreter = tf.lite.Interpreter(model_path=path)
    interpreter.allocate_tensors()
    return interpreter

def predict_keras(model, img_array: np.ndarray) -> np.ndarray:
    """Run inference with a Keras model."""
    return model.predict(img_array, verbose=0)[0]

def predict_tflite(interpreter, img_array: np.ndarray) -> np.ndarray:
    """Run inference with a TFLite interpreter."""
    input_details  = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    interpreter.set_tensor(input_details[0]["index"], img_array)
    interpreter.invoke()
    return interpreter.get_tensor(output_details[0]["index"])[0]

# ── SINGLE IMAGE PREDICTION ───────────────────────────────────────────────────
def predict_image(image_path: str, model, class_names: list, use_tflite=False) -> dict:
    """
    Returns a dict with:
        class_raw        : raw class folder name
        class_label      : human-friendly name
        confidence       : float 0–1
        is_healthy       : bool
        is_critical      : bool
        all_predictions  : list of (label, confidence) sorted desc
        timestamp        : ISO 8601
    """
    img_array = preprocess_image(image_path)

    if use_tflite:
        probs = predict_tflite(model, img_array)
    else:
        probs = predict_keras(model, img_array)

    top_idx    = int(np.argmax(probs))
    confidence = float(probs[top_idx])
    class_raw  = class_names[top_idx]

    # Build sorted predictions list
    all_preds = sorted(
        [(class_names[i], float(probs[i])) for i in range(len(class_names))],
        key=lambda x: x[1], reverse=True
    )

    return {
        "image_path"     : image_path,
        "class_raw"      : class_raw,
        "class_label"    : FRIENDLY_NAMES.get(class_raw, class_raw),
        "confidence"     : confidence,
        "confident_enough": confidence >= CONFIDENCE_THRESHOLD,
        "is_healthy"     : "healthy" in class_raw.lower(),
        "is_critical"    : class_raw in CRITICAL_DISEASES,
        "all_predictions": all_preds[:5],   # Top-5
        "timestamp"      : datetime.datetime.utcnow().isoformat() + "Z",
    }

# ── PRINT FORMATTED RESULT ────────────────────────────────────────────────────
def print_result(result: dict):
    line = "─" * 55
    print(f"\n{line}")
    print(f"  Image     : {os.path.basename(result['image_path'])}")
    print(f"  Diagnosis : {result['class_label']}")
    print(f"  Confidence: {result['confidence'] * 100:.1f}%", end="")
    if not result["confident_enough"]:
        print("  ⚠ LOW — try a clearer image", end="")
    print()
    if result["is_healthy"]:
        print("  Status    : ✅ HEALTHY")
    elif result["is_critical"]:
        print("  Status    : 🚨 CRITICAL DISEASE — take immediate action!")
    else:
        print("  Status    : ⚠  Disease Detected — monitor and treat")

    print(f"\n  Top-5 Predictions:")
    for rank, (label, prob) in enumerate(result["all_predictions"], 1):
        bar = "█" * int(prob * 20)
        friendly = FRIENDLY_NAMES.get(label, label)
        print(f"    {rank}. {friendly:<45} {prob*100:5.1f}%  {bar}")
    print(line)

# ── FOLDER BATCH PREDICTION ───────────────────────────────────────────────────
def predict_folder(folder_path: str, model, class_names: list, use_tflite=False):
    """Run predictions on all images inside a folder."""
    images = [
        os.path.join(folder_path, f)
        for f in sorted(os.listdir(folder_path))
        if os.path.splitext(f)[1].lower() in VALID_EXTS
    ]
    print(f"[INFO] Found {len(images)} images in {folder_path}\n")
    results = []
    for img_path in images:
        result = predict_image(img_path, model, class_names, use_tflite)
        print_result(result)
        results.append(result)

    # Summary counts
    healthy  = sum(1 for r in results if r["is_healthy"])
    critical = sum(1 for r in results if r["is_critical"])
    diseased = len(results) - healthy
    print(f"\n══ Batch Summary ══════════════════════════════════")
    print(f"  Total images : {len(results)}")
    print(f"  Healthy      : {healthy}")
    print(f"  Diseased     : {diseased}  (Critical: {critical})")
    print(f"══════════════════════════════════════════════════\n")
    return results

# ── THINGSPEAK INTEGRATION ────────────────────────────────────────────────────
def post_to_thingspeak(result: dict, channel_id: int, write_api_key: str):
    """
    POST the latest disease prediction to ThingSpeak.
    Uses the same channel as the IoT firmware, Field 9+ if available,
    or a separate disease-detection channel.

    ThingSpeak Field mapping (suggested):
        Field 9 or 1 (disease channel) → confidence (%)
        Field 10 or 2                  → is_healthy  (1/0)
        Status string                  → class_label
    """
    import urllib.request
    import urllib.parse

    params = urllib.parse.urlencode({
        "api_key"  : write_api_key,
        "field1"   : round(result["confidence"] * 100, 2),
        "field2"   : 1 if result["is_healthy"] else 0,
        "status"   : result["class_label"][:255],   # ThingSpeak limit
    }).encode("utf-8")

    url = "https://api.thingspeak.com/update"
    try:
        req = urllib.request.Request(url, data=params)
        with urllib.request.urlopen(req, timeout=10) as resp:
            entry_id = resp.read().decode()
            if entry_id != "0":
                print(f"[ThingSpeak] Posted successfully. Entry ID: {entry_id}")
            else:
                print("[ThingSpeak] POST failed (check API key or rate limit).")
    except Exception as e:
        print(f"[ThingSpeak] Error: {e}")

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="CropGuard Pro — Plant Disease Inference"
    )
    parser.add_argument("--image",      type=str, help="Path to a single image")
    parser.add_argument("--folder",     type=str, help="Path to a folder of images")
    parser.add_argument("--model",      type=str, default=MODEL_H5_PATH,
                        help="Path to .h5 model (default) or .tflite model")
    parser.add_argument("--labels",     type=str, default=LABELS_JSON_PATH,
                        help="Path to class_labels.json")
    parser.add_argument("--tflite",     action="store_true",
                        help="Use TFLite model instead of Keras .h5")
    parser.add_argument("--thingspeak", action="store_true",
                        help="Post result to ThingSpeak after prediction")
    parser.add_argument("--ts_channel", type=int, default=0,
                        help="ThingSpeak Channel ID")
    parser.add_argument("--ts_key",     type=str, default="",
                        help="ThingSpeak Write API Key")
    args = parser.parse_args()

    # ── Load class labels ──
    class_names = load_labels(args.labels)

    # ── Load model ──
    if args.tflite:
        model_path = args.model if args.model.endswith(".tflite") else MODEL_TFLITE_PATH
        model = load_tflite_model(model_path)
    else:
        model = load_keras_model(args.model)

    # ── Run prediction ──
    if args.image:
        result = predict_image(args.image, model, class_names, args.tflite)
        print_result(result)
        if args.thingspeak and args.ts_channel and args.ts_key:
            post_to_thingspeak(result, args.ts_channel, args.ts_key)

    elif args.folder:
        results = predict_folder(args.folder, model, class_names, args.tflite)
        if args.thingspeak and args.ts_channel and args.ts_key:
            # Post last result (most recent)
            post_to_thingspeak(results[-1], args.ts_channel, args.ts_key)

    else:
        # ── Colab interactive demo ──
        print("[Colab Demo] No arguments — running interactive example.")
        from google.colab import files
        print("Upload a leaf image:")
        uploaded = files.upload()
        for fname in uploaded:
            result = predict_image(fname, model, class_names, args.tflite)
            print_result(result)

if __name__ == "__main__":
    main()
