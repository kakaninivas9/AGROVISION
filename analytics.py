# analytics.py — CropGuard Pro
# Farm Health Score + Predictive Irrigation

import numpy as np
from datetime import datetime

# ── Farm Health Score (0–100) ────────────────────────────────
# Weights must sum to 1.0
WEIGHTS = {
    "moisture":    0.30,
    "temperature": 0.20,
    "humidity":    0.15,
    "nitrogen":    0.15,
    "phosphorus":  0.10,
    "potassium":   0.10,
}

# Ideal ranges for each parameter
IDEAL = {
    "moisture":    (40,  70),   # % (too dry <40, waterlogged >70)
    "temperature": (20,  32),   # °C
    "humidity":    (50,  80),   # %
    "nitrogen":    (30, 100),   # mg/kg
    "phosphorus":  (20,  80),   # mg/kg
    "potassium":   (20,  80),   # mg/kg
}

def _score_param(value, low, high):
    """Return 0–100 score for a single parameter."""
    if value is None:
        return 50  # neutral if sensor unavailable
    if low <= value <= high:
        # Perfect zone — full score, with slight peak at midpoint
        mid = (low + high) / 2
        spread = (high - low) / 2
        return 100 - 10 * ((value - mid) / spread) ** 2
    elif value < low:
        # Below ideal — linear drop to 0 at half the ideal minimum
        floor = low / 2
        return max(0, 100 * (value - floor) / (low - floor))
    else:
        # Above ideal — linear drop to 0 at 1.5× the ideal maximum
        ceiling = high * 1.5
        return max(0, 100 * (ceiling - value) / (ceiling - high))

def farm_health_score(moisture, temperature, humidity,
                      nitrogen, phosphorus, potassium):
    """
    Calculate overall farm health score 0–100.
    Returns: (score, breakdown_dict, status_label)
    """
    readings = {
        "moisture":    moisture,
        "temperature": temperature,
        "humidity":    humidity,
        "nitrogen":    nitrogen,
        "phosphorus":  phosphorus,
        "potassium":   potassium,
    }

    breakdown = {}
    weighted_sum = 0.0

    for param, value in readings.items():
        low, high = IDEAL[param]
        s = _score_param(value, low, high)
        breakdown[param] = round(s, 1)
        weighted_sum += s * WEIGHTS[param]

    score = round(weighted_sum, 1)

    if score >= 80:
        status = "Excellent"
        color  = "green"
    elif score >= 60:
        status = "Good"
        color  = "blue"
    elif score >= 40:
        status = "Fair"
        color  = "orange"
    else:
        status = "Critical"
        color  = "red"

    return score, breakdown, status, color


# ── Predictive Irrigation ────────────────────────────────────

