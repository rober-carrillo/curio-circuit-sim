// SPDX-License-Identifier: MIT
// Copyright (c) Uri Shaked and contributors

import '@wokwi/elements';
import { LEDElement, PushbuttonElement, BuzzerElement, SevenSegmentElement } from '@wokwi/elements';
import { PinState } from 'avr8js';
import { buildHex } from './compile';
import { CPUPerformance } from './cpu-performance';
import { AVRRunner } from './execute';
import { formatTime } from './format-time';
import './index.css';

let editor: any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Load Simon game code
const SIMON_CODE = `#include "pitches.h"

/* Constants - define pin numbers for LEDs,
   buttons and speaker, and also the game tones: */
const uint8_t ledPins[] = {9, 10, 11, 12};
const uint8_t buttonPins[] = {2, 3, 4, 5};
#define SPEAKER_PIN 8

// These are connected to 74HC595 shift register (used to show game score):
const int LATCH_PIN = A1;  // 74HC595 pin 12
const int DATA_PIN = A0;  // 74HC595pin 14
const int CLOCK_PIN = A2;  // 74HC595 pin 11

#define MAX_GAME_LENGTH 100

const int gameTones[] = { NOTE_G3, NOTE_C4, NOTE_E4, NOTE_G5};

/* Global variables - store the game state */
uint8_t gameSequence[MAX_GAME_LENGTH] = {0};
uint8_t gameIndex = 0;

/**
   Set up the Arduino board and initialize Serial communication
*/
void setup() {
  Serial.begin(9600);
  for (byte i = 0; i < 4; i++) {
    pinMode(ledPins[i], OUTPUT);
    pinMode(buttonPins[i], INPUT_PULLUP);
  }
  pinMode(SPEAKER_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(DATA_PIN, OUTPUT);

  // The following line primes the random number generator.
  // It assumes pin A3 is floating (disconnected):
  randomSeed(analogRead(A3));
}

/* Digit table for the 7-segment display */
const uint8_t digitTable[] = {
  0b11000000,
  0b11111001,
  0b10100100,
  0b10110000,
  0b10011001,
  0b10010010,
  0b10000010,
  0b11111000,
  0b10000000,
  0b10010000,
};
const uint8_t DASH = 0b10111111;

void sendScore(uint8_t high, uint8_t low) {
  digitalWrite(LATCH_PIN, LOW);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, low);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, high);
  digitalWrite(LATCH_PIN, HIGH);
}

void displayScore() {
  int high = gameIndex % 100 / 10;
  int low = gameIndex % 10;
  sendScore(high ? digitTable[high] : 0xff, digitTable[low]);
}

/**
   Lights the given LED and plays a suitable tone
*/
void lightLedAndPlayTone(byte ledIndex) {
  digitalWrite(ledPins[ledIndex], HIGH);
  tone(SPEAKER_PIN, gameTones[ledIndex]);
  delay(300);
  digitalWrite(ledPins[ledIndex], LOW);
  noTone(SPEAKER_PIN);
}

/**
   Plays the current sequence of notes that the user has to repeat
*/
void playSequence() {
  for (int i = 0; i < gameIndex; i++) {
    byte currentLed = gameSequence[i];
    lightLedAndPlayTone(currentLed);
    delay(50);
  }
}

/**
    Waits until the user pressed one of the buttons,
    and returns the index of that button
*/
byte readButtons() {
  while (true) {
    for (byte i = 0; i < 4; i++) {
      byte buttonPin = buttonPins[i];
      if (digitalRead(buttonPin) == LOW) {
        return i;
      }
    }
    delay(1);
  }
}

/**
  Play the game over sequence, and report the game score
*/
void gameOver() {
  Serial.print("Game over! your score: ");
  Serial.println(gameIndex - 1);
  gameIndex = 0;
  delay(200);

  // Play a Wah-Wah-Wah-Wah sound
  tone(SPEAKER_PIN, NOTE_DS5);
  delay(300);
  tone(SPEAKER_PIN, NOTE_D5);
  delay(300);
  tone(SPEAKER_PIN, NOTE_CS5);
  delay(300);
  for (byte i = 0; i < 10; i++) {
    for (int pitch = -10; pitch <= 10; pitch++) {
      tone(SPEAKER_PIN, NOTE_C5 + pitch);
      delay(5);
    }
  }
  noTone(SPEAKER_PIN);

  sendScore(DASH, DASH);
  delay(500);
}

/**
   Get the user's input and compare it with the expected sequence.
*/
bool checkUserSequence() {
  for (int i = 0; i < gameIndex; i++) {
    byte expectedButton = gameSequence[i];
    byte actualButton = readButtons();
    lightLedAndPlayTone(actualButton);
    if (expectedButton != actualButton) {
      return false;
    }
  }

  return true;
}

/**
   Plays a hooray sound whenever the user finishes a level
*/
void playLevelUpSound() {
  tone(SPEAKER_PIN, NOTE_E4);
  delay(150);
  tone(SPEAKER_PIN, NOTE_G4);
  delay(150);
  tone(SPEAKER_PIN, NOTE_E5);
  delay(150);
  tone(SPEAKER_PIN, NOTE_C5);
  delay(150);
  tone(SPEAKER_PIN, NOTE_D5);
  delay(150);
  tone(SPEAKER_PIN, NOTE_G5);
  delay(150);
  noTone(SPEAKER_PIN);
}

/**
   The main game loop
*/
void loop() {
  displayScore();

  // Add a random color to the end of the sequence
  gameSequence[gameIndex] = random(0, 4);
  gameIndex++;
  if (gameIndex >= MAX_GAME_LENGTH) {
    gameIndex = MAX_GAME_LENGTH - 1;
  }

  playSequence();
  if (!checkUserSequence()) {
    gameOver();
  }

  delay(300);

  if (gameIndex > 0) {
    playLevelUpSound();
    delay(300);
  }
}`;

