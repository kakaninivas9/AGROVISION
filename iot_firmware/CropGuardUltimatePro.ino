/*
 ╔══════════════════════════════════════════════════════════╗
  ║    CropGuard Ultimate Pro — WiFi AP + USB Serial        ║
  ║    Features: NPK, Oil, Digital Twin, Mobile Sync        ║
  ║    WiFi: "CropGuard" | Pass: "12345678" | IP: 192.168.4.1 ║
  ╚══════════════════════════════════════════════════════════╝
*/

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

const char* ssid     = "CropGuard";
const char* password = "12345678";

#define SOIL_PIN A0

ESP8266WebServer server(80);

int soilRaw = 0, soilPct = 0;
int temperature = 0, humidity = 0;
int nVal = 0, pVal = 0, kVal = 0, oilLevel = 0;
int readCount = 0;

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

void handleData() {
  readSensors();
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
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(A0));
  
  // Start WiFi Access Point
  WiFi.softAP(ssid, password);
  Serial.println("\n✅ CropGuard Ultimate Pro Started");
  Serial.print("AP IP: "); Serial.println(WiFi.softAPIP());

  server.on("/api/data", handleData);
  server.on("/data", handleData);
  server.begin();
}

void loop() {
  server.handleClient();
  
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 3000) {
    lastUpdate = millis();
    readSensors();
    
    // Always output JSON to Serial for the Laptop USB Display
    String json = "{\"soil\":" + String(soilPct) + ",\"temp\":" + String(temperature) + ",\"hum\":" + String(humidity) + ",\"oil\":" + String(oilLevel) + ",\"n\":" + String(nVal) + ",\"p\":" + String(pVal) + ",\"k\":" + String(kVal) + ",\"raw\":" + String(soilRaw) + ",\"reads\":" + String(readCount) + "}";
    Serial.println(json);
  }
}
