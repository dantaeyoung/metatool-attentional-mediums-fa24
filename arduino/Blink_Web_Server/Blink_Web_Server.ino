/*
 * 
 * After the web server is running, try going to:
 * 
 * http://<IP_ADDRESS>/LED?state=off
 * http://<IP_ADDRESS>/LED?state=on
 * 
 */

#include <WiFi.h>
#include <WebServer.h>

// WiFi credentials
const char* ssid = "Columbia University";
const char* password = "";

// Create a web server on port 80
WebServer server(80);

// Handle requests to set LED state
void handleLEDControl() {
  // Check if "state" parameter is present in the request
  if (server.hasArg("state")) {
    String state = server.arg("state");

    if (state == "on") {
      digitalWrite(LED_BUILTIN, HIGH); // Turn LED on
      server.send(200, "text/plain", "LED is ON");
    } else if (state == "off") {
      digitalWrite(LED_BUILTIN, LOW); // Turn LED off
      server.send(200, "text/plain", "LED is OFF");
    } else {
      server.send(400, "text/plain", "Invalid state. Use 'on' or 'off'");
    }
  } else {
    server.send(400, "text/plain", "Missing 'state' parameter. Use /LED?state=on or /LED?state=off");
  }
}

void setupServer() {
  // Initialize WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  // Configure web server routes
  server.on("/LED", handleLEDControl);

  // Start server
  server.begin();
  Serial.println("HTTP server started");
}

// the setup function runs once when you press reset or power the board
void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  
  setupServer();
  
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  // Handle client requests
  server.handleClient();
}
