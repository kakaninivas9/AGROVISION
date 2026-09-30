#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

/* 
 ╔══════════════════════════════════════════════════════════╗
  ║    AgroVision Unified Firmware (WiFi + API + HTML)      ║
  ║    1. Connect to "SoilMonitor" WiFi                     ║
  ║    2. Human view: http://192.168.4.1/                   ║
  ║    3. Dashboard: Automatic Connection                    ║
  ╚══════════════════════════════════════════════════════════╝
*/

// WiFi Access Point credentials
const char* ssid = "SoilMonitor";
const char* password = "12345678";

ESP8266WebServer server(80);

int sensorPin = A0;
int rawValue = 0;
int soilPct = 0;
int readCount = 0;

void setup() {
  Serial.begin(115200);
  
  // Start Access Point
  WiFi.softAP(ssid, password);
  Serial.println("\n✅ AgroVision AP Started");
  Serial.print("IP Address: ");
  Serial.println(WiFi.softAPIP());

  // --- Handlers ---
  
  // 1. Standalone HTML View (User's original style)
  server.on("/", handleRoot);
  
  // 2. JSON API Endpoint for AgroVision Dashboard
  server.on("/api/data", handleJSON);

  server.begin();
  Serial.println("✅ HTTP Server Ready");
}

void readSensors() {
  rawValue = analogRead(sensorPin);
  
  // Broader Range Calibration: 1023 (Dry) to 200 (Wet)
  // This ensures that even if your sensor is slightly different, it moves!
  soilPct = map(rawValue, 1023, 200, 0, 100);
  soilPct = constrain(soilPct, 0, 100);
  
  readCount++;
}

void handleRoot() {
  readSensors();
  // Standard HTML (User Style)
  String html = "<!DOCTYPE html><html>";
  html += "<head><title>Soil Monitor</title><meta http-equiv='refresh' content='3'>";
  html += "<style>body{font-family:sans-serif;text-align:center;background:#0f172a;color:white;padding-top:50px;}";
  html += ".card{background:#1e293b;padding:30px;border-radius:20px;display:inline-block;border:1px solid #334155;} h2{font-size:3rem;margin:10px 0;}</style></head>";
  html += "<body><h1>🌱 Soil Moisture</h1>";
  html += "<div class='card'><h2>" + String(soilPct) + "%</h2>";
  html += "<p>Raw Value: " + String(rawValue) + "</p>";
  
  if (soilPct < 20) html += "<h3 style='color:#ef4444;'>Dry Soil - Water Needed!</h3>";
  else if (soilPct < 70) html += "<h3 style='color:#f59e0b;'>Moist Soil</h3>";
  else html += "<h3 style='color:#10b981;'>Wet Soil</h3>";
  
  html += "</div><p style='color:#64748b;margin-top:20px;'>AgroVision Unified Firmware v1.1 (CORS Fixed)</p></body></html>";
  server.send(200, "text/html", html);
}

void handleJSON() {
  readSensors();
  // IMPORTANT: Added CORS header so the Web Dashboard can "talk" to the ESP8266
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  String json = "{";
  json += "\"soil\":" + String(soilPct) + ",";
  json += "\"temp\":0,";
  json += "\"hum\":0,";
  json += "\"oil\":0,";
  json += "\"n\":0,\"p\":0,\"k\":0,";
  json += "\"raw\":" + String(rawValue) + ",";
  json += "\"reads\":" + String(readCount);
  json += "}";
  
  server.send(200, "application/json", json);
}

void loop() {
  server.handleClient();
  
  // Optional: Still output to Serial for USB debugging
  static unsigned long lastSerial = 0;
  if (millis() - lastSerial > 5000) {
    lastSerial = millis();
    readSensors();
    Serial.printf("WiFi Running. Soil: %d%% (Raw: %d)\n", soilPct, rawValue);
  }
}
