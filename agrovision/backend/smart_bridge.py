import serial
import serial.tools.list_ports
import requests
import time
import json
import os

# Configuration
BAUD_RATE = 115200 
API_URL = 'http://localhost:5001/api/iot/push'

def find_arduino_port():
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        print(f"[*] Found port: {p.device} - {p.description}")
        if "Arduino" in p.description or "CH340" in p.description or "CP210" in p.description or "USB Serial" in p.description:
            return p.device
    if ports:
        return ports[0].device
    return None

def main():
    print("=======================================")
    print("AgroVision Smart Telemetry Bridge")
    print("=======================================")
    
    port = find_arduino_port()
    if not port:
        print("[!] No COM ports found. Please connect your Arduino.")
        return

    print(f"[*] Connecting to {port} @ {BAUD_RATE}")

    try:
        # Open port
        ser = serial.Serial(port, BAUD_RATE, timeout=0.1)
        time.sleep(2)
        ser.reset_input_buffer()
        print(f"[*] Connected to {port}! Reading buffer...\n")
    except Exception as e:
        print(f"\n[!] ERROR: {e}")
        return

    data_buffer = ""
    
    while True:
        try:
            if ser.in_waiting > 0:
                raw = ser.read(ser.in_waiting)
                chunk = raw.decode('utf-8', errors='ignore')
                data_buffer += chunk
                
                if '{' in data_buffer and '}' in data_buffer:
                    start_idx = data_buffer.rfind('{')
                    end_idx = data_buffer.find('}', start_idx) + 1
                    
                    if start_idx != -1 and end_idx > start_idx:
                        json_str = data_buffer[start_idx:end_idx]
                        
                        try:
                            payload = json.loads(json_str)
                            print(f"[{port}] Valid Data: {json_str}")
                            
                            try:
                                resp = requests.post(API_URL, json=payload, timeout=2)
                                if resp.status_code == 200:
                                    print(f"  [+] Synced Successfully")
                                else:
                                    print(f"  [-] API Error: {resp.status_code}")
                            except Exception as e:
                                print(f"  [-] Sync failed: {e}")
                                
                            data_buffer = "" 
                        except json.JSONDecodeError:
                            pass
                
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
