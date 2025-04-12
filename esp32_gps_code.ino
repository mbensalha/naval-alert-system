#include <WiFi.h>
#include <PubSubClient.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// WiFi
const char* ssid = "MBS";
const char* password = "Mohamed01";

// MQTT Broker EMQX
const char* mqtt_server = "broker.emqx.io";

// Déclaration MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// GPS
TinyGPSPlus gps;
HardwareSerial gpsSerial(1); // UART1 (GPIO16 RX, GPIO17 TX)

// Fonction de conversion km/h en nœuds
float kmphToKnots(float kmph) {
  return kmph * 0.539957; // Facteur de conversion
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      // Subscribe
      client.subscribe("esp32/test");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17); // RX, TX
  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  if (gps.location.isUpdated()) {
    float lat = gps.location.lat();
    float lon = gps.location.lng();
    float speedKmph = gps.speed.kmph(); // km/h
    float speedKnots = kmphToKnots(speedKmph); // Conversion en nœuds

    // Date et heure GPS
    String date = "";
    String time = "";

    if (gps.date.isValid()) {
      date = String(gps.date.year()) + "-";
      date += (gps.date.month() < 10 ? "0" : "") + String(gps.date.month()) + "-";
      date += (gps.date.day() < 10 ? "0" : "") + String(gps.date.day());
    }

    if (gps.time.isValid()) {
      time = (gps.time.hour() < 10 ? "0" : "") + String(gps.time.hour()) + ":";
      time += (gps.time.minute() < 10 ? "0" : "") + String(gps.time.minute()) + ":";
      time += (gps.time.second() < 10 ? "0" : "") + String(gps.time.second());
    }

    Serial.printf("📍 Lat: %.6f, Lon: %.6f, 🚗 Speed: %.2f km/h (%.2f nœuds)\n", lat, lon, speedKmph, speedKnots);

    String payload = "{";
    payload += "\"lat\":" + String(lat, 6) + ",";
    payload += "\"lng\":" + String(lon, 6) + ",";
    payload += "\"speed_kmh\":" + String(speedKmph, 2) + ",";
    payload += "\"speed_knots\":" + String(speedKnots, 2) + ",";
    payload += "\"date\":\"" + date + "\",";
    payload += "\"time\":\"" + time + "\"}";
    
    client.publish("esp32/gps", payload.c_str());
    delay(2000);
  }
}
