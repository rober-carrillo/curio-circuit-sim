// SPDX-License-Identifier: MIT
// Parser for Wokwi diagram.json files

import { Diagram, Part, Connection } from './types';

/**
 * Parses a diagram.json file (string or object)
 */
export function parseDiagram(data: string | object): Diagram {
  const json = typeof data === 'string' ? JSON.parse(data) : data;

  // Validate structure
  if (!json.parts || !Array.isArray(json.parts)) {
    throw new Error('Invalid diagram: missing or invalid "parts" array');
  }

  if (!json.connections || !Array.isArray(json.connections)) {
    throw new Error('Invalid diagram: missing or invalid "connections" array');
  }

  return {
    version: json.version || 1,
    author: json.author,
    editor: json.editor,
    parts: json.parts as Part[],
    connections: json.connections as Connection[],
  };
}

/**
 * Returns all components (including Arduino and special components)
 * We now render everything
 */
export function getComponents(parts: Part[]): Part[] {
  return parts; // Return all parts, including Arduino
}

/**
 * Gets all connections involving Arduino pins
 */
export function getArduinoConnections(connections: Connection[]): Connection[] {
  return connections.filter(
    (conn) => conn[0].startsWith('uno:') || conn[1].startsWith('uno:')
  );
}

