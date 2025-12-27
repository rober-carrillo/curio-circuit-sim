// SPDX-License-Identifier: MIT
// Renders wire connections between components using SVG

import { Connection, Part } from './types';
import { RenderedComponent } from './component-renderer';
import { getComponentPinoutExact, getPinPositionExact } from './pinout-data-extracted';

/**
 * Renders wires/connections between components using SVG
 */
export function renderWires(
  connections: Connection[],
  parts: Part[],
  renderedComponents: Map<string, RenderedComponent>,
  container: HTMLElement
): SVGElement {
  // Create SVG overlay for wires
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = '5'; // Above components but below UI
  svg.style.overflow = 'visible';

  // Create a parts map for quick lookup
  const partsMap = new Map<string, Part>();
  for (const part of parts) {
    partsMap.set(part.id, part);
  }

  console.log(`[WIRE DEBUG] Starting wire rendering for ${connections.length} connections`);
  
  // Render each connection
  let renderedCount = 0;
  for (const conn of connections) {
    const source = conn[0];
    const target = conn[1];
    const color = conn[2] || 'black';
    const pathData = conn[3] || [];
    
    console.log(`[WIRE DEBUG] Processing connection: ${source} → ${target}`);

    // Include GND/5V connections (they're still wires, just power rails)
    // We'll render them too, but maybe with different styling

    // Parse source and target to get component positions
    const sourceInfo = parseConnectionPoint(source, partsMap, renderedComponents, container);
    const targetInfo = parseConnectionPoint(target, partsMap, renderedComponents, container);

    if (!sourceInfo || !targetInfo) {
      console.warn(`Could not find positions for connection: ${source} -> ${target}`);
      continue;
    }
    
    renderedCount++;

    // Draw wire
    const path = createWirePath(
      sourceInfo.x,
      sourceInfo.y,
      targetInfo.x,
      targetInfo.y,
      pathData,
      1,
      1
    );

    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('stroke', getWireColor(color));
    // Thinner lines for power (GND/5V), normal for signals
    const isPower = source.includes('GND') || source.includes('5V') || 
                    target.includes('GND') || target.includes('5V');
    pathElement.setAttribute('stroke-width', isPower ? '1.5' : '2');
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke-linecap', 'round');
    pathElement.setAttribute('stroke-linejoin', 'miter'); // Sharp 90-degree corners
    svg.appendChild(pathElement);
  }

  console.log(`Rendered ${renderedCount} wires out of ${connections.length} connections`);
  return svg;
}

/**
 * Parses a connection point to get its screen coordinates
 */
