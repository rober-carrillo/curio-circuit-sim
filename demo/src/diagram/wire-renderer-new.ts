// SPDX-License-Identifier: MIT
// Renders wire connections between components using SVG
// Uses extracted pinout data from wokwi-elements source

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
  svg.style.zIndex = '5';
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

    // Parse source and target to get component positions
    const sourceInfo = parseConnectionPoint(source, partsMap, renderedComponents, container);
    const targetInfo = parseConnectionPoint(target, partsMap, renderedComponents, container);

    if (!sourceInfo || !targetInfo) {
      console.warn(`Could not find positions for connection: ${source} → ${target}`);
      continue;
    }
    
    renderedCount++;

    // Draw wire
    const path = createWirePath(
      sourceInfo.x,
      sourceInfo.y,
      targetInfo.x,
      targetInfo.y,
      pathData
    );

    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('stroke', getWireColor(color));
    const isPower = source.includes('GND') || source.includes('5V') || 
                    target.includes('GND') || target.includes('5V');
    pathElement.setAttribute('stroke-width', isPower ? '1.5' : '2');
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke-linecap', 'round');
    pathElement.setAttribute('stroke-linejoin', 'miter');
    svg.appendChild(pathElement);
  }

  console.log(`Rendered ${renderedCount} wires out of ${connections.length} connections`);
  return svg;
}

/**
 * Parses a connection point to get its screen coordinates using extracted pinout data
 */
function parseConnectionPoint(
  connection: string,
  partsMap: Map<string, Part>,
  renderedComponents: Map<string, RenderedComponent>,
  container: HTMLElement
): { x: number; y: number } | null {
  const [componentId, pin] = connection.split(':');
  if (!componentId || !pin) return null;

  const part = partsMap.get(componentId);
  const rendered = renderedComponents.get(componentId);
  
  if (!part || !rendered) {
    console.warn(`Component ${componentId} not found`);
    return null;
  }

  const element = rendered.element;
  const pinout = getComponentPinoutExact(part.type);
  
  if (!pinout) {
    console.warn(`[PINOUT] No pinout data for ${part.type}`);
    return getCenterFallback(element, container);
  }
  
  // Get pin position in SVG coordinates
  let pinPos = getPinPositionExact(part.type, pin);
  
  // Try without suffix if not found
  if (!pinPos && pin.includes('.')) {
    const basePin = pin.split('.')[0];
    pinPos = getPinPositionExact(part.type, basePin);
    if (pinPos) {
      console.log(`[PINOUT] Using base pin "${basePin}" for "${pin}"`);
    }
  }
  
  if (!pinPos) {
    console.warn(`[PINOUT] Pin "${pin}" not found in ${part.type}`);
    return getCenterFallback(element, container);
  }
  
  // Convert SVG coordinates to screen coordinates
  return convertPinToScreen(pinPos, pinout, element, container);
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
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  const elementLeft = elementRect.left - containerRect.left;
  const elementTop = elementRect.top - containerRect.top;
  
  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = pinout.viewBox.split(' ').map(parseFloat);
  
  const normalizedX = (pinPos.x - viewBoxX) / viewBoxWidth;
  const normalizedY = (pinPos.y - viewBoxY) / viewBoxHeight;
  
  const pinX = elementLeft + (normalizedX * elementRect.width);
  const pinY = elementTop + (normalizedY * elementRect.height);
  
  console.log(`[PINOUT] Pin at SVG (${pinPos.x}, ${pinPos.y}) → screen (${pinX.toFixed(1)}, ${pinY.toFixed(1)})`);
  return { x: pinX, y: pinY };
}

/**
 * Fallback to component center
 */
function getCenterFallback(element: HTMLElement, container: HTMLElement): { x: number; y: number } | null {
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
 * Creates SVG path for wire using Manhattan routing (straight lines, 90-degree turns)
 */
function createWirePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pathData: any[]
): string {
  if (pathData && pathData.length > 0) {
    let currentX = x1;
    let currentY = y1;
    const pathCommands: string[] = [`M ${x1} ${y1}`];
    
    for (const segment of pathData) {
      if (typeof segment === 'string') {
        if (segment.startsWith('v')) {
          const value = parseFloat(segment.substring(1)) || 0;
          currentY += value;
          pathCommands.push(`L ${currentX} ${currentY}`);
        } else if (segment.startsWith('h')) {
          const value = parseFloat(segment.substring(1)) || 0;
          currentX += value;
          pathCommands.push(`L ${currentX} ${currentY}`);
        }
      }
    }
    
    if (Math.abs(currentX - x2) > 1 || Math.abs(currentY - y2) > 1) {
      pathCommands.push(`L ${x2} ${y2}`);
    }
    
    return pathCommands.join(' ');
  }

  // Simple Manhattan routing
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  
  if (dx > dy) {
    return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`;
  } else {
    return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
  }
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


