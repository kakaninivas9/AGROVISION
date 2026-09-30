import requests
import time
import random
import json

API_URL = 'http://localhost:5001/api/iot/push'

def generate_mock_data():
    return {
        "temp": round(random.uniform(20.0, 35.0), 2),
        "hum": round(random.uniform(40.0, 70.0), 2),
        "soil": round(random.uniform(10.0, 80.0), 2),
        "n": random.randint(20, 100),
        "p": random.randint(20, 100),
        "k": random.randint(20, 100),
        "oil": random.randint(0, 100), # Light intensity usually
        "rain": random.randint(0, 1)
    }

def main():
    print("=======================================")
    print("AgroVision MOCK Telemetry Bridge")
    print("Sending fake data to local API...")
    print("=======================================")
    
    while True:
        try:
            payload = generate_mock_data()
            print(f"[*] Sending: {json.dumps(payload)}")
            
            resp = requests.post(API_URL, json=payload, timeout=2)
            if resp.status_code == 200:
                print(f"  [+] Synced Successfully")
            else:
                print(f"  [-] API Error: {resp.status_code}")
                
        except Exception as e:
            print(f"  [-] Sync failed: {e}")
            
        time.sleep(5) # Send every 5 seconds

if __name__ == "__main__":
    main()
