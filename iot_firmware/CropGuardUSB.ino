/*
 ╔══════════════════════════════════════════════════════════╗
  ║    CropGuard Pro — Digital Twin (USB Serial Version)     ║
  ║    Only for use with the AgroVision Web Dashboard        ║
  ║    No WiFi Required! Just plug and see results.         ║
  ╚══════════════════════════════════════════════════════════╝
*/

#define SOIL_PIN A0

int soilRaw = 0;
int soilPct = 0;
int temperature = 0;
int humidity = 0;
int nVal = 0, pVal = 0, kVal = 0, oilLevel = 0;
int readCount = 0;

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(A0));
  Serial.println(""); // Clear line
  Serial.println("✅ CropGuard USB Terminal Started");
}

void readSensors() {
  soilRaw = analogRead(SOIL_PIN);
  if (soilRaw < 100) {
    static int fakeSoil = 600;
    fakeSoil += random(-5,6);
    fakeSoil = constrain(fakeSoil, 400, 900);
    soilRaw = fakeSoil;
  }
  soilPct = map(soilRaw, 1023, 0, 0, 100);
  soilPct = constrain(soilPct, 0, 100);

  temperature = 28 + random(-1, 2);
  humidity    = 65 + random(-2, 3);
  oilLevel    = 85 + random(-1, 2);
  nVal        = 45 + random(-1, 2);
  pVal        = 30 + random(-1, 2);
  kVal        = 55 + random(-1, 2);
  readCount++;
}

void loop() {
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 3000) {
    lastUpdate = millis();
    readSensors();
    
    // Create a pre-formatted JSON string to avoid printf buffering issues
    String json = "{";
    json += "\"soil\":" + String(soilPct) + ",";
    json += "\"temp\":" + String(temperature) + ",";
    json += "\"hum\":" + String(humidity) + ",";
    json += "\"oil\":" + String(oilLevel) + ",";
    json += "\"n\":" + String(nVal) + ",";
    json += "\"p\":" + String(pVal) + ",";
    json += "\"k\":" + String(kVal) + ",";
    json += "\"raw\":" + String(soilRaw) + ",";
    json += "\"reads\":" + String(readCount);
    json += "}";

    // Print to Serial as a single line
    Serial.println(json);
    Serial.flush();
  }
}
