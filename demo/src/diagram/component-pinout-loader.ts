// SPDX-License-Identifier: MIT
// System for loading and managing component pinout data

import { ComponentPinout, COMPONENT_PINOUTS } from './pinout-data';

/**
 * Extended pinout data that can be loaded from external sources
 * This allows adding pinout data for components not in wokwi-elements
 */
export interface ExtendedPinout extends ComponentPinout {
  componentType: string;
  source?: 'builtin' | 'external' | 'custom';
}

/**
 * Registry for extended pinout data
 */
const extendedPinouts: Map<string, ExtendedPinout> = new Map();

/**
 * Loads pinout data for a component
 * First checks built-in, then extended registry
 */
export function getComponentPinout(componentType: string): ComponentPinout | null {
  // Check built-in pinouts first
  if (COMPONENT_PINOUTS[componentType]) {
    return COMPONENT_PINOUTS[componentType];
  }
  
  // Check extended pinouts
  const extended = extendedPinouts.get(componentType);
  if (extended) {
    return extended;
  }
  
  return null;
}

/**
 * Registers a custom pinout for a component
 * Useful for components not in wokwi-elements
 */
export function registerComponentPinout(
  componentType: string,
  pinout: ComponentPinout,
  source: 'external' | 'custom' = 'custom'
): void {
  extendedPinouts.set(componentType, {
    ...pinout,
    componentType,
    source,
  });
  console.log(`Registered pinout for ${componentType} (${source})`);
}

/**
 * Loads pinout data from a JSON file
 * Format: { componentType: { width, height, pins: { pinName: { x, y } } } }
 */
export async function loadPinoutFromJSON(url: string): Promise<void> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    for (const [componentType, pinout] of Object.entries(data)) {
      if (isValidPinout(pinout)) {
        registerComponentPinout(componentType, pinout as ComponentPinout, 'external');
      }
    }
    
    console.log(`Loaded pinout data from ${url}`);
  } catch (error) {
    console.error(`Failed to load pinout from ${url}:`, error);
  }
}

/**
 * Validates pinout data structure
 */
function isValidPinout(data: any): data is ComponentPinout {
  return (
    data &&
    typeof data.width === 'number' &&
    typeof data.height === 'number' &&
    data.pins &&
    typeof data.pins === 'object'
  );
}

/**
 * Gets all registered component types (built-in + extended)
 */
export function getAllComponentTypes(): string[] {
  const builtin = Object.keys(COMPONENT_PINOUTS);
  const extended = Array.from(extendedPinouts.keys());
  return [...new Set([...builtin, ...extended])];
}

/**
 * Exports current pinout data (for saving/backup)
 */
export function exportPinoutData(): Record<string, ComponentPinout> {
  const result: Record<string, ComponentPinout> = { ...COMPONENT_PINOUTS };
  
  for (const [type, pinout] of extendedPinouts.entries()) {
    result[type] = pinout;
  }
  
  return result;
}


