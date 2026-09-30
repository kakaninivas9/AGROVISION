# 🌱 AgroVision (CropGuard Pro)
> **AI-powered plant disease detection + IoT smart farming platform**

---

## 📁 Complete Project Structure

```
CGUARD/
├── dataset_preparation/
│   └── reduce_dataset.py          ← Colab: filter, resize & compress dataset
├── model_training/
│   ├── train_model.py             ← CNN training (MobileNetV2, 2-phase)
│   └── predict.py                 ← Inference: image → disease + treatment
├── colab/
│   └── cropguard_colab.py         ← All-in-one Colab pipeline (8 steps)
├── api/
│   ├── app.py                     ← Flask REST API server
│   └── test_api.py                ← API test suite
├── iot_firmware/
│   └── CropGuardPro.ino           ← NodeMCU ESP8266 firmware
├── integration/
│   └── thingspeak_bridge.py       ← Python live monitoring bridge
├── dashboard/
│   └── index.html                 ← Browser dashboard (no server needed)
├── docs/
│   ├── mobile_integration.md      ← Android / iOS / React Native guide
│   └── deployment.md              ← Colab / Pi / Cloud / Docker guide
├── requirements.txt
└── README.md
```

---

## 🏗️ System Architecture

```
      ┌──────────────────────────────────────────────────────┐
      │                    FARM FIELD                         │
      │                                                      │
      │  📸 Leaf Photo              🔌 NodeMCU ESP8266       │
      │       │                         │                    │
      │       ▼                         │ DHT22/Soil/NPK     │
      │  ┌─────────┐              ┌─────▼──────────┐        │
      │  │ CNN Model│              │ Relay + Pump   │        │
      │  │(MobileNetV2)            │ Auto-irrigation│        │
      │  └────┬────┘              └─────┬──────────┘        │
      └───────┼─────────────────────────┼────────────────────┘
              │ Disease Label            │ Sensor Data
              └──────────┬──────────────┘
                         ▼
                  ┌─────────────┐
                  │  ThingSpeak │ ← Unified cloud store
                  └──────┬──────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    Web Dashboard    Flask API    Mobile App
    (index.html)    (app.py)  (Android/iOS/RN)
```

---

## 🚀 Step-by-Step Workflow

| # | Step | Script | Output |
|---|------|--------|--------|
| 1 | Reduce dataset | `reduce_dataset.py` | `PlantVillage_small.zip` (~200 MB) |
| 2 | Train CNN | `train_model.py` | `cropguard_model.h5` + `.tflite` |
| 3 | Predict disease | `predict.py --image leaf.jpg` | Disease label + treatment |
| 4 | Flash IoT firmware | `CropGuardPro.ino` | Auto-irrigation + ThingSpeak data |
| 5 | Start API server | `python api/app.py` | REST endpoint at `/predict` |
| 6 | View dashboard | Open `dashboard/index.html` | Live sensor + AI browser dashboard |
| 7 | Monitor bridge | `thingspeak_bridge.py` | Terminal alerts from both channels |

**Colab shortcut — runs steps 1–6 automatically:**
```python
# Upload cropguard_colab.py to Colab, then:
exec(open('cropguard_colab.py').read())
```

---

## 🤖 Part 1 — AI Disease Detection

- **Model:** MobileNetV2 (transfer learning, fine-tuned)
- **Dataset:** PlantVillage — 15 classes × 400 images = 6,000 images
- **Input:** 224 × 224 px RGB leaf image
- **Output:** Disease class + confidence + treatment recommendation
- **Export:** `.h5` (Flask API) + `.tflite` (Android/iOS offline)

### 15 Target Disease Classes

| Crop | Disease Classes |
|------|----------------|
| Bell Pepper | Bacterial Spot, Healthy |
| Potato | Early Blight, Healthy, Late Blight 🚨 |
| Tomato | Bacterial Spot, Early Blight, Healthy, Late Blight 🚨, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Mosaic Virus 🚨, Yellow Leaf Curl 🚨 |

🚨 = Critical — immediate action required

---

## 🔌 Part 2 — IoT Smart Farming

### Hardware (~₹900)

| Component | Purpose | Pin |
|-----------|---------|-----|
| NodeMCU ESP8266 | Controller + WiFi | — |
| DHT22 | Temp & Humidity | D4 |
| Soil Sensor | Moisture % | A0 |
| NPK Sensor | N/P/K levels | D5, D6 |
| LDR | Sunlight | D7 |
| Rain Sensor | Rainfall | D8 |
| 5V Relay | Pump control | D3 |
| 16×2 LCD (I2C) | Local display | D2, D1 |

### Irrigation Logic
```
Soil < 30% AND No Rain → Pump ON (5 sec cycle)
Soil ≥ 30% OR Rain     → Pump OFF
```

### ThingSpeak Field Map
| Field | Data |
|-------|------|
| 1–2 | Temperature, Humidity |
| 3 | Soil Moisture |
| 4–6 | N, P, K (mg/kg) |
| 7–8 | Light Level, Rain |

---

## 🌐 Flask REST API

```bash
pip install flask tensorflow pillow
python api/app.py
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/predict` | POST | Upload leaf image → disease JSON |
| `/classes` | GET | List 15 supported classes |
| `/latest` | GET | Last cached prediction |

```bash
# Quick test
curl -X POST http://localhost:5000/predict -F "image=@leaf.jpg"
```

---

## 🖥️ Web Dashboard

Open `dashboard/index.html` in any browser.
Click **⚙ Config** and enter your ThingSpeak channel IDs and API keys.
Dashboard auto-refreshes every 30 seconds.

---

## 📱 Mobile Integration

See [`docs/mobile_integration.md`](docs/mobile_integration.md) for:
- Android (Kotlin + OkHttp)
- iOS (Swift + URLSession)
- React Native (JavaScript)
- TFLite offline inference

---

## ☁️ Deployment

See [`docs/deployment.md`](docs/deployment.md) for:
- Colab + ngrok (quickest)
- Raspberry Pi + systemd
- GCP Cloud Run (Docker)
- AWS EC2 + nginx

---

## 🛡️ Reliability Improvements

| Risk | Mitigation |
|------|-----------|
| WiFi dropout | Auto-reconnect in firmware (implemented) |
| Sensor failure | Last-good-value fallback (implemented) |
| Power outage | 18650 battery + TP4056 charger |
| Colab timeout | Use Raspberry Pi or cloud VM for production |
| Model uncertainty | Confidence threshold (60%) + `confident_enough` flag |

---

## 📦 Quick Install

```bash
# Clone / open project folder
cd CGUARD

# Install Python dependencies
pip install -r requirements.txt

# Run API server
python api/app.py

# Run ThingSpeak bridge
python integration/thingspeak_bridge.py

# Open dashboard
start dashboard/index.html     # Windows
open dashboard/index.html      # macOS
```

---

*Built with ❤️ for precision agriculture — CropGuard Pro © 2026*
