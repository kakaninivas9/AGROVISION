# thingspeak_api.py — CropGuard Pro
# Fetch live and historical sensor data from ThingSpeak

import requests
import pandas as pd
from datetime import datetime, timedelta

CHANNEL_ID  = "3315477"
READ_API_KEY = "1RFPGG06YCM77ONU"
BASE_URL     = "https://api.thingspeak.com"

# Field mapping — must match your Arduino upload order
FIELD_MAP = {
    "field1": "temperature",
    "field2": "humidity",
    "field3": "moisture_pct",
    "field4": "nitrogen",
    "field5": "phosphorus",
    "field6": "potassium",
    "field7": "light",       # 0=bright, 1=low
    "field8": "rain",        # 0=dry, 1=raining
}

def get_latest_reading():
    """Fetch the single most recent sensor reading."""
    url = f"{BASE_URL}/channels/{CHANNEL_ID}/feeds/last.json"
    params = {"api_key": READ_API_KEY}
    try:
        r = requests.get(url, params=params, timeout=5)
        r.raise_for_status()
        raw = r.json()
        return _parse_entry(raw)
    except Exception as e:
        print(f"[ThingSpeak] Error fetching latest: {e}")
        return _dummy_reading()

def get_history(hours=24, results=200):
    """
    Fetch historical feed for the past N hours.
    Returns a pandas DataFrame with datetime index.
    """
    start = (datetime.utcnow() - timedelta(hours=hours)).strftime(
        "%Y-%m-%dT%H:%M:%SZ")
    url = f"{BASE_URL}/channels/{CHANNEL_ID}/feeds.json"
    params = {
        "api_key":  READ_API_KEY,
        "start":    start,
        "results":  results,
    }
    try:
        r = requests.get(url, params=params, timeout=8)
        r.raise_for_status()
        feeds = r.json().get("feeds", [])
        rows = [_parse_entry(f) for f in feeds]
        df = pd.DataFrame(rows)
        if not df.empty:
            df["created_at"] = pd.to_datetime(df["created_at"])
            df = df.set_index("created_at").sort_index()
            numeric_cols = [c for c in df.columns if c != "created_at"]
            df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric, errors="coerce")
        return df
    except Exception as e:
        print(f"[ThingSpeak] Error fetching history: {e}")
        return pd.DataFrame()

def get_moisture_history_for_prediction(hours=6):
    """
    Return list of (datetime, moisture_pct) tuples for predictive irrigation.
    """
    df = get_history(hours=hours, results=50)
    if df.empty or "moisture_pct" not in df.columns:
        return []
    df = df[["moisture_pct"]].dropna()
    return [(ts, val) for ts, val in zip(df.index, df["moisture_pct"])]

def _parse_entry(raw):
    entry = {"created_at": raw.get("created_at", datetime.utcnow().isoformat())}
    for field, name in FIELD_MAP.items():
        val = raw.get(field)
        try:
            entry[name] = float(val) if val is not None else None
        except (ValueError, TypeError):
            entry[name] = None
    return entry

def _dummy_reading():
    """Return safe dummy data when API is unreachable (demo/offline mode)."""
    import random
    return {
        "created_at":   datetime.utcnow().isoformat(),
        "moisture_pct": random.uniform(35, 75),
        "temperature":  random.uniform(22, 34),
        "humidity":     random.uniform(50, 80),
        "nitrogen":     random.uniform(25, 70),
        "phosphorus":   random.uniform(20, 60),
        "potassium":    random.uniform(20, 65),
        "light":        random.choice([0, 0, 0, 1]),
        "rain":         random.choice([0, 0, 0, 1]),
    }
