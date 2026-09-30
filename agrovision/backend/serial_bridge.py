import serial
import requests
import time
import json
import os

# Configuration
PORT = 'COM5'
BAUD_RATE = 115200 
API_URL = 'http://localhost:5001/api/iot/push'

def main():
    print("=======================================")
    print("AgroVision Robust Telemetry Bridge")
    print("=======================================")
    print(f"[*] Connecting: {PORT} @ {BAUD_RATE}")

    try:
        # Open port
        ser = serial.Serial(PORT, BAUD_RATE, timeout=0.1)
        time.sleep(2)
        ser.reset_input_buffer()
        print("[*] Connected! Reading buffer...\n")
    except Exception as e:
        print(f"\n[!] ERROR: {e}")
        return

    data_buffer = ""
    
    while True:
        try:
            if ser.in_waiting > 0:
                # Read all available bytes
                raw = ser.read(ser.in_waiting)
                chunk = raw.decode('utf-8', errors='ignore')
                data_buffer += chunk
                
                # Check if we have a full JSON object in the buffer
                if '{' in data_buffer and '}' in data_buffer:
                    # Find the LAST complete JSON block
                    start_idx = data_buffer.rfind('{')
                    end_idx = data_buffer.find('}', start_idx) + 1
                    
                    if start_idx != -1 and end_idx > start_idx:
                        json_str = data_buffer[start_idx:end_idx]
                        
                        try:
                            payload = json.loads(json_str)
                            print(f"[COM5] Valid Data: {json_str}")
                            
                            # Sync to backend
                            resp = requests.post(API_URL, json=payload, timeout=2)
                            if resp.status_code == 200:
                                print(f"  [+] Synced Successfully")
                            else:
                                print(f"  [-] API Error: {resp.status_code}")
                                
                            # Clear buffer after successful parse of latest data
                            data_buffer = "" 
                        except json.JSONDecodeError:
                            # If it's not valid yet, keep buffering
                            pass
                
                # Prevent buffer from growing infinitely
                if len(data_buffer) > 2000:
                    data_buffer = ""

            time.sleep(0.1)

        except KeyboardInterrupt:
            print("\n[*] Exiting...")
            break
        except Exception as e:
            print(f"\n[!] Bridge Error: {e}")
            time.sleep(1)

    ser.close()

if __name__ == "__main__":
    main()