// Include pitches.h content inline
const PITCHES_H = `#define NOTE_B0  31
#define NOTE_C1  33
#define NOTE_CS1 35
#define NOTE_D1  37
#define NOTE_DS1 39
#define NOTE_E1  41
#define NOTE_F1  44
#define NOTE_FS1 46
#define NOTE_G1  49
#define NOTE_GS1 52
#define NOTE_A1  55
#define NOTE_AS1 58
#define NOTE_B1  62
#define NOTE_C2  65
#define NOTE_CS2 69
#define NOTE_D2  73
#define NOTE_DS2 78
#define NOTE_E2  82
#define NOTE_F2  87
#define NOTE_FS2 93
#define NOTE_G2  98
#define NOTE_GS2 104
#define NOTE_A2  110
#define NOTE_AS2 117
#define NOTE_B2  123
#define NOTE_C3  131
#define NOTE_CS3 139
#define NOTE_D3  147
#define NOTE_DS3 156
#define NOTE_E3  165
#define NOTE_F3  175
#define NOTE_FS3 185
#define NOTE_G3  196
#define NOTE_GS3 208
#define NOTE_A3  220
#define NOTE_AS3 233
#define NOTE_B3  247
#define NOTE_C4  262
#define NOTE_CS4 277
#define NOTE_D4  294
#define NOTE_DS4 311
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_FS4 370
#define NOTE_G4  392
#define NOTE_GS4 415
#define NOTE_A4  440
#define NOTE_AS4 466
#define NOTE_B4  494
#define NOTE_C5  523
#define NOTE_CS5 554
#define NOTE_D5  587
#define NOTE_DS5 622
#define NOTE_E5  659
#define NOTE_F5  698
#define NOTE_FS5 740
#define NOTE_G5  784
#define NOTE_GS5 831
#define NOTE_A5  880
#define NOTE_AS5 932
#define NOTE_B5  988
#define NOTE_C6  1047
#define NOTE_CS6 1109
#define NOTE_D6  1175
#define NOTE_DS6 1245
#define NOTE_E6  1319
#define NOTE_F6  1397
#define NOTE_FS6 1480
#define NOTE_G6  1568
#define NOTE_GS6 1661
#define NOTE_A6  1760
#define NOTE_AS6 1865
#define NOTE_B6  1976
#define NOTE_C7  2093
#define NOTE_CS7 2217
#define NOTE_D7  2349
#define NOTE_DS7 2489
#define NOTE_E7  2637
#define NOTE_F7  2794
#define NOTE_FS7 2960
#define NOTE_G7  3136
#define NOTE_GS7 3322
#define NOTE_A7  3520
#define NOTE_AS7 3729
#define NOTE_B7  3951
#define NOTE_C8  4186
#define NOTE_CS8 4435
#define NOTE_D8  4699
#define NOTE_DS8 4978`;

// Combine code with pitches.h
const FULL_SIMON_CODE = SIMON_CODE.replace('#include "pitches.h"', PITCHES_H);

