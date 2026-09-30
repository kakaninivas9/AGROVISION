/*
 ============================================================================
  CropGuard Pro — IoT Smart Farming Firmware
  Hardware  : NodeMCU ESP8266
  Platform  : Arduino IDE
 ============================================================================
  Sensors   : DHT22, Soil Moisture, NPK (RS-485/UART), LDR, Rain
  Actuator  : 5V Relay → Mini Water Pump
  Display   : 16×2 LCD (I2C, address 0x27)
  Cloud     : ThingSpeak MQTT / HTTP
 ============================================================================
  Pin Map (NodeMCU GPIO):
    DHT22           → D4  (GPIO2)
    Soil Moisture   → A0  (ADC)
    NPK Sensor TX   → D5  (GPIO14)  [NodeMCU RX from NPK]
    NPK Sensor RX   → D6  (GPIO12)  [NodeMCU TX to NPK]
    LDR             → D7  (GPIO13)
    Rain Sensor     → D8  (GPIO15)
    Relay           → D3  (GPIO0)
    LCD SDA         → D2  (GPIO4)
    LCD SCL         → D1  (GPIO5)
 ============================================================================
  Libraries required (install via Arduino Library Manager):
    - DHT sensor library  (Adafruit)
    - LiquidCrystal_I2C   (Frank de Brabander)
    - ESP8266WiFi         (included with ESP8266 board package)
    - ThingSpeak          (MathWorks)
    - SoftwareSerial      (included with Arduino IDE)
 ============================================================================
*/

// ── LIBRARY INCLUDES ────────────────────────────────────────────────────────
#include <ESP8266WiFi.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include "ThingSpeak.h"

// ── WiFi CREDENTIALS ─────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";       // ← Replace with your SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";    // ← Replace with your password

// ── ThingSpeak CONFIGURATION ─────────────────────────────────────────────────
unsigned long TS_CHANNEL_ID  = 3315477;                    // ← Updated from .env
const char*   TS_WRITE_API   = "OUUL9USNVBMWNR28"; // ← Updated from .env
/*
  ThingSpeak field mapping:
    Field 1 → Temperature (°C)
    Field 2 → Humidity (%)
    Field 3 → Soil Moisture (%)
    Field 4 → NPK – Nitrogen (mg/kg)
    Field 5 → NPK – Phosphorus (mg/kg)
    Field 6 → NPK – Potassium (mg/kg)
    Field 7 → Light Level (0–1023)
    Field 8 → Rain Detected (1 = yes, 0 = no)
*/

// ── PIN DEFINITIONS ──────────────────────────────────────────────────────────
#define DHT_PIN         D4     // DHT22 data pin
#define DHT_TYPE        DHT22  // Sensor type
#define SOIL_PIN        A0     // Analog soil moisture
#define LDR_PIN         D7     // Digital LDR output
#define RAIN_PIN        D8     // Digital rain sensor output
#define RELAY_PIN       D3     // Relay control (LOW = ON for active-low relay)

// NPK sensor communicates over UART via SoftwareSerial
#define NPK_RX_PIN      D5     // NodeMCU receives from NPK TX
#define NPK_TX_PIN      D6     // NodeMCU sends to NPK RX

// ── THRESHOLDS ────────────────────────────────────────────────────────────────
#define SOIL_DRY_THRESHOLD  30   // Soil moisture % below which soil is "dry"
#define PUMP_ON_DURATION_MS 5000 // How long pump runs per irrigation cycle (ms)
#define READ_INTERVAL_MS    30000 // Sensor read + cloud update interval (30 sec)

// ── OBJECT INSTANTIATION ─────────────────────────────────────────────────────
DHT              dht(DHT_PIN, DHT_TYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);           // I2C address 0x27, 16 cols, 2 rows
SoftwareSerial   npkSerial(NPK_RX_PIN, NPK_TX_PIN); // RX, TX
WiFiClient       wifiClient;