function parseConnectionPoint(
  connection: string,
  partsMap: Map<string, Part>,
  renderedComponents: Map<string, RenderedComponent>,
  container: HTMLElement
): { x: number; y: number } | null {
  // Format: "component-id:pin" or "uno:pin"
  const [componentId, pin] = connection.split(':');
  if (!componentId || !pin) return null;

  // Handle Arduino board connections
  if (componentId === 'uno') {
    const part = partsMap.get('uno');
    const rendered = renderedComponents.get('uno');
    
    if (!part || !rendered) {
      return { x: 20, y: 180 }; // Fallback
    }
    
    // Use exact pinout data extracted from wokwi-elements source
    const arduinoElement = rendered.element as any;
    const pinout = getComponentPinoutExact('wokwi-arduino-uno');
    
    if (!pinout) {
      console.warn(`[PINOUT] No pinout data for Arduino`);
      return { x: part.left || 20, y: part.top || 180 };
    }
    
    // Get pin position in SVG coordinates
    const pinPos = getPinPositionExact('wokwi-arduino-uno', pin);
    if (!pinPos) {
      console.warn(`[PINOUT] Arduino pin "${pin}" not found in pinout data`);
      return { x: part.left || 20, y: part.top || 180 };
    }
    
    // Get element's actual rendered position and size
    const elementRect = arduinoElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Element position relative to container
    const elementLeft = elementRect.left - containerRect.left;
    const elementTop = elementRect.top - containerRect.top;
    
    // Parse viewBox to get coordinate system
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = pinout.viewBox.split(' ').map(parseFloat);
    
    // Convert from SVG viewBox coordinates to screen coordinates
    const normalizedX = (pinPos.x - viewBoxX) / viewBoxWidth;
    const normalizedY = (pinPos.y - viewBoxY) / viewBoxHeight;
    
    const pinX = elementLeft + (normalizedX * elementRect.width);
    const pinY = elementTop + (normalizedY * elementRect.height);
    
    console.log(`[PINOUT] Arduino pin ${pin} at SVG (${pinPos.x}, ${pinPos.y}) → screen (${pinX.toFixed(1)}, ${pinY.toFixed(1)})`);
    return { x: pinX, y: pinY };
  }

  // Get component
  const part = partsMap.get(componentId);
  const rendered = renderedComponents.get(componentId);
  if (!part || !rendered) return null;

  const element = rendered.element;
  
  // Try to access pinInfo using imported classes
  // Since custom elements don't expose pinInfo properly, create temp instances
  let pinInfoArray: any[] | null = null;
  try {
    // Check element type and create temp instance to get pinInfo
    if (element instanceof LEDElement) {
      const tempLED = new LEDElement();
      pinInfoArray = tempLED.pinInfo;
      if (pinInfoArray) {
        console.log(`[PININFO] LED pinInfo found via new instance (${pinInfoArray.length} pins)`);
      }
    } else if (element instanceof PushbuttonElement) {
      const tempButton = new PushbuttonElement();
      pinInfoArray = tempButton.pinInfo;
      if (pinInfoArray) {
        console.log(`[PININFO] Pushbutton pinInfo found via new instance (${pinInfoArray.length} pins)`);
      }
    } else if (element instanceof BuzzerElement) {
      const tempBuzzer = new BuzzerElement();
      pinInfoArray = tempBuzzer.pinInfo;
      if (pinInfoArray) {
        console.log(`[PININFO] Buzzer pinInfo found via new instance (${pinInfoArray.length} pins)`);
      }
    }
    
    // If still no pinInfo, log for debugging
    if (!pinInfoArray) {
      console.log(`[PININFO] ${componentId} pinInfo not accessible. Element tag:`, element.tagName);
    }
  } catch (e) {
    console.warn(`[PININFO] Error accessing pinInfo for ${componentId}:`, e);
  }
  
  if (pinInfoArray && Array.isArray(pinInfoArray) && pinInfoArray.length > 0) {
    // Find the pin in pinInfo array
    let pinInfo = pinInfoArray.find((p: any) => p.name === pin);
    
    // If not found, try without suffix (e.g., "1.l" -> "1")
    if (!pinInfo && pin.includes('.')) {
      const basePin = pin.split('.')[0];
      pinInfo = pinInfoArray.find((p: any) => p.name === basePin || p.name.startsWith(basePin + '.'));
    }
    
    if (pinInfo) {
      // Get element's SVG viewBox to convert coordinates
      const svg = element.querySelector('svg');
      if (svg) {
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
          const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = viewBox.split(' ').map(parseFloat);
          
          // Get element's actual position relative to container
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Element position relative to container
          const elementLeft = elementRect.left - containerRect.left;
          const elementTop = elementRect.top - containerRect.top;
          
          // Convert from SVG viewBox coordinates to screen coordinates
          const normalizedX = (pinInfo.x - viewBoxX) / viewBoxWidth;
          const normalizedY = (pinInfo.y - viewBoxY) / viewBoxHeight;
          
          // Calculate pin position in screen coordinates
          const pinX = elementLeft + (normalizedX * elementRect.width);
          const pinY = elementTop + (normalizedY * elementRect.height);
          
          console.log(`[PININFO] Found pin ${pin} (${pinInfo.name}) for ${componentId} at SVG (${pinInfo.x}, ${pinInfo.y}) → screen (${pinX}, ${pinY})`);
          return { x: pinX, y: pinY };
        } else {
          console.warn(`[PININFO] No viewBox found for ${componentId}`);
        }
      } else {
        console.warn(`[PININFO] No SVG found for ${componentId}`);
      }
    } else {
      console.log(`[PININFO] Pin "${pin}" not found in pinInfo for ${componentId}, available pins:`, pinInfoArray.map((p: any) => p.name).join(', '));
    }
  } else {
    console.log(`[PININFO] No pinInfo found for ${componentId} (type: ${part.type}), using fallback`);
  }

  // FALLBACK: Use our pinout data (for components without pinInfo or as backup)
  if (part.top !== undefined && part.left !== undefined) {
    // Get component center - check both built-in and extended pinouts
    const pinout = getComponentPinout(part.type);
    const componentWidth = pinout?.width || 50;
    const componentHeight = pinout?.height || 50;
    const componentCenterX = part.left + componentWidth / 2;
    const componentCenterY = part.top + componentHeight / 2;
    
    // Try to get actual pin position - normalize pin name
    // Handle pin names like "1.l", "2.r", "A", "GND.1", etc.
    let normalizedPin = pin;
    let pinPos: { x: number; y: number } | null = null;
    
    // Try exact match first
    if (pinout?.pins[normalizedPin]) {
      pinPos = getPinPosition(part.type, normalizedPin, componentCenterX, componentCenterY);
    }
    
    // If not found, try without suffix (e.g., "1.l" -> "1")
    if (!pinPos && normalizedPin.includes('.')) {
      const basePin = normalizedPin.split('.')[0];
      if (pinout?.pins[basePin]) {
        pinPos = getPinPosition(part.type, basePin, componentCenterX, componentCenterY);
        normalizedPin = basePin;
      }
    }
    
    // If we have a valid pin position (not center), use it
    if (pinPos && pinout?.pins[normalizedPin]) {
      return pinPos;
    }
    
    // Fallback to center with warning
    console.warn(`No pin position found for ${componentId}:${pin} (type: ${part.type}), using center`);
    return { x: componentCenterX, y: componentCenterY };
  }

  // Fallback: try to get element position (less reliable)
  const wrapper = element.parentElement;
  if (wrapper) {
    const rect = wrapper.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    if (rect && containerRect) {
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;
      return { x, y };
    }
  }

  return null;
}

