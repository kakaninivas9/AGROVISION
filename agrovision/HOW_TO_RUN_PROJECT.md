# 🌾 CropGuard — AI Powered Smart Agriculture Command Center
**Official Execution & Deployment Guide**

This document outlines the standard operating procedure to initialize the full-stack, award-winning CropGuard architecture, including the autonomous hardware telemetry bridge.

---

## 🛠️ System Requirements
Before launching the platform, ensure the host machine has the following dependencies natively installed:
- **Node.js** (v18 or higher)
- **Python 3** (w/ `pyserial` and `requests` packages)
- **Arduino** (Connected via USB)

---

## 🚀 Initialization Sequence (3-Step Launch)

To achieve the complete "Digital Twin" real-time monitoring experience, you must spin up three separate microservices in three different terminal windows. 

All commands must be executed within the `agrovision` project directory.

### Step 1: Launch the API Backend Server
This service acts as the central brain—processing authentication, AI logic, and hardware data routing.
1. Open Terminal 1
2. Navigate to: `agrovision/backend`
3. Run the command:
   ```bash
   node src/index.js
   ```
*(Expected Output: "🌱 AgroVision API running on http://localhost:5001")*

---

### Step 2: Initialize the Cinematic UI (Frontend)
This service powers the high-framerate, glassmorphic React dashboard.
1. Open Terminal 2
2. Navigate to: `agrovision/frontend`
3. Run the command: 
   ```bash
   npm run dev
   ```
*(Expected Output: "VITE ready. Local: http://localhost:5173")*

---

### Step 3: Ignite the Hardware Telemetry Daemon 
This service acts as an invisible stealth bridge. It silently captures the 115200 baud strings from your Arduino's sensors and injects them relentlessly into the Express backend API, completely bypassing browser security locks.

1. First, make sure you **close the Arduino IDE Serial Monitor**. The port cannot be shared.
2. Ensure your programmed Arduino is plugged into the laptop via USB (`COM5`).
3. Open Terminal 3
4. Navigate to: `agrovision/backend`
5. Run the command:
   ```bash
   python serial_bridge.py
   ```
*(Expected Output: "[*] Successfully connected! Waiting for sensor data...")*

---

## 📱 Connecting External Devices (e.g., Mobile Phones)

Because the architecture utilizes advanced network routing, you do not need to wire the Arduino directly to a mobile device. The laptop acts as the Command Center.

To view the live dashboard on a smartphone/tablet:
1. Ensure the smartphone and the laptop are on the exact **same Wi-Fi network**.
2. Look at Terminal 2 (`npm run dev`). You will see an IP address listed under **Network** (e.g., `http://192.168.1.5:5173`).
3. Type that exact IP address into your smartphone’s Safari or Chrome browser.

The phone will instantly synchronize with the overarching backend architecture and reflect your live hardware data in real-time.

---
**Prepared For:** Agriculture Innovation Evaluators & Review Boards
**Status:** Production-Ready
