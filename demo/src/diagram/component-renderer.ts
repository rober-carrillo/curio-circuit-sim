// SPDX-License-Identifier: MIT
// Dynamically renders wokwi-elements components from diagram parts

// Import wokwi-elements to register custom elements
import '@wokwi/elements';
import { Part, Connection } from './types';
import { getComponentInfo, isComponentSupported } from './component-registry';

export interface RenderedComponent {
  part: Part;
  element: HTMLElement;
  componentInfo: ReturnType<typeof getComponentInfo>;
}

/**
 * Renders components from diagram parts into a container
 */
export function renderComponents(
  parts: Part[],
  container: HTMLElement,
  connections?: Connection[]
): Map<string, RenderedComponent> {
  const rendered = new Map<string, RenderedComponent>();
  const unsupported: string[] = [];

  // Clear container
  container.innerHTML = '';

  // Create a positioned container for absolute positioning of components
  const positionedContainer = document.createElement('div');
  positionedContainer.style.position = 'relative';
  positionedContainer.style.width = '100%';
  positionedContainer.style.minHeight = '600px'; // Larger to accommodate diagram
  positionedContainer.style.background = '#f9f9f9';
  positionedContainer.style.overflow = 'visible';
  container.appendChild(positionedContainer);

  for (const part of parts) {
    // Include Arduino board now

    const componentInfo = getComponentInfo(part.type);

    if (!isComponentSupported(part.type)) {
      unsupported.push(part.type);
      console.warn(`Component type "${part.type}" (${part.id}) is not yet supported`);
      // For special components like Arduino, try to render anyway
      if (part.type.includes('arduino') || part.type.includes('74hc595')) {
        console.log(`Attempting to render ${part.type} even though not fully supported`);
      } else {
        continue;
      }
    }

    // Create wokwi-element (or fallback div if element doesn't exist)
    let element: HTMLElement;
    try {
      element = document.createElement(componentInfo.elementName);
      element.id = part.id;
    } catch (e) {
      // Element might not be registered, create a placeholder
      console.warn(`Could not create element ${componentInfo.elementName}, using placeholder`);
      element = document.createElement('div');
      element.id = part.id;
      element.style.width = '60px';
      element.style.height = '40px';
      element.style.border = '2px solid #333';
      element.style.borderRadius = '4px';
      element.style.background = '#ddd';
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
      element.textContent = part.type.replace('wokwi-', '');
      element.style.fontSize = '10px';
    }

    // Apply attributes
    const attrs = componentInfo.getAttributes(part);
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, String(value));
      }
    }

    // Position component using diagram coordinates (if available)
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '8px';
    wrapper.style.zIndex = '10';
    
    // Use diagram coordinates if available, otherwise use grid
    if (part.top !== undefined && part.left !== undefined) {
      wrapper.style.top = `${part.top}px`;
      wrapper.style.left = `${part.left}px`;
      console.log(`Positioned ${part.id} at (${part.left}, ${part.top})`);
    } else {
      // Fallback: use a more spread-out grid layout for better visibility
      const index = Array.from(rendered.keys()).length;
      const col = index % 4; // 4 columns
      const row = Math.floor(index / 4);
      wrapper.style.top = `${row * 150 + 20}px`;
      wrapper.style.left = `${col * 150 + 20}px`;
      console.log(`Positioned ${part.id} in grid at (${col}, ${row}) index ${index}`);
    }
    
    // Special handling for Arduino board - make it larger and more visible
    if (part.type.includes('arduino')) {
      wrapper.style.zIndex = '5'; // Behind other components
      // Arduino Uno is typically ~68x53px, but wokwi-element might be different
      if (element.tagName.toLowerCase() === 'div') {
        // Placeholder - make it visible
        element.style.width = '68px';
        element.style.height = '53px';
        element.style.background = '#00579f';
        element.style.color = 'white';
        element.textContent = 'Arduino\nUno';
        element.style.fontSize = '8px';
        element.style.textAlign = 'center';
        element.style.padding = '4px';
      }
    }
    
    // Special handling for 74HC595 - make it visible
    if (part.type.includes('74hc595')) {
      if (element.tagName.toLowerCase() === 'div') {
        element.style.width = '40px';
        element.style.height = '20px';
        element.style.background = '#1a1a1a';
        element.style.color = '#fff';
        element.style.border = '2px solid #666';
        element.style.borderRadius = '4px';
        element.textContent = '74HC595';
        element.style.fontSize = '7px';
        element.style.textAlign = 'center';
        element.style.padding = '4px 2px';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontWeight = 'bold';
      }
    }
    
    wrapper.appendChild(element);

    // Add label if not already in element
    if (!attrs.label) {
      const label = document.createElement('div');
      label.textContent = part.id;
      label.style.fontSize = '12px';
      label.style.color = '#666';
      label.style.background = 'rgba(255,255,255,0.8)';
      label.style.padding = '2px 6px';
      label.style.borderRadius = '4px';
      wrapper.appendChild(label);
    }

    positionedContainer.appendChild(wrapper);

    rendered.set(part.id, {
      part,
      element,
      componentInfo,
    });
  }

  if (unsupported.length > 0) {
    console.warn(
      `Skipped ${unsupported.length} unsupported component types:`,
      [...new Set(unsupported)]
    );
  }

  return rendered;
}

