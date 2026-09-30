# disease_model.py — CropGuard Pro
# CNN crop disease detection using trained PlantVillage model

import numpy as np
from PIL import Image
import json, os

MODEL_PATH      = "models/cropguard_model.h5"
CLASS_NAMES_PATH = "models/class_names.json"
IMG_SIZE        = (224, 224)

# Treatment recommendations per disease class
TREATMENTS = {
    "Tomato___Early_blight":
        "Apply copper-based fungicide. Remove infected leaves. Improve air circulation.",
    "Tomato___Late_blight":
        "Use mancozeb or chlorothalonil fungicide. Avoid overhead irrigation. Destroy infected plants.",
    "Tomato___Leaf_Mold":
        "Improve ventilation. Apply fungicide (chlorothalonil). Reduce humidity.",
    "Tomato___Septoria_leaf_spot":
        "Remove infected leaves. Apply fungicide at first sign. Rotate crops next season.",
    "Tomato___Spider_mites Two-spotted_spider_mite":
        "Use miticide or neem oil spray. Increase humidity. Introduce predatory mites.",
    "Tomato___Target_Spot":
        "Apply fungicide (azoxystrobin). Remove infected debris. Avoid overhead watering.",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus":
        "No cure. Remove infected plants. Control whitefly vectors. Use resistant varieties.",
    "Tomato___Tomato_mosaic_virus":
        "No cure. Remove infected plants. Disinfect tools. Control aphid vectors.",
    "Tomato___healthy":
        "Plant is healthy! Continue current care routine.",
    "Potato___Early_blight":
        "Apply mancozeb fungicide. Ensure adequate potassium nutrition.",
    "Potato___Late_blight":
        "Apply metalaxyl + mancozeb. Remove and destroy infected tubers. Avoid waterlogging.",
    "Potato___healthy":
        "Plant is healthy! Monitor regularly.",
    "Corn_(maize)___Common_rust_":
        "Apply triazole fungicide. Plant resistant hybrids next cycle.",
    "Corn_(maize)___Northern_Leaf_Blight":
        "Apply azoxystrobin fungicide. Use resistant varieties. Rotate crops.",
    "Corn_(maize)___healthy":
        "Plant is healthy!",
    "Rice___Brown_spot":
        "Apply propiconazole fungicide. Ensure balanced NPK nutrition. Avoid water stress.",
    "Rice___Leaf_scald":
        "Improve drainage. Apply copper fungicide. Avoid excess nitrogen.",
    "Rice___Neck_Blast":
        "Apply tricyclazole fungicide at booting stage. Use resistant varieties.",
    "Grape___Black_rot":
        "Apply myclobutanil fungicide. Remove mummified fruit. Prune for air circulation.",
    "Grape___Esca_(Black_Measles)":
        "No effective cure. Prune infected wood. Apply fungicide preventively.",
    "Grape___healthy":
        "Plant is healthy!",
}

DEFAULT_TREATMENT = (
    "Consult a local agricultural officer. "
    "Consider soil testing and targeted treatment."
)

_model       = None
_class_names = None

def _load_model():
    global _model, _class_names
    if _model is None:
        try:
            import tensorflow as tf
            _model = tf.keras.models.load_model(MODEL_PATH)
            print(f"[Disease Model] Loaded from {MODEL_PATH}")
        except Exception as e:
            print(f"[Disease Model] Failed to load: {e}")
            _model = None

    if _class_names is None:
        try:
            with open(CLASS_NAMES_PATH) as f:
                _class_names = json.load(f)
        except Exception:
            _class_names = list(TREATMENTS.keys())

def preprocess_image(image):
    """Accept PIL Image or file path. Returns preprocessed numpy array."""
    if isinstance(image, str):
        image = Image.open(image)
    if image.mode != "RGB":
        image = image.convert("RGB")
    image = image.resize(IMG_SIZE)
    arr   = np.array(image, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

def predict_disease(image):
    """
    Predict crop disease from a leaf image.

    Args:
        image: PIL Image object or file path string.

    Returns:
        dict with keys:
          - disease      (str)  class name
          - confidence   (float) 0–1
          - treatment    (str)
          - top3         (list of (class, confidence) tuples)
          - is_healthy   (bool)
    """
    _load_model()

    arr = preprocess_image(image)

    if _model is not None:
        preds = _model.predict(arr, verbose=0)[0]
    else:
        # Demo mode — random predictions
        preds = np.random.dirichlet(np.ones(len(_class_names or TREATMENTS)))

    names = _class_names or list(TREATMENTS.keys())

    top_idx   = int(np.argmax(preds))
    disease   = names[top_idx] if top_idx < len(names) else "Unknown"
    confidence = float(preds[top_idx])

    # Top 3 predictions
    sorted_idx = np.argsort(preds)[::-1][:3]
    top3 = [(names[i], round(float(preds[i]) * 100, 1))
            for i in sorted_idx if i < len(names)]

    treatment  = TREATMENTS.get(disease, DEFAULT_TREATMENT)
    is_healthy = "healthy" in disease.lower()

    return {
        "disease":    disease.replace("___", " — ").replace("_", " "),
        "raw_class":  disease,
        "confidence": round(confidence * 100, 1),
        "treatment":  treatment,
        "top3":       top3,
        "is_healthy": is_healthy,
    }
