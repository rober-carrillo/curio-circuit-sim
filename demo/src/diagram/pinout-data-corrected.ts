// SPDX-License-Identifier: MIT
// CORRECTED pinout data with proper SVG viewBox coordinates
// Extracted from actual SVG rendering in wokwi-elements-source

export interface PinPosition {
  x: number; // SVG viewBox coordinate
  y: number; // SVG viewBox coordinate
}

export interface ComponentPinout {
  viewBox: string; // SVG viewBox
  pins: Record<string, PinPosition>;
}

/**
 * Arduino Uno pin layout (from arduino-uno-element.ts SVG):
 * - Top-left header (10 pins): x=17.497, y=1.27 (A5, A4, AREF, GND, 13-8)
 * - Top-right header (8 pins): x=44.421, y=1.27 (7-0)
 * - Bottom-left header (8 pins): x=26.641, y=49.53 (IOREF, RESET, 3.3V, 5V, GND, GND, VIN, blank)
 * - Bottom-right header (6 pins): x=49.501, y=49.53 (A0-A5)
 * - Pin pitch: 2.54mm
 * - Pin center offset: 1.27mm (half pitch)
 */
const PIN_PITCH = 2.54; // mm
const PIN_OFFSET = 1.27; // mm (to pin center)

export const COMPONENT_PINOUTS: Record<string, ComponentPinout> = {
  'wokwi-arduino-uno': {
    viewBox: '-4 0 72.58 53.34',
    pins: {
      // TOP-LEFT HEADER (10 pins) - starts at (17.497, 1.27)
      // Pins: A5, A4, AREF, GND, 13, 12, 11, 10, 9, 8
      'A5.2': { x: 17.497 + PIN_OFFSET + 0 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      'A5': { x: 17.497 + PIN_OFFSET + 0 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      'A4.2': { x: 17.497 + PIN_OFFSET + 1 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      'A4': { x: 17.497 + PIN_OFFSET + 1 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      'AREF': { x: 17.497 + PIN_OFFSET + 2 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      'GND.1': { x: 17.497 + PIN_OFFSET + 3 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      'GND': { x: 17.497 + PIN_OFFSET + 3 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '13': { x: 17.497 + PIN_OFFSET + 4 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '12': { x: 17.497 + PIN_OFFSET + 5 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '11': { x: 17.497 + PIN_OFFSET + 6 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '10': { x: 17.497 + PIN_OFFSET + 7 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '9': { x: 17.497 + PIN_OFFSET + 8 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '8': { x: 17.497 + PIN_OFFSET + 9 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      
      // TOP-RIGHT HEADER (8 pins) - starts at (44.421, 1.27)
      // Pins: 7, 6, 5, 4, 3, 2, 1, 0
      '7': { x: 44.421 + PIN_OFFSET + 0 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '6': { x: 44.421 + PIN_OFFSET + 1 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '5': { x: 44.421 + PIN_OFFSET + 2 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '4': { x: 44.421 + PIN_OFFSET + 3 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '3': { x: 44.421 + PIN_OFFSET + 4 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '2': { x: 44.421 + PIN_OFFSET + 5 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '1': { x: 44.421 + PIN_OFFSET + 6 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      '0': { x: 44.421 + PIN_OFFSET + 7 * PIN_PITCH, y: 1.27 + PIN_OFFSET },
      
      // BOTTOM-LEFT HEADER (8 pins) - starts at (26.641, 49.53)
      // Pins: IOREF, RESET, 3.3V, 5V, GND, GND, VIN, (blank)
      'IOREF': { x: 26.641 + PIN_OFFSET + 0 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      'RESET': { x: 26.641 + PIN_OFFSET + 1 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      '3.3V': { x: 26.641 + PIN_OFFSET + 2 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      '5V': { x: 26.641 + PIN_OFFSET + 3 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      'GND.2': { x: 26.641 + PIN_OFFSET + 4 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      'GND.3': { x: 26.641 + PIN_OFFSET + 5 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      'VIN': { x: 26.641 + PIN_OFFSET + 6 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      
      // BOTTOM-RIGHT HEADER (6 pins) - starts at (49.501, 49.53)
      // Pins: A0, A1, A2, A3, A4, A5
      'A0': { x: 49.501 + PIN_OFFSET + 0 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      'A1': { x: 49.501 + PIN_OFFSET + 1 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      'A2': { x: 49.501 + PIN_OFFSET + 2 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      'A3': { x: 49.501 + PIN_OFFSET + 3 * PIN_PITCH, y: 49.53 + PIN_OFFSET },
      // A4 and A5 are on bottom (with I2C), duplicate top ones
    },
  },
  
  // LED pinout (from led-element.ts)
  'wokwi-led': {
    viewBox: '-10 -5 35.456 39.618',
    pins: {
      'A': { x: 15, y: 32 }, // Anode (longer leg)
      'C': { x: 5, y: 32 },  // Cathode (shorter leg)
    },
  },
  
  // Pushbutton pinout (from pushbutton-element.ts)
  'wokwi-pushbutton': {
    viewBox: '-3 0 18 12',
    pins: {
      '1.l': { x: 0, y: 3.25 },
      '2.l': { x: 0, y: 8 },
      '1.r': { x: 18, y: 3.25 },
      '2.r': { x: 18, y: 8 },
    },
  },
  
  // Buzzer pinout (from buzzer-element.ts)
  'wokwi-buzzer': {
    viewBox: '0 0 17 20',
    pins: {
      '1': { x: 6, y: 20 },  // Negative (-)
      '2': { x: 10, y: 20 }, // Positive (+)
    },
  },
  
  // 7-segment display (estimated, need to verify)
  'wokwi-7segment': {
    viewBox: '0 0 40 60',
    pins: {
      'A': { x: 5, y: 55 },
      'B': { x: 10, y: 55 },
      'C': { x: 15, y: 55 },
      'D': { x: 20, y: 55 },
      'E': { x: 25, y: 55 },
      'F': { x: 30, y: 55 },
      'G': { x: 35, y: 55 },
      'DP': { x: 5, y: 5 },
      'COM': { x: 10, y: 5 },
    },
  },
};

/**
 * Get pinout for a component type
 */
export function getComponentPinoutCorrected(type: string): ComponentPinout | null {
  return COMPONENT_PINOUTS[type] || null;
}

/**
 * Get pin position in SVG viewBox coordinates
 */
export function getPinPositionCorrected(type: string, pinName: string): PinPosition | null {
  const pinout = COMPONENT_PINOUTS[type];
  if (!pinout) return null;
  
  let pin = pinout.pins[pinName];
  
  // Try without suffix if not found
  if (!pin && pinName.includes('.')) {
    const baseName = pinName.split('.')[0];
    pin = pinout.pins[baseName];
  }
  
  return pin || null;
}