// ── NPK MODBUS RTU REQUEST FRAME (for RS-485 NPK sensors) ───────────────────
/*
  Standard Modbus RTU request to read NPK registers simultaneously.
  Address: 0x01, Function: 0x03 (Read Holding Registers),
  Start Reg: 0x001E (Nitrogen), Quantity: 3 registers (N, P, K)
*/
const byte NPK_REQUEST[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────
unsigned long lastReadTime = 0;
bool          pumpRunning  = false;

// ── SENSOR DATA STRUCT ────────────────────────────────────────────────────────
struct SensorData {
    float temperature;   // °C
    float humidity;      // %
    int   soilMoisture;  // 0–100 %
    int   nitrogen;      // mg/kg
    int   phosphorus;    // mg/kg
    int   potassium;     // mg/kg
    int   lightLevel;    // ADC 0–1023 (inverted: high = dark)
    bool  rainDetected;  // true = raining
};

SensorData sensorData;

// ═══════════════════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(200);
    Serial.println("\n[CropGuard Pro] Booting…");

    // ── GPIO Init ──
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(LDR_PIN,   INPUT);
    pinMode(RAIN_PIN,  INPUT);
    digitalWrite(RELAY_PIN, HIGH); // HIGH = pump OFF (active-low relay)

    // ── DHT Init ──
    dht.begin();

    // ── NPK UART Init ──
    npkSerial.begin(9600);

    // ── LCD Init ──
    Wire.begin(D2, D1);   // SDA, SCL
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("CropGuard Pro");
    lcd.setCursor(0, 1);
    lcd.print("  Initializing…");
    delay(2000);
    lcd.clear();

    // ── WiFi Connect ──
    connectToWiFi();

    // ── ThingSpeak Init ──
    ThingSpeak.begin(wifiClient);

    Serial.println("[CropGuard Pro] Setup complete.");
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════
void loop() {
    unsigned long now = millis();

    // Re-connect WiFi if dropped
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Connection lost – reconnecting…");
        connectToWiFi();
    }

    // ── Read sensors and update cloud every READ_INTERVAL_MS ──
    if (now - lastReadTime >= READ_INTERVAL_MS || lastReadTime == 0) {
        lastReadTime = now;

        readDHT22();
        readSoilMoisture();
        readNPK();
        readLDR();
        readRainSensor();

        printToSerial();
        updateLCD();
        uploadToThingSpeak();
        controlIrrigation();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  WIFI CONNECTION
// ═══════════════════════════════════════════════════════════════════════════
void connectToWiFi() {
    Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    lcd.setCursor(0, 0);
    lcd.print("Connecting WiFi ");

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 60) {  // 60×500ms = 30s timeout
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("\n[WiFi] Connected! IP: ");
        Serial.println(WiFi.localIP());
        lcd.setCursor(0, 1);
        lcd.print("WiFi OK!        ");
        delay(1500);
        lcd.clear();
    } else {
        Serial.println("\n[WiFi] Connection FAILED – continuing offline.");
        lcd.setCursor(0, 1);
        lcd.print("WiFi FAILED!    ");
        delay(1500);
        lcd.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SENSOR READERS
// ═══════════════════════════════════════════════════════════════════════════

// ── DHT22: Temperature & Humidity ──
void readDHT22() {
    sensorData.humidity    = dht.readHumidity();
    sensorData.temperature = dht.readTemperature();

    if (isnan(sensorData.humidity) || isnan(sensorData.temperature)) {
        Serial.println("[DHT22] Read FAILED – using last good values.");
        // Values remain unchanged from previous read (safe fallback)
    }
}

// ── Soil Moisture Sensor ──
void readSoilMoisture() {
    /*
      Typical capacitive soil sensor output:
        ~1023 = completely dry,   ~300 = completely wet
      We map this to 0–100% moisture (inverted).
      Adjust the min/max values to match your specific sensor.
    */
    int rawValue = analogRead(SOIL_PIN);
    sensorData.soilMoisture = map(rawValue, 1023, 300, 0, 100);
    sensorData.soilMoisture = constrain(sensorData.soilMoisture, 0, 100);
}

// ── NPK Sensor (RS-485 Modbus RTU) ──
void readNPK() {
    // Flush the incoming buffer
    while (npkSerial.available()) npkSerial.read();

    // Send request frame
    for (byte b : NPK_REQUEST) npkSerial.write(b);
    delay(200); // Allow sensor to respond

    byte response[11] = {0};
    int  bytesRead    = 0;

    unsigned long timeout = millis() + 500;
    while (millis() < timeout && bytesRead < 11) {
        if (npkSerial.available()) {
            response[bytesRead++] = npkSerial.read();
        }
    }

    /*
      Expected response structure (11 bytes):
        [0]  = Device address (0x01)
        [1]  = Function code (0x03)
        [2]  = Byte count (0x06 = 6 data bytes)
        [3][4]  = Nitrogen  (High, Low byte)
        [5][6]  = Phosphorus(High, Low byte)
        [7][8]  = Potassium (High, Low byte)
        [9][10] = CRC (not validated here for simplicity)
    */
    // Validate: must have full 11-byte response and correct function code
    if (bytesRead >= 11 && response[1] == 0x03 && response[2] == 0x06) {
        sensorData.nitrogen   = (response[3] << 8) | response[4];
        sensorData.phosphorus = (response[5] << 8) | response[6];
        sensorData.potassium  = (response[7] << 8) | response[8];
    } else {
        Serial.printf("[NPK] Invalid response: %d bytes received (expected 11).\n", bytesRead);
    }
}

// ── LDR Light Sensor ──
void readLDR() {
    /*
      LDR connected to D7 (digital mode).
      LOW  = light detected (LDR resistance low → voltage divider pulls LOW)
      HIGH = dark
    */
    sensorData.lightLevel = digitalRead(LDR_PIN);
    // 0 = Bright, 1 = Dark
}

// ── Rain Sensor ──
void readRainSensor() {
    /*
      Rain sensor digital output:
        LOW  = Rain detected   (conductive, pulls pin LOW)
        HIGH = No rain (dry)
    */
    sensorData.rainDetected = (digitalRead(RAIN_PIN) == LOW);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DISPLAY & DEBUG OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

void printToSerial() {
    Serial.println("\n══════ CropGuard Pro Sensor Readings ══════");
    Serial.printf("  Temperature   : %.1f °C\n",   sensorData.temperature);
    Serial.printf("  Humidity      : %.1f %%\n",   sensorData.humidity);
    Serial.printf("  Soil Moisture : %d %%\n",     sensorData.soilMoisture);
    Serial.printf("  Nitrogen (N)  : %d mg/kg\n",  sensorData.nitrogen);
    Serial.printf("  Phosphorus(P) : %d mg/kg\n",  sensorData.phosphorus);
    Serial.printf("  Potassium (K) : %d mg/kg\n",  sensorData.potassium);
    Serial.printf("  Light Level   : %s\n",         sensorData.lightLevel == 0 ? "Bright" : "Dark");
    Serial.printf("  Rain Detected : %s\n",         sensorData.rainDetected ? "YES" : "NO");
    Serial.println("═══════════════════════════════════════════");

    // ── JSON Output (for USB Dashboard Sync) ──
    Serial.printf("{\"soil\":%d,\"temp\":%.1f,\"hum\":%.1f,\"oil\":%d,\"n\":%d,\"p\":%d,\"k\":%d,\"rain\":%d}\n",
                  sensorData.soilMoisture, sensorData.temperature, sensorData.humidity, 
                  sensorData.lightLevel, sensorData.nitrogen, sensorData.phosphorus, 
                  sensorData.potassium, sensorData.rainDetected ? 1 : 0);

    // ── Low Soil Moisture Alert ──
    if (sensorData.soilMoisture < SOIL_DRY_THRESHOLD) {
        Serial.println("  ⚠  ALERT: Soil moisture too low – irrigation triggered!");
    }
}

void updateLCD() {
    // ── Page 1: Temperature & Humidity ──
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.printf("T:%.1fC H:%.0f%%", sensorData.temperature, sensorData.humidity);
    lcd.setCursor(0, 1);
    lcd.printf("Soil:%d%% %s", sensorData.soilMoisture,
               sensorData.rainDetected ? "Rain" : "No Rain");
    delay(3000);

    // ── Page 2: NPK Values ──
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.printf("N:%d P:%d", sensorData.nitrogen, sensorData.phosphorus);
    lcd.setCursor(0, 1);
    lcd.printf("K:%d mg/kg", sensorData.potassium);
    delay(3000);

    // ── Page 3: Pump Status ──
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Pump Status:");
    lcd.setCursor(0, 1);
    lcd.print(pumpRunning ? "  ON - Watering " : "  OFF - OK      ");
    delay(2000);
}

// ═══════════════════════════════════════════════════════════════════════════
//  IRRIGATION CONTROL
// ═══════════════════════════════════════════════════════════════════════════
void controlIrrigation() {
    bool soilDry     = (sensorData.soilMoisture < SOIL_DRY_THRESHOLD);
    bool noRain      = !sensorData.rainDetected;

    if (soilDry && noRain) {
        // ── Conditions met: Turn ON pump ──
        Serial.println("[Pump] Turning ON (soil dry, no rain)");
        digitalWrite(RELAY_PIN, LOW);   // Active-low: LOW = ON
        pumpRunning = true;
        delay(PUMP_ON_DURATION_MS);
        digitalWrite(RELAY_PIN, HIGH);  // Turn OFF after duration
        pumpRunning = false;
        Serial.println("[Pump] Turned OFF after irrigation cycle");
    } else {
        // ── Conditions not met: Ensure pump is OFF ──
        digitalWrite(RELAY_PIN, HIGH);
        pumpRunning = false;
        Serial.printf("[Pump] OFF (Soil: %d%%, Rain: %s)\n",
                      sensorData.soilMoisture,
                      sensorData.rainDetected ? "YES" : "NO");
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  THINGSPEAK UPLOAD
// ═══════════════════════════════════════════════════════════════════════════
void uploadToThingSpeak() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[ThingSpeak] Skipping upload – no WiFi.");
        return;
    }

    ThingSpeak.setField(1, sensorData.temperature);
    ThingSpeak.setField(2, sensorData.humidity);
    ThingSpeak.setField(3, (float)sensorData.soilMoisture);
    ThingSpeak.setField(4, (float)sensorData.nitrogen);
    ThingSpeak.setField(5, (float)sensorData.phosphorus);
    ThingSpeak.setField(6, (float)sensorData.potassium);
    ThingSpeak.setField(7, (float)sensorData.lightLevel);
    ThingSpeak.setField(8, sensorData.rainDetected ? 1.0f : 0.0f);

    // Add status message if soil is dry
    if (sensorData.soilMoisture < SOIL_DRY_THRESHOLD) {
        ThingSpeak.setStatus("ALERT: Soil moisture critical – irrigation triggered");
    } else {
        ThingSpeak.setStatus("Normal");
    }

    int result = ThingSpeak.writeFields(TS_CHANNEL_ID, TS_WRITE_API);
    if (result == 200) {
        Serial.println("[ThingSpeak] Data uploaded successfully.");
    } else {
        Serial.printf("[ThingSpeak] Upload failed. HTTP code: %d\n", result);
    }
}