/**
 * Creates SVG path for wire using path data with straight lines and 90-degree turns (Manhattan routing)
 * Path format: ["v-12", "*", "h0"] means:
 * - "v-12" = move vertically -12 pixels (relative)
 * - "*" = separator/turn point (keep current position)
 * - "h0" = move horizontally 0 pixels (relative)
 * 
 * All movements are relative and create 90-degree turns
 */
function createWirePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pathData: any[],
  scaleX: number,
  scaleY: number
): string {
  // If we have path data, parse it for Manhattan routing (straight lines, 90-degree turns)
  if (pathData && pathData.length > 0) {
    let currentX = x1;
    let currentY = y1;
    const pathCommands: string[] = [`M ${x1} ${y1}`];
    
    for (const segment of pathData) {
      if (typeof segment === 'string') {
        // Parse commands like "v-12" (vertical) or "h10" (horizontal)
        if (segment.startsWith('v')) {
          // Vertical movement (relative)
          const value = parseFloat(segment.substring(1)) || 0;
          currentY += value;
          pathCommands.push(`L ${currentX} ${currentY}`);
        } else if (segment.startsWith('h')) {
          // Horizontal movement (relative)
          const value = parseFloat(segment.substring(1)) || 0;
          currentX += value;
          pathCommands.push(`L ${currentX} ${currentY}`);
        }
        // "*" is just a separator/waypoint, keep current position
      } else if (typeof segment === 'number') {
        // Could be a coordinate, but in Wokwi format these are usually strings
      }
    }
    
    // Ensure we end at the target (final segment should get us there, but verify)
    if (Math.abs(currentX - x2) > 1 || Math.abs(currentY - y2) > 1) {
      // Path data didn't get us to target, add final segment
      pathCommands.push(`L ${x2} ${y2}`);
    }
    
    return pathCommands.join(' ');
  }

  // No path data: use simple Manhattan routing (L-shaped path)
  // Choose whether to go horizontal-first or vertical-first based on distance
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  
  if (dx > dy) {
    // Horizontal first, then vertical (taxi routing)
    return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
  } else {
    // Vertical first, then horizontal (taxi routing)
    return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
  }
}

/**
 * Helper to convert SVG pin coordinates to screen coordinates
 */
function convertPinToScreen(
  pinPos: { x: number; y: number },
  pinout: any,
  element: HTMLElement,
  container: HTMLElement
): { x: number; y: number } {
  // Get element's actual rendered position and size
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // Element position relative to container
  const elementLeft = elementRect.left - containerRect.left;
  const elementTop = elementRect.top - containerRect.top;
  
  // Parse viewBox to get coordinate system
  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = pinout.viewBox.split(' ').map(parseFloat);
  
  // Convert from SVG viewBox coordinates to screen coordinates
  const normalizedX = (pinPos.x - viewBoxX) / viewBoxWidth;
  const normalizedY = (pinPos.y - viewBoxY) / viewBoxHeight;
  
  const pinX = elementLeft + (normalizedX * elementRect.width);
  const pinY = elementTop + (normalizedY * elementRect.height);
  
  console.log(`[PINOUT] Pin at SVG (${pinPos.x}, ${pinPos.y}) → screen (${pinX.toFixed(1)}, ${pinY.toFixed(1)})`);
  return { x: pinX, y: pinY };
}

/**
 * Maps wire color names to actual colors
 */
function getWireColor(colorName: string): string {
  const colorMap: Record<string, string> = {
    black: '#000',
    red: '#f00',
    blue: '#00f',
    green: '#0f0',
    yellow: '#ff0',
    orange: '#ff8800',
    purple: '#800080',
    gold: '#ffd700',
    gray: '#808080',
    grey: '#808080',
  };
  return colorMap[colorName.toLowerCase()] || colorName || '#000';
}

