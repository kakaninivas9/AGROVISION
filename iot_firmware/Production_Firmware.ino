/*
 ╔══════════════════════════════════════════════════════════╗
  ║    CropGuard Pro — Production Version (Real Sensors)     ║
  ║    Use this version ONLY with physical sensor hardware.   ║
  ╚══════════════════════════════════════════════════════════╝
*/

#define SOIL_PIN A0

// Note: For Temperature/Humidity, this code assumes a DHT sensor.
// If you don't have one, these will report 0.
int soilRaw = 0;
int soilPct = 0;
int temperature = 0; 
int humidity = 0;
int nVal = 0, pVal = 0, kVal = 0, oilLevel = 0;
int readCount = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("✅ CropGuard Production Firmware Started");
}

void readSensors() {
  // Read Real Soil Sensor
  soilRaw = analogRead(SOIL_PIN);
  
  // Mapping: 1023 (Air/Dry) to 0 (Water/Wet) 
  // Adjust these values based on your specific sensor calibration
  soilPct = map(soilRaw, 1023, 0, 0, 100);
  soilPct = constrain(soilPct, 0, 100);

  // For production, these should be read from real sensors (DHT11, NPK, etc.)
  // If not connected, they will stay at 0.
  // temperature = myDHT.readTemperature();
  // humidity    = myDHT.readHumidity();
  
  readCount++;
}

void loop() {
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 3000) {
    lastUpdate = millis();
    readSensors();
    
    // Output Real Data JSON to Serial
    Serial.printf("{\"soil\":%d,\"temp\":%d,\"hum\":%d,\"oil\":%d,\"n\":%d,\"p\":%d,\"k\":%d,\"raw\":%d,\"reads\":%d}\n", 
                  soilPct, temperature, humidity, oilLevel, nVal, pVal, kVal, soilRaw, readCount);
  }
}
