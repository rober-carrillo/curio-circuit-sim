// SPDX-License-Identifier: MIT
// Pinout data for components - maps pin names to relative positions

export interface PinPosition {
  x: number; // Relative to component center (0,0)
  y: number;
}

export interface ComponentPinout {
  width: number;
  height: number;
  pins: Record<string, PinPosition>;
}

/**
 * Pinout data for common Wokwi components
 * Positions are relative to component center (0,0)
 */
export const COMPONENT_PINOUTS: Record<string, ComponentPinout> = {
  'wokwi-led': {
    width: 20,
    height: 20,
    pins: {
      // From wokwi-elements: ViewBox "-10 -5 35.456 39.618", center (10, 20)
      // Pin A: x: 25, y: 42 → relative to center (10, 20) = (15, 22)
      // But our component is 20×20, so scale and adjust
      'A': { x: 5, y: 12 },   // Anode (from wokwi-elements source)
      'C': { x: -5, y: 12 },  // Cathode (from wokwi-elements source, flipped)
    },
  },
  
  'wokwi-pushbutton': {
    width: 20,
    height: 20,
    pins: {
      // From wokwi-elements: ViewBox "-3 0 18 12", pins at edges
      // Pin 1.l: x: 0, y: 13 → relative to center (6, 6) = (-6, 7)
      // Pin 2.l: x: 0, y: 32 → relative to center (6, 6) = (-6, 26)
      // Pin 1.r: x: 67, y: 13 → relative to center (6, 6) = (61, 7)
      // Pin 2.r: x: 67, y: 32 → relative to center (6, 6) = (61, 26)
      // But our component is 20×20, so scale appropriately
      '1.l': { x: -10, y: 2 },   // Left pin, top (from wokwi-elements)
      '2.l': { x: -10, y: 18 },  // Left pin, bottom (from wokwi-elements)
      '1.r': { x: 10, y: 2 },    // Right pin, top (from wokwi-elements)
      '2.r': { x: 10, y: 18 },   // Right pin, bottom (from wokwi-elements)
      '1': { x: -10, y: 10 },    // Left side center (fallback)
      '2': { x: 10, y: 10 },     // Right side center (fallback)
    },
  },
  
  'wokwi-buzzer': {
    width: 20,
    height: 20,
    pins: {
      // From wokwi-elements: ViewBox "0 0 17 20", pins at bottom
      // Pin 1: x: 27, y: 84 (these coordinates seem to be in different units)
      // Based on SVG, pins are at bottom, spaced ~10 units apart
      // Our component is 20×20, pins at bottom
      '1': { x: -5, y: 8 },   // Left pin (from wokwi-elements, estimated)
      '2': { x: 5, y: 8 },    // Right pin (from wokwi-elements, estimated)
    },
  },
  
  'wokwi-7segment': {
    width: 30,
    height: 50,
    pins: {
      'A': { x: -12, y: -20 },
      'B': { x: -12, y: -10 },
      'C': { x: -12, y: 0 },
      'D': { x: -12, y: 10 },
      'E': { x: -12, y: 20 },
      'F': { x: 12, y: -20 },
      'G': { x: 12, y: -10 },
      'DP': { x: 12, y: 0 },
      'COM': { x: 0, y: 25 }, // Common pin (bottom)
    },
  },
  
  'wokwi-74hc595': {
    width: 40,
    height: 20,
    pins: {
      'Q0': { x: 20, y: -8 },
      'Q1': { x: 20, y: -6 },
      'Q2': { x: 20, y: -4 },
      'Q3': { x: 20, y: -2 },
      'Q4': { x: 20, y: 2 },
      'Q5': { x: 20, y: 4 },
      'Q6': { x: 20, y: 6 },
      'Q7': { x: 20, y: 8 },
      'DS': { x: -20, y: -8 },   // Data Serial
      'OE': { x: -20, y: -6 },   // Output Enable
      'ST_CP': { x: -20, y: -4 }, // Latch (with underscore)
      'STCP': { x: -20, y: -4 },  // Latch (without underscore - Wokwi format)
      'SH_CP': { x: -20, y: -2 }, // Clock (with underscore)
      'SHCP': { x: -20, y: -2 },  // Clock (without underscore - Wokwi format)
      'MR': { x: -20, y: 2 },    // Master Reset
      'Q7S': { x: -20, y: 4 },   // Serial Out
      'VCC': { x: -20, y: 6 },
      'GND': { x: -20, y: 8 },
    },
  },
  
  'wokwi-arduino-uno': {
    width: 68,
    height: 53,
    pins: {
      // Digital pins (right side, top) - from wokwi-elements source
      // ViewBox: "-4 0 72.58 53.34", Component center: (32.29, 26.67)
      // Pin coordinates from source, converted to relative (center = 0,0)
      '0': { x: 21.2, y: -17.6 },   // Source: x: 255.5, y: 9
      '1': { x: 20.2, y: -17.6 },   // Source: x: 246, y: 9
      '2': { x: 19.3, y: -17.6 },   // Source: x: 236.5, y: 9
      '3': { x: 18.4, y: -17.6 },   // Source: x: 227, y: 9
      '4': { x: 17.5, y: -17.6 },   // Source: x: 217.5, y: 9
      '5': { x: 16.6, y: -17.6 },   // Source: x: 208, y: 9
      '6': { x: 15.7, y: -17.6 },   // Source: x: 198.5, y: 9
      '7': { x: 14.8, y: -17.6 },   // Source: x: 189, y: 9
      '8': { x: 13.8, y: -17.6 },   // Source: x: 173, y: 9
      '9': { x: 12.5, y: -17.6 },   // Source: x: 163, y: 9
      '10': { x: 11.6, y: -17.6 },  // Source: x: 153.5, y: 9
      '11': { x: 10.7, y: -17.6 },  // Source: x: 144, y: 9
      '12': { x: 9.8, y: -17.6 },   // Source: x: 134.5, y: 9
      '13': { x: 8.9, y: -17.6 },   // Source: x: 125, y: 9
      // Analog pins (left side, bottom) - from wokwi-elements source
      'A0': { x: 16.6, y: 13.8 },   // Source: x: 208, y: 191.5
      'A1': { x: 17.5, y: 13.8 },   // Source: x: 217.5, y: 191.5
      'A2': { x: 18.4, y: 13.8 },   // Source: x: 227, y: 191.5
      'A3': { x: 19.3, y: 13.8 },   // Source: x: 236.5, y: 191.5
      'A4': { x: 20.2, y: 13.8 },   // Source: x: 246, y: 191.5
      'A5': { x: 21.2, y: 13.8 },   // Source: x: 255.5, y: 191.5
      // Power pins (bottom center) - from wokwi-elements source
      'GND.1': { x: 7.8, y: -17.6 }, // Source: x: 115.5, y: 9 (top GND)
      'GND.2': { x: 12.6, y: 13.8 }, // Source: x: 169.5, y: 191.5
      'GND.3': { x: 13.5, y: 13.8 }, // Source: x: 179, y: 191.5
      '5V': { x: 11.7, y: 13.8 },    // Source: x: 160, y: 191.5
      '3.3V': { x: 10.3, y: 13.8 },  // Source: x: 150, y: 191.5
      'VIN': { x: 14.4, y: 13.8 },   // Source: x: 188.5, y: 191.5
      'RESET': { x: 9.4, y: 13.8 },  // Source: x: 140.5, y: 191.5
      'IOREF': { x: 8.5, y: 13.8 },  // Source: x: 131, y: 191.5
      'AREF': { x: 6.9, y: -17.6 },  // Source: x: 106, y: 9
      // Aliases for analog pins on top (A4.2, A5.2)
      'A4.2': { x: 6.6, y: -17.6 },  // Source: x: 97, y: 9
      'A5.2': { x: 5.3, y: -17.6 },  // Source: x: 87, y: 9
    },
  },
};

/**
 * Gets pin position for a component
 */
export function getPinPosition(
  componentType: string,
  pinName: string,
  componentX: number,
  componentY: number
): { x: number; y: number } | null {
  const pinout = COMPONENT_PINOUTS[componentType];
  if (!pinout) {
    // Unknown component - return center
    return { x: componentX, y: componentY };
  }
  
  const pin = pinout.pins[pinName];
  if (!pin) {
    // Unknown pin - return center
    return { x: componentX, y: componentY };
  }
  
  // Convert relative position to absolute
  return {
    x: componentX + pin.x,
    y: componentY + pin.y,
  };
}

