"""
=============================================================================
CropGuard Pro — ThingSpeak Integration Bridge
=============================================================================
Purpose : A bridge script that:
          1. Reads the latest IoT sensor values from ThingSpeak
          2. Reads the latest AI disease prediction from ThingSpeak
          3. Evaluates combined crop health status
          4. Generates actionable alerts for the farmer

Run this on:
  • Google Colab (after running predict.py with --thingspeak)
  • A Raspberry Pi connected to the same network as NodeMCU
  • Any Python server / cloud function
=============================================================================
"""

import json
import time
import datetime
import urllib.request

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
# IoT sensor channel (NodeMCU pushes to this)
IOT_CHANNEL_ID    = 0           # ← Replace with your ThingSpeak Channel ID
IOT_READ_API_KEY  = "YOUR_IOT_READ_API_KEY"    # ← Read API Key

# AI disease prediction channel (predict.py pushes to this)
# Can be the same channel if you have extra fields, or a separate one
AI_CHANNEL_ID     = 0           # ← Replace (can be same as IOT_CHANNEL_ID)
AI_READ_API_KEY   = "YOUR_AI_READ_API_KEY"

# ThingSpeak base URL
TS_BASE = "https://api.thingspeak.com"

# Polling interval (seconds)
POLL_INTERVAL = 60

# Thresholds (must match the .ino firmware values)
SOIL_DRY_THRESHOLD    = 30   # %
TEMP_HIGH_THRESHOLD   = 38   # °C
HUMIDITY_HIGH_THRESHOLD = 85  # %
N_LOW_THRESHOLD       = 20   # mg/kg
P_LOW_THRESHOLD       = 15   # mg/kg
K_LOW_THRESHOLD       = 20   # mg/kg

# ── HELPER: Fetch latest ThingSpeak feed ──────────────────────────────────────
def fetch_latest_feed(channel_id: int, read_api_key: str, results: int = 1) -> dict:
    """
    Fetch the most recent `results` entries from a ThingSpeak channel.
    Returns parsed JSON or empty dict on error.
    """
    url = (
        f"{TS_BASE}/channels/{channel_id}/feeds.json"
        f"?api_key={read_api_key}&results={results}"
    )
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[ThingSpeak] Fetch error (channel {channel_id}): {e}")
        return {}

def get_field(feed_entry: dict, field_num: int, default=None):
    """Safely read a field value from a ThingSpeak feed entry."""
    val = feed_entry.get(f"field{field_num}")
    if val is None or val == "":
        return default
    try:
        return float(val)
    except ValueError:
        return val   # return as string (e.g. status fields)

# ── PARSE IOT SENSOR DATA ─────────────────────────────────────────────────────
def parse_iot_data(feed_data: dict) -> dict:
    """
    Extract sensor values from the ThingSpeak feed.
    ThingSpeak field mapping (must match CropGuardPro.ino):
        Field 1 → Temperature  (°C)
        Field 2 → Humidity     (%)
        Field 3 → Soil Moisture(%)
        Field 4 → Nitrogen     (mg/kg)
        Field 5 → Phosphorus   (mg/kg)
        Field 6 → Potassium    (mg/kg)
        Field 7 → Light Level  (0/1)
        Field 8 → Rain Detected(0/1)
    """
    feeds = feed_data.get("feeds", [{}])
    entry = feeds[-1] if feeds else {}

    return {
        "temperature"  : get_field(entry, 1),
        "humidity"     : get_field(entry, 2),
        "soil_moisture": get_field(entry, 3),
        "nitrogen"     : get_field(entry, 4),
        "phosphorus"   : get_field(entry, 5),
        "potassium"    : get_field(entry, 6),
        "light_level"  : get_field(entry, 7),
        "rain_detected": get_field(entry, 8),
        "timestamp"    : entry.get("created_at", "N/A"),
    }

# ── PARSE AI DISEASE DATA ─────────────────────────────────────────────────────
def parse_ai_data(feed_data: dict) -> dict:
    """
    Extract AI disease prediction from ThingSpeak feed.
    Field mapping (written by predict.py --thingspeak):
        Field 1 → Confidence (%)
        Field 2 → Is Healthy (1/0)
        Status  → Disease label string
    """
    channel  = feed_data.get("channel", {})
    feeds    = feed_data.get("feeds", [{}])
    entry    = feeds[-1] if feeds else {}

    return {
        "confidence"  : get_field(entry, 1),
        "is_healthy"  : get_field(entry, 2),
        "disease_label": entry.get("status", "Unknown"),
        "timestamp"   : entry.get("created_at", "N/A"),
    }

