import requests
import time
import random

API_URL = "http://localhost:5001/api/iot/push"

def generate_mock_data():
    return {
        "soil": round(random.uniform(30, 70), 1),
        "temp": round(random.uniform(20, 35), 1),
        "hum": round(random.uniform(40, 80), 1),
        "oil": round(random.uniform(50, 100), 1), # Light level
        "n": round(random.uniform(20, 60), 1),
        "p": round(random.uniform(15, 45), 1),
        "k": round(random.uniform(20, 50), 1),
        "raw": random.randint(400, 800),
        "reads": 1
    }

def main():
    print(f"[*] Starting Mock IoT Data Stream -> {API_URL}")
    while True:
        try:
            data = generate_mock_data()
            print(f"[*] Sending: Soil={data['soil']}% Temp={data['temp']}degC...")
            resp = requests.post(API_URL, json=data, timeout=5)
            if resp.status_code == 200:
                print("   [+] Synced Successfully")
            else:
                print(f"   [-] API Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"   [!] Error: {e}")
        
        time.sleep(10) # Send data every 10 seconds

if __name__ == "__main__":
    main()