def predict_irrigation(moisture_history, rain_forecast=False,
                       window_hours=6, dry_threshold=40):
    """
    Predict whether irrigation will be needed in the next window.

    Args:
        moisture_history: list of (timestamp, moisture_pct) tuples,
                          newest last, covering at least 3 readings.
        rain_forecast:    bool — True if rain expected (from API or rain sensor trend).
        window_hours:     how many hours ahead to predict.
        dry_threshold:    moisture % below which irrigation is needed.

    Returns:
        dict with keys:
          - irrigate_now  (bool)
          - predicted_moisture (float)
          - hours_until_dry (float | None)
          - confidence (str)
          - reason (str)
    """
    if len(moisture_history) < 2:
        return {
            "irrigate_now": False,
            "predicted_moisture": None,
            "hours_until_dry": None,
            "confidence": "low",
            "reason": "Insufficient historical data (need ≥2 readings)."
        }

    # Extract values and compute moisture trend (% per hour)
    times   = [t for t, _ in moisture_history]
    values  = [v for _, v in moisture_history]
    current = values[-1]

    # Convert timestamps to hours elapsed
    t0 = times[0]
    hours = [(t - t0).total_seconds() / 3600 for t in times]

    # Linear regression to find drying rate
    if len(hours) >= 3:
        coeffs = np.polyfit(hours, values, 1)  # [slope, intercept]
        slope  = coeffs[0]  # % moisture change per hour (negative = drying)
    else:
        slope = (values[-1] - values[0]) / max((hours[-1] - hours[0]), 0.01)

    # Predicted moisture after window_hours
    predicted = current + slope * window_hours
    predicted = max(0, min(100, predicted))

    # How many hours until soil hits dry threshold?
    if slope < 0 and current > dry_threshold:
        hours_until_dry = (current - dry_threshold) / abs(slope)
    elif current <= dry_threshold:
        hours_until_dry = 0.0
    else:
        hours_until_dry = None  # soil is getting wetter

    # Decision logic
    if rain_forecast:
        return {
            "irrigate_now": False,
            "predicted_moisture": round(predicted, 1),
            "hours_until_dry": hours_until_dry,
            "confidence": "high",
            "reason": "Rain forecast detected — skipping irrigation to save water."
        }

    if current <= dry_threshold:
        return {
            "irrigate_now": True,
            "predicted_moisture": round(predicted, 1),
            "hours_until_dry": 0.0,
            "confidence": "high",
            "reason": f"Soil is currently dry ({current:.0f}% < {dry_threshold}%). Irrigate now."
        }

    if hours_until_dry is not None and hours_until_dry <= window_hours:
        return {
            "irrigate_now": True,
            "predicted_moisture": round(predicted, 1),
            "hours_until_dry": round(hours_until_dry, 1),
            "confidence": "medium",
            "reason": (f"Soil will reach dry threshold in ~{hours_until_dry:.1f}h "
                       f"(trend: {slope:+.1f}%/hr). Pre-emptive irrigation recommended.")
        }

    return {
        "irrigate_now": False,
        "predicted_moisture": round(predicted, 1),
        "hours_until_dry": round(hours_until_dry, 1) if hours_until_dry else None,
        "confidence": "high",
        "reason": (f"Soil moisture adequate ({current:.0f}%). "
                   f"Predicted in {window_hours}h: {predicted:.0f}%.")
    }


# ── Alert Generator ──────────────────────────────────────────

def generate_alerts(moisture, temperature, humidity,
                    nitrogen, phosphorus, potassium,
                    is_raining, pump_active, light_ok):
    """Return list of alert dicts with level and message."""
    alerts = []

    def alert(level, param, msg):
        alerts.append({"level": level, "param": param, "message": msg,
                        "time": datetime.now().strftime("%H:%M")})

    if moisture < 25:
        alert("critical", "moisture", f"Soil critically dry ({moisture}%). Irrigate immediately.")
    elif moisture < 40:
        alert("warning",  "moisture", f"Soil moisture low ({moisture}%). Consider irrigation.")

    if moisture > 85:
        alert("warning", "moisture", f"Soil waterlogged ({moisture}%). Check drainage.")

    if temperature > 38:
        alert("warning", "temperature", f"High temperature ({temperature}°C). Risk of heat stress.")
    elif temperature < 10:
        alert("warning", "temperature", f"Low temperature ({temperature}°C). Risk of frost damage.")

    if nitrogen < 20:
        alert("critical", "npk", f"Nitrogen critically low (N={nitrogen}). Apply N fertiliser.")
    if phosphorus < 15:
        alert("warning",  "npk", f"Phosphorus low (P={phosphorus}). Apply P fertiliser.")
    if potassium < 15:
        alert("warning",  "npk", f"Potassium low (K={potassium}). Apply K fertiliser.")

    if not light_ok:
        alert("info", "light", "Low sunlight detected. Monitor for crop light deficiency.")

    if is_raining and pump_active:
        alert("warning", "pump", "Rain detected but pump is ON. Check auto-irrigation logic.")

    return alerts
