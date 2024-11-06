#include <WiFi.h>
#include <WebServer.h>
#include <AccelStepper.h>

// WiFi credentials
const char* ssid = "WIFI NETWORK";
const char* password = "WIFI PASSWORD";

// Create a web server on port 80
WebServer server(80);

// Stepper motor setup (A4988)
#define STEP_PIN 11
#define DIR_PIN 10
AccelStepper stepper(AccelStepper::DRIVER, STEP_PIN, DIR_PIN);

// Default speed and acceleration
float defaultMaxSpeed = 500;
float defaultAcceleration = 100;


// Handle requests to set stepper target
void handleStepperControl() {
  if (server.hasArg("steps")) {
    long steps = server.arg("steps").toInt();
    stepper.moveTo(steps);

    // Handle optional speed parameter
    if (server.hasArg("speed")) {
      float speed = server.arg("speed").toFloat();
      stepper.setMaxSpeed(speed);
    }

    // Handle optional acceleration parameter
    if (server.hasArg("acceleration")) {
      float acceleration = server.arg("acceleration").toFloat();
      stepper.setAcceleration(acceleration);
    }

    String response = "Stepper target set to: " + String(steps);
    response += ", Speed: " + String(stepper.maxSpeed());
    response += ", Acceleration: " + String(stepper.acceleration());

    server.send(200, "text/plain", response);
  } else {
    server.send(400, "text/plain", "Missing 'steps' parameter");
  }
}

void setup() {
  // Initialize serial communication
  Serial.begin(115200);

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
  server.on("/stepper", handleStepperControl);

  // Enable CORS for all responses
  server.enableCORS();

  // Start server
  server.begin();

  // Initialize stepper motor
  stepper.setMaxSpeed(defaultMaxSpeed);
  stepper.setAcceleration(defaultAcceleration);
}

void loop() {
  // Handle client requests
  server.handleClient();

  // Run the stepper to the set target
  stepper.run();
}