# ── GENERATE ALERTS ───────────────────────────────────────────────────────────
def evaluate_crop_health(iot: dict, ai: dict) -> list:
    """
    Combined analysis of IoT sensor values + AI prediction.
    Returns a list of alert strings.
    """
    alerts = []

    # ── Soil moisture ──
    sm = iot.get("soil_moisture")
    if sm is not None and sm < SOIL_DRY_THRESHOLD:
        alerts.append(
            f"🚿 IRRIGATION NEEDED — Soil moisture is {sm:.0f}% "
            f"(below {SOIL_DRY_THRESHOLD}% threshold)"
        )

    # ── Temperature ──
    temp = iot.get("temperature")
    if temp is not None and temp > TEMP_HIGH_THRESHOLD:
        alerts.append(
            f"🌡  HIGH TEMPERATURE — {temp:.1f}°C detected. "
            "Risk of heat stress. Consider shading or increased irrigation."
        )

    # ── Humidity ──
    hum = iot.get("humidity")
    if hum is not None and hum > HUMIDITY_HIGH_THRESHOLD:
        alerts.append(
            f"💧 HIGH HUMIDITY — {hum:.0f}%. "
            "Favourable conditions for fungal diseases."
        )

    # ── NPK nutrients ──
    n = iot.get("nitrogen")
    p = iot.get("phosphorus")
    k = iot.get("potassium")
    if n is not None and n < N_LOW_THRESHOLD:
        alerts.append(f"🌿 LOW NITROGEN — {n} mg/kg. Apply nitrogen-rich fertiliser.")
    if p is not None and p < P_LOW_THRESHOLD:
        alerts.append(f"🌿 LOW PHOSPHORUS — {p} mg/kg. Apply phosphorus supplement.")
    if k is not None and k < K_LOW_THRESHOLD:
        alerts.append(f"🌿 LOW POTASSIUM — {k} mg/kg. Apply potassium-rich fertiliser.")

    # ── AI Disease prediction ──
    is_healthy = ai.get("is_healthy")
    disease    = ai.get("disease_label", "Unknown")
    conf       = ai.get("confidence")

    CRITICAL = {
        "Potato – Late Blight",
        "Tomato – Late Blight",
        "Tomato – Yellow Leaf Curl Virus",
        "Tomato – Mosaic Virus",
    }

    if is_healthy is not None and float(is_healthy) == 0:
        severity = "🚨 CRITICAL" if disease in CRITICAL else "⚠  WARNING"
        # Bug fix: conf may be None if field is empty
        conf_str = f"{float(conf):.0f}%" if conf is not None else "N/A"
        alerts.append(
            f"{severity} DISEASE DETECTED — {disease} "
            f"({conf_str} confidence). Consult an agronomist immediately."
        )

    return alerts

# ── PRINT DASHBOARD ───────────────────────────────────────────────────────────
def print_dashboard(iot: dict, ai: dict, alerts: list):
    ts_now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    print("\n" + "═" * 60)
    print(f"  🌱 CropGuard Pro — Live Dashboard        ({ts_now})")
    print("═" * 60)
    print("  ── IoT Sensor Values ──────────────────────────────")
    print(f"  Temperature    : {iot.get('temperature', 'N/A')} °C")
    print(f"  Humidity       : {iot.get('humidity', 'N/A')} %")
    print(f"  Soil Moisture  : {iot.get('soil_moisture', 'N/A')} %")
    print(f"  Nitrogen (N)   : {iot.get('nitrogen', 'N/A')} mg/kg")
    print(f"  Phosphorus (P) : {iot.get('phosphorus', 'N/A')} mg/kg")
    print(f"  Potassium (K)  : {iot.get('potassium', 'N/A')} mg/kg")
    print(f"  Rain Detected  : {'Yes' if iot.get('rain_detected') else 'No'}")
    print(f"  IoT Reading At : {iot.get('timestamp', 'N/A')}")
    print()
    print("  ── AI Disease Detection ───────────────────────────")
    print(f"  Diagnosis      : {ai.get('disease_label', 'N/A')}")
    print(f"  Confidence     : {ai.get('confidence', 'N/A')} %")
    print(f"  Healthy        : {'Yes ✅' if ai.get('is_healthy') else 'No ❌'}")
    print(f"  AI Reading At  : {ai.get('timestamp', 'N/A')}")
    print()
    if alerts:
        print("  ── 🚨 Alerts ──────────────────────────────────────")
        for alert in alerts:
            print(f"     {alert}")
    else:
        print("  ✅ All systems normal — no alerts.")
    print("═" * 60)

# ── MAIN POLLING LOOP ─────────────────────────────────────────────────────────
def main():
    print("[CropGuard Pro Bridge] Starting monitoring loop…")
    print(f"  Poll interval : {POLL_INTERVAL}s")
    print(f"  IoT Channel   : {IOT_CHANNEL_ID}")
    print(f"  AI Channel    : {AI_CHANNEL_ID}\n")

    # ── Startup validation ──
    if IOT_CHANNEL_ID == 0 or "YOUR_" in IOT_READ_API_KEY:
        print("⚠  WARNING: IoT channel ID or API key not configured.")
        print("   Edit the CONFIG section at the top of this file.\n")

    while True:
        try:
            # Fetch latest data from both channels
            iot_feed = fetch_latest_feed(IOT_CHANNEL_ID, IOT_READ_API_KEY)
            ai_feed  = fetch_latest_feed(AI_CHANNEL_ID,  AI_READ_API_KEY)

            iot    = parse_iot_data(iot_feed)
            ai     = parse_ai_data(ai_feed)
            alerts = evaluate_crop_health(iot, ai)

            print_dashboard(iot, ai, alerts)

        except KeyboardInterrupt:
            print("\n[CropGuard Pro Bridge] Stopped by user.")
            break
        except Exception as e:
            print(f"[ERROR] {e}")

        # Bug fix: KeyboardInterrupt during sleep was previously uncaught
        try:
            time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("\n[CropGuard Pro Bridge] Stopped by user.")
            break

if __name__ == "__main__":
    main()
