// SPDX-License-Identifier: MIT
// Extracts pin names from diagram.json connections dynamically

import { Connection, Part } from './types';
import { ComponentPinout, registerComponentPinout, getComponentPinout } from './component-pinout-loader';

/**
 * Extracts pin names used in connections for each component
 */
export function extractPinNamesFromConnections(
  connections: Connection[],
  parts: Part[]
): Map<string, Set<string>> {
  const componentPins = new Map<string, Set<string>>();
  
  for (const conn of connections) {
    const source = conn[0];
    const target = conn[1];
    
    // Parse source: "component-id:pin"
    const [sourceId, sourcePin] = source.split(':');
    if (sourceId && sourcePin && sourceId !== 'uno') {
      if (!componentPins.has(sourceId)) {
        componentPins.set(sourceId, new Set());
      }
      componentPins.get(sourceId)!.add(sourcePin);
    }
    
    // Parse target: "component-id:pin"
    const [targetId, targetPin] = target.split(':');
    if (targetId && targetPin && targetId !== 'uno') {
      if (!componentPins.has(targetId)) {
        componentPins.set(targetId, new Set());
      }
      componentPins.get(targetId)!.add(targetPin);
    }
  }
  
  return componentPins;
}

/**
 * Creates a basic pinout from extracted pin names
 * Uses default positions based on pin count and component type
 */
function createDefaultPinout(
  componentType: string,
  pinNames: Set<string>,
  part: Part
): ComponentPinout {
  const pins: Record<string, { x: number; y: number }> = {};
  const pinArray = Array.from(pinNames).sort();
  const pinCount = pinArray.length;
  
  // Default component dimensions
  const width = 50;
  const height = 50;
  
  // Distribute pins around component perimeter
  // Top, right, bottom, left
  const pinsPerSide = Math.ceil(pinCount / 4);
  let pinIndex = 0;
  
  for (const pinName of pinArray) {
    const side = Math.floor(pinIndex / pinsPerSide);
    const posOnSide = pinIndex % pinsPerSide;
    
    let x = 0, y = 0;
    
    switch (side) {
      case 0: // Top
        x = -width/2 + (posOnSide + 1) * (width / (pinsPerSide + 1));
        y = -height/2;
        break;
      case 1: // Right
        x = width/2;
        y = -height/2 + (posOnSide + 1) * (height / (pinsPerSide + 1));
        break;
      case 2: // Bottom
        x = width/2 - (posOnSide + 1) * (width / (pinsPerSide + 1));
        y = height/2;
        break;
      case 3: // Left
        x = -width/2;
        y = height/2 - (posOnSide + 1) * (height / (pinsPerSide + 1));
        break;
    }
    
    pins[pinName] = { x, y };
    pinIndex++;
  }
  
  return {
    width,
    height,
    pins,
  };
}

/**
 * Builds pinout data from diagram connections and registers missing components
 */
export function buildPinoutsFromDiagram(
  connections: Connection[],
  parts: Part[]
): void {
  const componentPins = extractPinNamesFromConnections(connections, parts);
  const partsMap = new Map<string, Part>();
  for (const part of parts) {
    partsMap.set(part.id, part);
  }
  
  console.log('[PIN EXTRACTOR] Extracted pin names:', 
    Array.from(componentPins.entries()).map(([id, pins]) => 
      `${id}: [${Array.from(pins).join(', ')}]`
    )
  );
  
  // Register pinouts for components that don't have them
  for (const [componentId, pinNames] of componentPins.entries()) {
    const part = partsMap.get(componentId);
    if (!part) continue;
    
    // Check if we already have pinout data
    const existingPinout = getComponentPinout(part.type);
    
    if (!existingPinout || existingPinout.pins === undefined || Object.keys(existingPinout.pins).length === 0) {
      // Create default pinout from extracted pins
      const defaultPinout = createDefaultPinout(part.type, pinNames, part);
      
      // Merge with existing if it exists (keep width/height)
      const mergedPinout: ComponentPinout = {
        width: existingPinout?.width || defaultPinout.width,
        height: existingPinout?.height || defaultPinout.height,
        pins: {
          ...(existingPinout?.pins || {}),
          ...defaultPinout.pins, // Extracted pins override defaults
        },
      };
      
      registerComponentPinout(part.type, mergedPinout, 'external');
      console.log(`[PIN EXTRACTOR] Registered pinout for ${part.type} (${componentId}) with ${Object.keys(mergedPinout.pins).length} pins`);
    } else {
      // Add any missing pins from connections
      const missingPins: Record<string, { x: number; y: number }> = {};
      for (const pinName of pinNames) {
        if (!existingPinout.pins[pinName]) {
          // Estimate position (center for now, could be improved)
          missingPins[pinName] = { x: 0, y: 0 };
        }
      }
      
      if (Object.keys(missingPins).length > 0) {
        const updatedPinout: ComponentPinout = {
          ...existingPinout,
          pins: {
            ...existingPinout.pins,
            ...missingPins,
          },
        };
        registerComponentPinout(part.type, updatedPinout, 'external');
        console.log(`[PIN EXTRACTOR] Added ${Object.keys(missingPins).length} missing pins to ${part.type}`);
      }
    }
  }
}

