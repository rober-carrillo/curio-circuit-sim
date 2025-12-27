// SPDX-License-Identifier: MIT
// Maps Arduino pins to AVR8js ports and bits

import { Connection, PinMapping, ComponentConnection } from './types';

/**
 * Maps Arduino Uno pin numbers to AVR8js ports and bits
 */
export function getPinMapping(pinNumber: number): PinMapping | null {
  if (pinNumber >= 0 && pinNumber <= 7) {
    // PORTD: pins 0-7
    return {
      arduinoPin: pinNumber,
      port: 'D',
      bit: pinNumber,
    };
  } else if (pinNumber >= 8 && pinNumber <= 13) {
    // PORTB: pins 8-13
    return {
      arduinoPin: pinNumber,
      port: 'B',
      bit: pinNumber - 8,
    };
  }
  return null;
}

/**
 * Maps Arduino analog pins (A0-A5) to PORTC
 */
export function getAnalogPinMapping(analogPin: number): PinMapping | null {
  if (analogPin >= 0 && analogPin <= 5) {
    return {
      arduinoPin: analogPin + 14, // A0 = 14, A1 = 15, etc. (for reference)
      port: 'C',
      bit: analogPin,
    };
  }
  return null;
}

/**
 * Parses a connection string like "uno:8" or "uno:A0"
 * Returns the Arduino pin number, or null if invalid
 * For analog pins, returns 14-19 (A0=14, A1=15, etc.) to distinguish from digital
 * Skips GND, 5V, and other non-signal pins
 */
export function parseArduinoPin(connectionString: string): number | null {
  // Skip GND, 5V, and other power pins
  if (connectionString.includes('GND') || connectionString.includes('5V') || connectionString.includes('3.3V')) {
    return null;
  }

  // Format: "uno:8" or "uno:A0" or "uno:GND.1" (skip the last one)
  const match = connectionString.match(/^uno:(\d+|A\d+)/);
  if (!match) return null;

  const pinStr = match[1];
  
  // Handle analog pins (A0-A5)
  if (pinStr.startsWith('A')) {
    const analogNum = parseInt(pinStr.substring(1));
    if (analogNum >= 0 && analogNum <= 5) {
      return 14 + analogNum; // Return as 14-19 to distinguish from digital pins
    }
  }
  
  // Handle digital pins (0-13)
  const pinNum = parseInt(pinStr);
  if (pinNum >= 0 && pinNum <= 13) {
    return pinNum;
  }
  
  return null;
}

/**
 * Parses a component pin string like "led-red:A" or "btn-red:1.l"
 * Returns { componentId, componentPin }
 */
export function parseComponentPin(connectionString: string): { componentId: string; componentPin: string } | null {
  // Format: "component-id:pin" or "component-id:pin.side"
  const match = connectionString.match(/^([^:]+):(.+)$/);
  if (!match) return null;

  return {
    componentId: match[1],
    componentPin: match[2],
  };
}

/**
 * Extracts all component-to-Arduino connections from diagram
 */
export function extractComponentConnections(connections: Connection[]): ComponentConnection[] {
  const result: ComponentConnection[] = [];

  for (const conn of connections) {
    const source = conn[0];
    const target = conn[1];

    // Check if source is Arduino pin and target is component
    let arduinoPin: number | null = null;
    let componentInfo: { componentId: string; componentPin: string } | null = null;

    if (source.startsWith('uno:')) {
      arduinoPin = parseArduinoPin(source);
      componentInfo = parseComponentPin(target);
    } else if (target.startsWith('uno:')) {
      arduinoPin = parseArduinoPin(target);
      componentInfo = parseComponentPin(source);
    }

    // Skip if not an Arduino-to-component connection
    if (arduinoPin === null || !componentInfo) continue;

    // Get port mapping
    let pinMapping: PinMapping | null = null;
    if (arduinoPin <= 13) {
      pinMapping = getPinMapping(arduinoPin);
    } else if (arduinoPin >= 14 && arduinoPin <= 19) {
      // Analog pin (A0-A5: 14-19 maps to 0-5)
      pinMapping = getAnalogPinMapping(arduinoPin - 14);
    }

    if (!pinMapping) continue;

    result.push({
      componentId: componentInfo.componentId,
      componentPin: componentInfo.componentPin,
      arduinoPin: pinMapping.arduinoPin,
      port: pinMapping.port,
      bit: pinMapping.bit,
    });
  }

  return result;
}

