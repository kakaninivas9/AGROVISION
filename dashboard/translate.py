import os

file_path = r"c:\Users\saini\Downloads\CGUARD\dashboard\index.html"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "SMART AGRICULTURE MONITORING SYSTEM v2.0": "Smart Farm Helper",
    "NAVIGATION": "MENU",
    "Live Dashboard": "My Farm",
    "Live Farm Dashboard": "My Farm Status",
    "REAL-TIME SENSOR READINGS": "Live details from your field",
    "Disease Detection": "Check Crop Health",
    "Analytics": "Farm History",
    "Farm Health Score": "Overall Farm Health",
    "Soil Moisture": "Soil Wetness (Water)",
    "Temperature": "Heat (Temperature)",
    "Humidity": "Air Moisture",
    "NITROGEN (N)": "Nitrogen (For Leaf Growth)",
    "PHOSPHORUS (P)": "Phosphorus (For Roots)",
    "POTASSIUM (K)": "Potassium (For Flowers & Fruit)",
    "IDEAL: 30–100 mg/kg": "Good Level: 30–100",
    "IDEAL: 20–80 mg/kg": "Good Level: 20–80",
    "RAINFALL": "IS IT RAINING?",
    "IRRIGATION": "WATER PUMP OUTLOOK",
    "ACTIVE ALERTS": "FARM WARNINGS",
    "Predictive Irrigation": "Watering Advice",
    "NO IRRIGATION NEEDED": "NO NEED TO WATER NOW",
    "IRRIGATE NOW": "WATER NOW?",
    "6H FORECAST": "IN 6 HOURS",
    "UNTIL DRY": "HOURS UNTIL DRY",
    "AI Disease Detection": "Crop Disease Checker",
    "CNN · MOBILENETV2 · PLANTVILLAGE DATASET · 15 CLASSES": "Take a photo of a sick leaf, and the AI Doctor will tell you what's wrong.",
    "Drop a leaf photo here": "Click here to take or upload a leaf photo",
    "Supports JPG, PNG · Click to browse · Analyzed by MobileNetV2 CNN": "Make sure the picture is clear and shows the sick part of the leaf.",
    "DETECTED CONDITION": "YOUR CROP HAS",
    "TREATMENT RECOMMENDATION": "HOW TO TREAT IT",
    "Top Predictions": "What else it could be",
    "Supported Crop Classes": "Crops our AI Doctor knows",
    "Farm Analytics": "Farm History & Trends",
    "HISTORICAL TRENDS · CORRELATION · SENSOR LOG": "See how your farm is doing over time",
    "Smart Alerts": "Farm Messages",
    "THRESHOLD MONITORING · RULE-BASED ENGINE": "Important updates about your crops",
    "Soil critically dry": "Soil is extremely dry",
    "Irrigate immediately": "Please turn on the water pump now",
    "Consider irrigation": "You might need to water soon",
    "Risk of heat stress": "It is very hot. Plants might get stressed",
    "Apply N fertiliser": "Your soil needs Urea / Nitrogen fertiliser",
    "Apply P fertiliser": "Your soil needs Phosphorus fertiliser",
    "Apply K fertiliser": "Your soil needs Potassium / Potash fertiliser",
    "All systems normal. Farm is in good health": "Everything looks great! Your farm is happy and healthy",
    "Alert Thresholds Reference": "What do the numbers mean?",
    "Sensor Data Log (Latest 10 readings)": "Recent Sensor Readings",
    "Moisture Trend (24h)": "Soil Water Level (Past 24 Hours)",
    "Temperature & Humidity (24h)": "Heat & Air Moisture (Past 24 Hours)",
    "Health Score Breakdown": "Farm Health Details",
    "Apply copper-based fungicide. Remove infected leaves. Improve air circulation": "Spray a copper-based medicine. Cut off the sick leaves. Make sure there is space for air to flow.",
    "Plant is healthy! Continue current care routine.": "Your plant is completely healthy! Keep doing what you are doing.",
    "Apply metalaxyl + mancozeb. Remove and destroy infected tubers. Avoid waterlogging.": "Spray metalaxyl medicine. Remove and burn the sick parts. Do not let water collect near the roots."
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Translation applied successfully!")
