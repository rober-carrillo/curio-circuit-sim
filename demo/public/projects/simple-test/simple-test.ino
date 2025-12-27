/**
 * Simple Test Project
 * 
 * Button 1 (pin 2) → LED 1 (pin 9)
 * Button 2 (pin 3) → Buzzer pitch 1 (pin 8)
 * Button 3 (pin 4) → Buzzer pitch 2 (pin 8)
 * Button 4 (pin 5) → Buzzer pitch 3 (pin 8)
 * Button 5 (pin 6) → Buzzer pitch 4 (pin 8)
 */

#define LED_PIN 9
#define BUZZER_PIN 8
#define BUTTON1_PIN 2
#define BUTTON2_PIN 3
#define BUTTON3_PIN 4
#define BUTTON4_PIN 5
#define BUTTON5_PIN 6

// Different pitches for each button
#define PITCH1 262  // C4
#define PITCH2 294  // D4
#define PITCH3 330  // E4
#define PITCH4 392  // G4

void setup() {
  Serial.begin(9600);
  
  // Configure LED as output
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Configure buzzer as output
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Configure buttons as inputs with pull-up resistors
  pinMode(BUTTON1_PIN, INPUT_PULLUP);
  pinMode(BUTTON2_PIN, INPUT_PULLUP);
  pinMode(BUTTON3_PIN, INPUT_PULLUP);
  pinMode(BUTTON4_PIN, INPUT_PULLUP);
  pinMode(BUTTON5_PIN, INPUT_PULLUP);
  
  Serial.println("Simple test started!");
  Serial.println("Button 1: LED");
  Serial.println("Button 2-5: Buzzer pitches");
}

void loop() {
  // Button 1: Control LED
  if (digitalRead(BUTTON1_PIN) == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("LED ON");
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  
  // Check which buzzer button is pressed
  bool anyBuzzerButtonPressed = false;
  
  // Button 2: Buzzer pitch 1
  if (digitalRead(BUTTON2_PIN) == LOW) {
    tone(BUZZER_PIN, PITCH1);
    Serial.println("Buzzer: C4");
    anyBuzzerButtonPressed = true;
  }
  // Button 3: Buzzer pitch 2
  else if (digitalRead(BUTTON3_PIN) == LOW) {
    tone(BUZZER_PIN, PITCH2);
    Serial.println("Buzzer: D4");
    anyBuzzerButtonPressed = true;
  }
  // Button 4: Buzzer pitch 3
  else if (digitalRead(BUTTON4_PIN) == LOW) {
    tone(BUZZER_PIN, PITCH3);
    Serial.println("Buzzer: E4");
    anyBuzzerButtonPressed = true;
  }
  // Button 5: Buzzer pitch 4
  else if (digitalRead(BUTTON5_PIN) == LOW) {
    tone(BUZZER_PIN, PITCH4);
    Serial.println("Buzzer: G4");
    anyBuzzerButtonPressed = true;
  }
  // No buzzer button pressed - stop tone
  else {
    noTone(BUZZER_PIN);
  }
  
  // Small delay to prevent bouncing
  delay(10);
}

