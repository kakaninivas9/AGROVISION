"""
=============================================================================
CropGuard Pro — Flask REST API Server
=============================================================================
Serves the trained CNN model as a REST API endpoint.
Any device (mobile app, dashboard, ESP32-CAM) can POST a leaf image
and receive a disease prediction as JSON.

Endpoints:
  GET  /                  → API health check
  POST /predict           → Predict disease from uploaded image
  GET  /classes           → List all 15 supported disease classes
  GET  /latest            → Latest prediction result (cached)

Install & Run:
  pip install flask pillow tensorflow
  python app.py

Colab usage (expose via ngrok):
  !pip install flask pyngrok pillow tensorflow
  !ngrok authtoken YOUR_NGROK_TOKEN
  # Then run this script
=============================================================================
"""

import os, json, io, datetime, base64, traceback
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory, redirect
import numpy as np
from PIL import Image
import tensorflow as tf

# ── CONFIG ────────────────────────────────────────────────────────────────────
MODEL_PATH     = os.environ.get("CROPGUARD_MODEL",  "cropguard_output/cropguard_model.h5")
LABELS_PATH   = os.environ.get("CROPGUARD_LABELS", "cropguard_output/class_labels.json")
IMG_SIZE       = (224, 224)
MAX_FILE_MB    = 10
PORT           = int(os.environ.get("PORT", 5000))
API_KEY        = os.environ.get("CROPGUARD_API_KEY", "")

# Dashboard folder is one level above api/ → project_root/dashboard/
DASHBOARD_DIR  = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "dashboard")
)

FRIENDLY_NAMES = {
    "Pepper__bell___Bacterial_spot"               : "Bell Pepper – Bacterial Spot",
    "Pepper__bell___healthy"                      : "Bell Pepper – Healthy",
    "Potato___Early_blight"                       : "Potato – Early Blight",
    "Potato___healthy"                            : "Potato – Healthy",
    "Potato___Late_blight"                        : "Potato – Late Blight",
    "Tomato_Bacterial_spot"                       : "Tomato – Bacterial Spot",
    "Tomato_Early_blight"                         : "Tomato – Early Blight",
    "Tomato_healthy"                              : "Tomato – Healthy",
    "Tomato_Late_blight"                          : "Tomato – Late Blight",
    "Tomato_Leaf_Mold"                            : "Tomato – Leaf Mold",
    "Tomato_Septoria_leaf_spot"                   : "Tomato – Septoria Leaf Spot",
    "Tomato_Spider_mites_Two_spotted_spider_mite" : "Tomato – Spider Mites",
    "Tomato__Target_Spot"                         : "Tomato – Target Spot",
    "Tomato__Tomato_mosaic_virus"                 : "Tomato – Mosaic Virus",
    "Tomato__Tomato_YellowLeaf__Curl_Virus"       : "Tomato – Yellow Leaf Curl Virus",
}

CRITICAL_CLASSES = {
    "Potato___Late_blight",
    "Tomato_Late_blight",
    "Tomato__Tomato_YellowLeaf__Curl_Virus",
    "Tomato__Tomato_mosaic_virus",
}

TREATMENTS = {
    "Pepper__bell___Bacterial_spot"              : "Apply copper-based bactericide. Remove infected leaves. Avoid overhead watering.",
    "Potato___Early_blight"                      : "Apply chlorothalonil or mancozeb fungicide. Ensure adequate plant spacing.",
    "Potato___Late_blight"                       : "Apply metalaxyl + mancozeb immediately. Destroy infected plants. Avoid wetting foliage.",
    "Tomato_Bacterial_spot"                      : "Use copper sprays. Practice crop rotation. Use disease-free seeds.",
    "Tomato_Early_blight"                        : "Remove lower infected leaves. Apply fungicide (azoxystrobin). Mulch soil.",
    "Tomato_Late_blight"                         : "Apply systemic fungicide immediately. Remove and destroy all infected plant material.",
    "Tomato_Leaf_Mold"                           : "Improve air circulation. Apply fungicide (chlorothalonil). Reduce humidity.",
    "Tomato_Septoria_leaf_spot"                  : "Remove infected leaves. Apply fungicide. Avoid wetting foliage.",
    "Tomato_Spider_mites_Two_spotted_spider_mite": "Apply miticide or neem oil. Increase humidity. Introduce predatory mites.",
    "Tomato__Target_Spot"                        : "Apply copper fungicide. Ensure good air circulation. Remove infected leaves.",
    "Tomato__Tomato_mosaic_virus"                : "Remove and destroy infected plants. Control aphid vectors. Use resistant varieties.",
    "Tomato__Tomato_YellowLeaf__Curl_Virus"      : "Remove infected plants immediately. Control whitefly vector with insecticides.",
}

