// SPDX-License-Identifier: MIT
// Type definitions for Wokwi diagram.json format

export interface Diagram {
  version: number;
  author?: string;
  editor?: string;
  parts: Part[];
  connections: Connection[];
}

export interface Part {
  type: string;
  id: string;
  top?: number;
  left?: number;
  rotate?: number;
  attrs?: Record<string, any>;
}

export interface Connection {
  0: string; // Source: "uno:8" or "led-red:A"
  1: string; // Target: "buzzer:2" or "uno:GND.1"
  2: string; // Color: "red", "black", etc.
  3?: number[]; // Path coordinates (for visual rendering)
}

export interface PinMapping {
  arduinoPin: number;
  port: 'B' | 'C' | 'D';
  bit: number;
}

export interface ComponentConnection {
  componentId: string;
  componentPin: string;
  arduinoPin: number;
  port: 'B' | 'C' | 'D';
  bit: number;
}


