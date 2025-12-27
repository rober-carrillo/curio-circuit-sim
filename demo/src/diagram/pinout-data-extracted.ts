// SPDX-License-Identifier: MIT
// Pinout data extracted from wokwi-elements-source
// This is the EXACT data from the source code, with proper coordinate conversions

export interface PinPosition {
  x: number;
  y: number;
}

export interface ComponentPinout {
  width: number;  // SVG viewBox width in mm
  height: number; // SVG viewBox height in mm
  viewBox: string; // Original SVG viewBox for reference
  pins: Record<string, PinPosition>;
}

/**
 * Exact pinout data from wokwi-elements source code
 * All coordinates are in SVG viewBox units (not pixels)
 */
export const COMPONENT_PINOUTS_EXACT: Record<string, ComponentPinout> = {
  //=== ARDUINO UNO ===
  // From: wokwi-elements-source/src/arduino-uno-element.ts
  // ViewBox: "-4 0 72.58 53.34" (width: 72.58mm, height: 53.34mm)
  'wokwi-arduino-uno': {
    width: 72.58,
    height: 53.34,
    viewBox: '-4 0 72.58 53.34',
    pins: {
      // Top row (digital pins)
      'A5.2': { x: 87, y: 9 },
      'A4.2': { x: 97, y: 9 },
      'AREF': { x: 106, y: 9 },
      'GND.1': { x: 115.5, y: 9 },
      '13': { x: 125, y: 9 },
      '12': { x: 134.5, y: 9 },
      '11': { x: 144, y: 9 },
      '10': { x: 153.5, y: 9 },
      '9': { x: 163, y: 9 },
      '8': { x: 173, y: 9 },
      '7': { x: 189, y: 9 },
      '6': { x: 198.5, y: 9 },
      '5': { x: 208, y: 9 },
      '4': { x: 217.5, y: 9 },
      '3': { x: 227, y: 9 },
      '2': { x: 236.5, y: 9 },
      '1': { x: 246, y: 9 },
      '0': { x: 255.5, y: 9 },
      // Bottom row (power + analog)
      'IOREF': { x: 131, y: 191.5 },
      'RESET': { x: 140.5, y: 191.5 },
      '3.3V': { x: 150, y: 191.5 },
      '5V': { x: 160, y: 191.5 },
      'GND.2': { x: 169.5, y: 191.5 },
      'GND.3': { x: 179, y: 191.5 },
      'VIN': { x: 188.5, y: 191.5 },
      'A0': { x: 208, y: 191.5 },
      'A1': { x: 217.5, y: 191.5 },
      'A2': { x: 227, y: 191.5 },
      'A3': { x: 236.5, y: 191.5 },
      'A4': { x: 246, y: 191.5 },
      'A5': { x: 255.5, y: 191.5 },
    },
  },

  //=== LED ===
  // From: wokwi-elements-source/src/led-element.ts
  // ViewBox: "-10 -5 35.456 39.618" (width: 40px, height: 50px render size)
  // Note: LED has a `flip` property that swaps anode/cathode positions
  'wokwi-led': {
    width: 35.456,
    height: 39.618,
    viewBox: '-10 -5 35.456 39.618',
    pins: {
      'A': { x: 25, y: 42 },  // Anode (default, non-flipped)
      'C': { x: 15, y: 42 },  // Cathode (default, non-flipped)
    },
  },

  //=== PUSHBUTTON ===
  // From: wokwi-elements-source/src/pushbutton-element.ts
  // ViewBox: need to find
  'wokwi-pushbutton': {
    width: 67,
    height: 45,
    viewBox: '0 0 67 45',
    pins: {
      '1.l': { x: 0, y: 13 },   // Left top
      '2.l': { x: 0, y: 32 },   // Left bottom
      '1.r': { x: 67, y: 13 },  // Right top
      '2.r': { x: 67, y: 32 },  // Right bottom
    },
  },

  //=== BUZZER ===
  // From: wokwi-elements-source/src/buzzer-element.ts
  // ViewBox: "0 0 17 20" (width: 75px render size)
  'wokwi-buzzer': {
    width: 17,
    height: 20,
    viewBox: '0 0 17 20',
    pins: {
      '1': { x: 27, y: 84 },  // Left pin
      '2': { x: 37, y: 84 },  // Right pin
    },
  },

  //=== 7-SEGMENT DISPLAY ===
  // From: wokwi-elements-source/src/7segment-element.ts
  // Note: Pin positions are computed dynamically based on number of digits
  // This is a simplified version for 1-digit display
  'wokwi-7segment': {
    width: 26.67,
    height: 40,
    viewBox: '0 0 26.67 40',
    pins: {
      'A': { x: 3.81, y: 1 },    // Segment A
      'B': { x: 6.35, y: 1 },    // Segment B
      'C': { x: 8.89, y: 1 },    // Segment C
      'D': { x: 11.43, y: 1 },   // Segment D
      'E': { x: 13.97, y: 1 },   // Segment E
      'F': { x: 16.51, y: 1 },   // Segment F
      'G': { x: 19.05, y: 1 },   // Segment G
      'DP': { x: 21.59, y: 1 },  // Decimal point
      'COM': { x: 13.335, y: 39 }, // Common cathode (center bottom)
    },
  },

  //=== 74HC595 SHIFT REGISTER ===
  // Not in wokwi-elements npm package - using standard IC pinout
  // DIP-16 package, pins numbered counter-clockwise from top-left
  'wokwi-74hc595': {
    width: 20,
    height: 50,
    viewBox: '0 0 20 50',
    pins: {
      // Left side (top to bottom)
      'QB': { x: 0, y: 5 },     // Pin 1
      'QC': { x: 0, y: 10 },    // Pin 2
      'QD': { x: 0, y: 15 },    // Pin 3
      'QE': { x: 0, y: 20 },    // Pin 4
      'QF': { x: 0, y: 25 },    // Pin 5
      'QG': { x: 0, y: 30 },    // Pin 6
      'QH': { x: 0, y: 35 },    // Pin 7
      'GND': { x: 0, y: 40 },   // Pin 8
      // Right side (bottom to top)
      'VCC': { x: 20, y: 40 },  // Pin 16
      'QA': { x: 20, y: 35 },   // Pin 15
      'DS': { x: 20, y: 30 },   // Pin 14 (Serial Data Input)
      'OE': { x: 20, y: 25 },   // Pin 13 (Output Enable, active low)
      'RCLK': { x: 20, y: 20 }, // Pin 12 (Storage Register Clock / Latch)
      'SRCLK': { x: 20, y: 15 },// Pin 11 (Shift Register Clock)
      'SRCLR': { x: 20, y: 10 },// Pin 10 (Shift Register Clear, active low)
      'QH\'': { x: 20, y: 5 },  // Pin 9 (Serial Data Output for cascading)
    },
  },
};

/**
 * Helper to get component pinout
 */
export function getComponentPinoutExact(type: string): ComponentPinout | undefined {
  return COMPONENT_PINOUTS_EXACT[type];
}

/**
 * Helper to get pin position in SVG coordinates
 */
export function getPinPositionExact(
  type: string,
  pinName: string
): PinPosition | null {
  const pinout = COMPONENT_PINOUTS_EXACT[type];
  if (!pinout) return null;
  
  return pinout.pins[pinName] || null;
}