// Load Editor
declare const window: any; // eslint-disable-line @typescript-eslint/no-explicit-any
declare const monaco: any; // eslint-disable-line @typescript-eslint/no-explicit-any
window.require.config({
  paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' },
});
window.require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create(document.querySelector('.code-editor'), {
    value: FULL_SIMON_CODE,
    language: 'cpp',
    minimap: { enabled: false },
  });
});

// Get component references
const ledRed = document.querySelector<LEDElement>('#led-red');
const ledGreen = document.querySelector<LEDElement>('#led-green');
const ledBlue = document.querySelector<LEDElement>('#led-blue');
const ledYellow = document.querySelector<LEDElement>('#led-yellow');

const btnRed = document.querySelector<PushbuttonElement>('#btn-red');
const btnGreen = document.querySelector<PushbuttonElement>('#btn-green');
const btnBlue = document.querySelector<PushbuttonElement>('#btn-blue');
const btnYellow = document.querySelector<PushbuttonElement>('#btn-yellow');

const buzzer = document.querySelector<BuzzerElement>('#buzzer');
const displayTens = document.querySelector<SevenSegmentElement>('#display-tens');
const displayOnes = document.querySelector<SevenSegmentElement>('#display-ones');

// Set up toolbar
let runner: AVRRunner;
let shiftRegisterData: number[] = [0, 0]; // [high, low] bytes for 7-segment displays

const runButton = document.querySelector('#run-button');
runButton.addEventListener('click', compileAndRun);
const stopButton = document.querySelector('#stop-button');
stopButton.addEventListener('click', stopCode);
const loadSimonButton = document.querySelector('#load-simon-button');
loadSimonButton.addEventListener('click', loadSimonCode);
const statusLabel = document.querySelector('#status-label');
const compilerOutputText = document.querySelector('#compiler-output-text');
const serialOutputText = document.querySelector('#serial-output-text');

// Map button pins to indices: Pin 2=Yellow(0), Pin 3=Blue(1), Pin 4=Green(2), Pin 5=Red(3)
const buttonPinMap: { [key: number]: PushbuttonElement } = {
  2: btnYellow,
  3: btnBlue,
  4: btnGreen,
  5: btnRed,
};

// Map LED pins to elements: Pin 9=Yellow(0), Pin 10=Blue(1), Pin 11=Green(2), Pin 12=Red(3)
const ledPinMap: { [key: number]: LEDElement } = {
  9: ledYellow,
  10: ledBlue,
  11: ledGreen,
  12: ledRed,
};

// Handle button presses - simulate pull-up resistors (LOW when pressed)
function setupButtonListeners() {
  [btnRed, btnGreen, btnBlue, btnYellow].forEach((btn, index) => {
    btn.addEventListener('button-press', () => {
      const pin = [2, 3, 4, 5][index]; // Yellow=2, Blue=3, Green=4, Red=5
      if (runner && runner.portD) {
        // Simulate button press by setting pin LOW
        runner.portD.setPin(pin, false);
        // Release after a short delay
        setTimeout(() => {
          if (runner && runner.portD) {
            runner.portD.setPin(pin, true);
          }
        }, 50);
      }
    });
  });
}

// Simulate 74HC595 shift register for 7-segment displays
function updateShiftRegister() {
  if (shiftRegisterData.length >= 2) {
    const low = shiftRegisterData[0];
    const high = shiftRegisterData[1];
    
    // Decode 7-segment patterns
    const digitTable: { [key: number]: number } = {
      0b11000000: 0, 0b11111001: 1, 0b10100100: 2, 0b10110000: 3,
      0b10011001: 4, 0b10010010: 5, 0b10000010: 6, 0b11111000: 7,
      0b10000000: 8, 0b10010000: 9, 0b10111111: -1, // dash
    };
    
    const tensDigit = digitTable[high] ?? -1;
    const onesDigit = digitTable[low] ?? -1;
    
    if (displayTens && displayOnes) {
      displayTens.value = tensDigit >= 0 ? tensDigit : null;
      displayOnes.value = onesDigit >= 0 ? onesDigit : null;
    }
  }
}