# ── FLASK APP ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_MB * 1024 * 1024

# ── GLOBAL STATE ──────────────────────────────────────────────────────────────
model         = None
class_names   = []
latest_result = {}
model_ready   = False   # True once model is successfully loaded
model_error   = ""      # Last load error message (if any)

# ── MODEL LOADER  (lazy — called on first /predict request) ───────────────────
def load_model_and_labels():
    """
    Attempt to load the Keras model and class labels.
    Sets model_ready = True on success, model_error on failure.
    Safe to call multiple times — no-op if already loaded.
    """
    global model, class_names, model_ready, model_error

    if model_ready:
        return True   # already loaded

    # ── Check files exist before TF tries to open them ──
    missing = []
    if not os.path.isfile(MODEL_PATH):  missing.append(MODEL_PATH)
    if not os.path.isfile(LABELS_PATH): missing.append(LABELS_PATH)

    if missing:
        model_error = (
            f"Model file(s) not found: {missing}. "
            "Train the model first by running train_model.py in Google Colab, "
            "then copy cropguard_model.h5 and class_labels.json into the "
            "cropguard_output/ folder next to api/app.py."
        )
        print(f"[CropGuard API] WARNING: {model_error}")
        return False

    try:
        print(f"[CropGuard API] Loading model   : {MODEL_PATH}")
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"[CropGuard API] Loading labels  : {LABELS_PATH}")
        with open(LABELS_PATH) as f:
            data = json.load(f)
        class_names = data["class_names"]
        model_ready = True
        model_error = ""
        print(f"[CropGuard API] READY -- {len(class_names)} classes loaded.")
        return True
    except Exception as exc:
        model_error = str(exc)
        print(f"[CropGuard API] ERROR: Failed to load model: {exc}")
        return False

# ── OPTIONAL API KEY AUTH ──────────────────────────────────────────────────────
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if API_KEY:
            key = request.headers.get("X-API-Key") or request.args.get("api_key")
            if key != API_KEY:
                return jsonify({"error": "Unauthorized — invalid API key"}), 401
        return f(*args, **kwargs)
    return decorated

# ── IMAGE PREPROCESSING ───────────────────────────────────────────────────────
def preprocess(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

# ── BUILD RESPONSE DICT ───────────────────────────────────────────────────────
def build_prediction_response(probs: np.ndarray) -> dict:
    top_idx    = int(np.argmax(probs))
    class_raw  = class_names[top_idx]
    confidence = float(probs[top_idx])

    sorted_preds = sorted(
        [{"class": class_names[i],
          "label": FRIENDLY_NAMES.get(class_names[i], class_names[i]),
          "confidence": round(float(probs[i]) * 100, 2)}
         for i in range(len(class_names))],
        key=lambda x: x["confidence"], reverse=True
    )

    return {
        "class_raw"       : class_raw,
        "label"           : FRIENDLY_NAMES.get(class_raw, class_raw),
        "confidence_pct"  : round(confidence * 100, 2),
        "is_healthy"      : "healthy" in class_raw.lower(),
        "is_critical"     : class_raw in CRITICAL_CLASSES,
        "treatment"       : TREATMENTS.get(class_raw, "Consult an agronomist."),
        "top_5"           : sorted_preds[:5],
        "timestamp"       : datetime.datetime.utcnow().isoformat() + "Z",
    }

# ══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════════════

# ── Health Check ──────────────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status"      : "online",
        "service"     : "CropGuard Pro Disease Detection API",
        "version"     : "1.0.0",
        "model_ready" : model_ready,
        "model_path"  : MODEL_PATH,
        "model_error" : model_error if not model_ready else None,
        "classes"     : len(class_names),
        "next_step"   : None if model_ready else (
            "Train the model in Google Colab using model_training/train_model.py, "
            "then copy cropguard_output/cropguard_model.h5 and class_labels.json here."
        ),
        "endpoints": {
            "POST /predict" : "Upload image (multipart/form-data 'image' field, or JSON image_base64)",
            "GET  /classes" : "List all 15 supported disease classes",
            "GET  /latest"  : "Latest cached prediction",
        }
    })

