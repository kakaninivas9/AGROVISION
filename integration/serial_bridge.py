import serial
import json
import requests
import time

# --- CONFIG ---
PORT = "COM5"  # As seen in your Arduino IDE
BAUD = 115200
API_URL = "http://localhost:5001/api/iot/push"

def main():
    print(f"[Bridge] Starting AgroVision Serial Bridge on {PORT}...")
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        print(f"[Bridge] Connected to {PORT}. Waiting for data...")
    except Exception as e:
        print(f"[Bridge] Could not open serial port {PORT}: {e}")
        return

    while True:
        try:
            line = ser.readline().decode('utf-8').strip()
            if not line:
                continue
            
            # Look for JSON structure
            if line.startswith("{") and line.endswith("}"):
                print(f"[Data] Received: {line}")
                data = json.loads(line)
                
                # Push to local backend
                try:
                    resp = requests.post(API_URL, json=data, timeout=2)
                    if resp.status_code == 200:
                        print("   [Success] Pushed to Local API")
                    else:
                        print(f"   [Error] API Error: {resp.status_code}")
                except Exception as e:
                    print(f"   [Error] Push failed: {e}")
            else:
                print(f"[Serial] {line}")
                
        except json.JSONDecodeError:
            print(f"⚠️  Invalid JSON: {line}")
        except Exception as e:
            print(f"⚠️  Error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