function executeProgram(hex: string) {
  runner = new AVRRunner(hex);
  const MHZ = 16000000;

  // Hook to PORTB register for LEDs (pins 9-12)
  runner.portB.addListener(() => {
    // Pin 9 = PB1, Pin 10 = PB2, Pin 11 = PB3, Pin 12 = PB4
    if (ledYellow) ledYellow.value = runner.portB.pinState(1) === PinState.High;
    if (ledBlue) ledBlue.value = runner.portB.pinState(2) === PinState.High;
    if (ledGreen) ledGreen.value = runner.portB.pinState(3) === PinState.High;
    if (ledRed) ledRed.value = runner.portB.pinState(4) === PinState.High;
  });

  // Hook to PORTD for buttons (pins 2-5)
  runner.portD.addListener(() => {
    // Buttons are handled via event listeners, but we can read state here if needed
  });

  // Hook to PORTC for shift register (A0, A1, A2)
  let shiftData: number[] = [];
  let shiftClock = false;
  let shiftLatch = false;
  
  runner.portC.addListener(() => {
    const dataPin = runner.portC.pinState(0); // A0 = PC0
    const clockPin = runner.portC.pinState(2) === PinState.High; // A2 = PC2
    const latchPin = runner.portC.pinState(1) === PinState.High; // A1 = PC1
    
    // Detect clock rising edge
    if (clockPin && !shiftClock) {
      // Shift in data bit
      shiftData.push(dataPin === PinState.High ? 1 : 0);
      if (shiftData.length > 16) shiftData.shift(); // Keep last 16 bits
    }
    shiftClock = clockPin;
    
    // Detect latch rising edge
    if (latchPin && !shiftLatch && shiftData.length >= 16) {
      // Extract two bytes (low byte first, then high byte)
      const lowByte = parseInt(shiftData.slice(0, 8).reverse().join(''), 2);
      const highByte = parseInt(shiftData.slice(8, 16).reverse().join(''), 2);
      shiftRegisterData = [lowByte, highByte];
      updateShiftRegister();
    }
    shiftLatch = latchPin;
  });

  // Hook to timer for buzzer (pin 8 = PB0)
  let lastBuzzerState = false;
  runner.portB.addListener(() => {
    const buzzerPin = runner.portB.pinState(0) === PinState.High; // Pin 8 = PB0
    if (buzzer && buzzerPin !== lastBuzzerState) {
      // Note: Actual tone frequency would need timer capture, but we can at least show on/off
      buzzer.startTone(buzzerPin ? 440 : 0);
    }
    lastBuzzerState = buzzerPin;
  });

  // Serial output
  runner.usart.onByteTransmit = (value) => {
    serialOutputText.textContent += String.fromCharCode(value);
  };

  // Setup button listeners
  setupButtonListeners();

  const cpuPerf = new CPUPerformance(runner.cpu, MHZ);
  runner.execute((cpu) => {
    const time = formatTime(cpu.cycles / MHZ);
    const speed = (cpuPerf.update() * 100).toFixed(0);
    statusLabel.textContent = `Simulation time: ${time} (${speed}%)`;
  });
}

async function compileAndRun() {
  // Reset all components
  if (ledRed) ledRed.value = false;
  if (ledGreen) ledGreen.value = false;
  if (ledBlue) ledBlue.value = false;
  if (ledYellow) ledYellow.value = false;
  if (buzzer) buzzer.stopTone();
  if (displayTens) displayTens.value = null;
  if (displayOnes) displayOnes.value = null;

  runButton.setAttribute('disabled', '1');
  loadSimonButton.setAttribute('disabled', '1');

  serialOutputText.textContent = '';
  try {
    statusLabel.textContent = 'Compiling...';
    const code = editor.getModel().getValue();
    const result = await buildHex(code);
    compilerOutputText.textContent = result.stderr || result.stdout;
    if (result.hex) {
      compilerOutputText.textContent += '\nProgram running...';
      stopButton.removeAttribute('disabled');
      executeProgram(result.hex);
    } else {
      runButton.removeAttribute('disabled');
    }
  } catch (err) {
    runButton.removeAttribute('disabled');
    loadSimonButton.removeAttribute('disabled');
    alert('Failed: ' + err);
  } finally {
    statusLabel.textContent = '';
  }
}

function stopCode() {
  stopButton.setAttribute('disabled', '1');
  runButton.removeAttribute('disabled');
  loadSimonButton.removeAttribute('disabled');
  if (runner) {
    runner.stop();
    runner = null;
  }
  if (buzzer) buzzer.stopTone();
}

function loadSimonCode() {
  editor.setValue(FULL_SIMON_CODE);
}


