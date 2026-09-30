import serial
import time

PORT = 'COM5'
BAUD_RATE = 115200

print(f"Opening {PORT} at {BAUD_RATE}...")
try:
    ser = serial.Serial(PORT, BAUD_RATE, timeout=1)
    time.sleep(2)
    ser.reset_input_buffer()
    print("Reading for 10 seconds...")
    end_time = time.time() + 10
    while time.time() < end_time:
        if ser.in_waiting > 0:
            data = ser.read(ser.in_waiting)
            print(f"RAW: {data}")
    ser.close()
except Exception as e:
    print(f"Error: {e}")
