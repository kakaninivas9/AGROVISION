"""
=============================================================================
CropGuard Pro — API Test Script
=============================================================================
Tests all endpoints of the Flask REST API.
Run with: python test_api.py
(Make sure app.py is running first on localhost:5000)
=============================================================================
"""

import requests, base64, json, sys, os

BASE_URL = "http://localhost:5000"

def separator(title):
    print(f"\n{'─'*55}")
    print(f"  {title}")
    print('─'*55)

def test_health():
    separator("GET / — Health Check")
    r = requests.get(f"{BASE_URL}/")
    print(f"  Status  : {r.status_code}")
    data = r.json()
    print(f"  Service : {data.get('service')}")
    print(f"  Classes : {data.get('classes')}")
    assert r.status_code == 200, "Health check failed!"
    print("  ✅ PASSED")

def test_classes():
    separator("GET /classes — List All Classes")
    r = requests.get(f"{BASE_URL}/classes")
    print(f"  Status  : {r.status_code}")
    data = r.json()
    print(f"  Total   : {data.get('total')}")
    for cls in data.get("classes", [])[:3]:
        print(f"    [{cls['id']}] {cls['label']} {'🚨' if cls['critical'] else ''}")
    print("  ...and more")
    assert r.status_code == 200, "Classes endpoint failed!"
    print("  ✅ PASSED")

def test_predict_file(image_path: str):
    separator(f"POST /predict — File Upload ({os.path.basename(image_path)})")
    if not os.path.exists(image_path):
        print(f"  ⚠ Image not found: {image_path} — skipping")
        return

    with open(image_path, "rb") as f:
        r = requests.post(f"{BASE_URL}/predict", files={"image": f})

    print(f"  Status      : {r.status_code}")
    if r.status_code == 200:
        pred = r.json()["prediction"]
        print(f"  Label       : {pred['label']}")
        print(f"  Confidence  : {pred['confidence_pct']}%")
        print(f"  Healthy     : {pred['is_healthy']}")
        print(f"  Critical    : {pred['is_critical']}")
        print(f"  Treatment   : {pred['treatment'][:70]}…")
        print(f"  Top-3:")
        for item in pred["top_5"][:3]:
            print(f"    {item['confidence']:5.1f}%  {item['label']}")
        print("  ✅ PASSED")
    else:
        print(f"  ❌ FAILED: {r.text}")

def test_predict_base64(image_path: str):
    separator(f"POST /predict — Base64 JSON ({os.path.basename(image_path)})")
    if not os.path.exists(image_path):
        print(f"  ⚠ Image not found: {image_path} — skipping")
        return

    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    r = requests.post(
        f"{BASE_URL}/predict",
        json={"image_base64": b64},
        headers={"Content-Type": "application/json"}
    )
    print(f"  Status  : {r.status_code}")
    if r.status_code == 200:
        pred = r.json()["prediction"]
        print(f"  Label   : {pred['label']}")
        print(f"  Conf    : {pred['confidence_pct']}%")
        print("  ✅ PASSED")
    else:
        print(f"  ❌ FAILED: {r.text}")

def test_latest():
    separator("GET /latest — Latest Cached Prediction")
    r = requests.get(f"{BASE_URL}/latest")
    print(f"  Status  : {r.status_code}")
    data = r.json()
    if "prediction" in data:
        print(f"  Label   : {data['prediction'].get('label')}")
        print(f"  At      : {data['prediction'].get('timestamp')}")
    else:
        print(f"  Message : {data.get('message')}")
    assert r.status_code == 200
    print("  ✅ PASSED")

def test_bad_request():
    separator("POST /predict — Bad Request (no image)")
    r = requests.post(f"{BASE_URL}/predict")
    print(f"  Status  : {r.status_code}")
    print(f"  Error   : {r.json().get('error')}")
    assert r.status_code == 400
    print("  ✅ PASSED (correct error returned)")

# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Optional: pass image path as CLI arg
    test_image = sys.argv[1] if len(sys.argv) > 1 else "test_leaf.jpg"

    print("\n╔══════════════════════════════════════════════════════╗")
    print("║     CropGuard Pro — API Test Suite                  ║")
    print("╚══════════════════════════════════════════════════════╝")

    try:
        test_health()
        test_classes()
        test_predict_file(test_image)
        test_predict_base64(test_image)
        test_latest()
        test_bad_request()
        print(f"\n{'═'*55}")
        print("  ✅ ALL TESTS PASSED")
        print(f"{'═'*55}\n")
    except requests.exceptions.ConnectionError:
        print("\n  ❌ Cannot connect to API server.")
        print("   Make sure app.py is running: python app.py\n")
        sys.exit(1)