# ── Predict ───────────────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
@require_api_key
def predict():
    global latest_result

    # Lazy-load model on first request
    if not model_ready:
        load_model_and_labels()

    if not model_ready:
        print("[CropGuard API] WARNING: Model missing. Returning 503 to trigger GenAI fallback.")
        return jsonify({"error": "CNN model unavailable."}), 503

    try:
        # Support both multipart file upload AND base64 JSON body
        if "image" in request.files:
            # Multipart form upload
            file  = request.files["image"]
            if file.filename == "":
                return jsonify({"error": "No file selected"}), 400
            image_bytes = file.read()

        elif request.is_json and "image_base64" in request.json:
            # Base64 encoded image in JSON body
            b64_str = request.json["image_base64"]
            # Strip data URI prefix if present
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            image_bytes = base64.b64decode(b64_str)

        else:
            return jsonify({
                "error": "No image provided. Send multipart 'image' field or JSON {'image_base64': '...'}"
            }), 400

        # Run inference
        img_array = preprocess(image_bytes)
        probs     = model.predict(img_array, verbose=0)[0]
        result    = build_prediction_response(probs)
        latest_result = result

        return jsonify({"success": True, "prediction": result}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ── List Classes ──────────────────────────────────────────────────────────────
@app.route("/classes", methods=["GET"])
def list_classes():
    return jsonify({
        "total": len(class_names),
        "classes": [
            {
                "id"      : idx,
                "raw"     : name,
                "label"   : FRIENDLY_NAMES.get(name, name),
                "critical": name in CRITICAL_CLASSES,
            }
            for idx, name in enumerate(class_names)
        ]
    })

# ── Latest Cached Prediction ──────────────────────────────────────────────────
@app.route("/latest", methods=["GET"])
def latest():
    if not latest_result:
        return jsonify({"message": "No predictions yet"}), 200
    return jsonify({"prediction": latest_result}), 200

# ── Dashboard (serves dashboard/index.html and its assets) ───────────────────
@app.route("/dashboard", methods=["GET"])
def dashboard_redirect():
    # Redirect /dashboard to /dashboard/ so relative links work
    return redirect("/dashboard/")

@app.route("/dashboard/", methods=["GET"])
def dashboard():
    return send_from_directory(DASHBOARD_DIR, "index.html")

@app.route("/dashboard/<path:filename>", methods=["GET"])
def dashboard_assets(filename):
    """Serve any additional assets the dashboard may reference."""
    return send_from_directory(DASHBOARD_DIR, filename)

# ── NGROK TUNNEL (Colab helper) ───────────────────────────────────────────────
def start_ngrok(port: int):
    try:
        from pyngrok import ngrok
        public_url = ngrok.connect(port)
        print(f"\n[ngrok] Public URL: {public_url}")
        print(f"[ngrok] API docs : {public_url}/")
        print(f"[ngrok] Predict  : curl -X POST {public_url}/predict -F 'image=@leaf.jpg'\n")
    except ImportError:
        print("[INFO] pyngrok not installed — running locally only.")

# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Attempt eager load — OK if it fails (lazy fallback on first /predict)
    load_model_and_labels()

    # Uncomment for Google Colab with ngrok:
    # start_ngrok(PORT)

    print(f"\n[CropGuard API] Server starting on http://0.0.0.0:{PORT}")
    print(f"[CropGuard API] Health : http://localhost:{PORT}/")
    print(f"[CropGuard API] Predict: POST http://localhost:{PORT}/predict")
    if not model_ready:
        print()
        print("  WARNING: No trained model found. The server will still start.")
        print("  WARNING: Train the model in Colab and place the output files at:")
        print(f"  WARNING:    {os.path.abspath(MODEL_PATH)}")
        print(f"  WARNING:    {os.path.abspath(LABELS_PATH)}")
        print("  WARNING: Then restart this server.")
    print()
    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
