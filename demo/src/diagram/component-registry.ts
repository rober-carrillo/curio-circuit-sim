// SPDX-License-Identifier: MIT
// Maps Wokwi component types to wokwi-elements and their properties

import { Part } from './types';

export type ComponentCategory = 'output' | 'input' | 'display' | 'special' | 'unsupported';

export interface ComponentInfo {
  elementName: string;
  category: ComponentCategory;
  supported: boolean;
  getAttributes: (part: Part) => Record<string, any>;
}

/**
 * Component registry: maps Wokwi types to component info
 */
const COMPONENT_REGISTRY: Record<string, ComponentInfo> = {
  'wokwi-led': {
    elementName: 'wokwi-led',
    category: 'output',
    supported: true,
    getAttributes: (part) => ({
      color: part.attrs?.color || 'red',
      label: part.attrs?.label || part.id,
    }),
  },

  'wokwi-pushbutton': {
    elementName: 'wokwi-pushbutton',
    category: 'input',
    supported: true,
    getAttributes: (part) => ({
      color: part.attrs?.color || 'blue',
      label: part.attrs?.label || part.id,
      key: part.attrs?.key,
    }),
  },

  'wokwi-buzzer': {
    elementName: 'wokwi-buzzer',
    category: 'output',
    supported: true,
    getAttributes: (part) => ({
      label: part.attrs?.label || part.id,
    }),
  },

  'wokwi-7segment': {
    elementName: 'wokwi-7segment',
    category: 'display',
    supported: true,
    getAttributes: (part) => ({
      label: part.attrs?.label || part.id,
    }),
  },

  'wokwi-74hc595': {
    elementName: 'wokwi-74hc595',
    category: 'special',
    supported: true, // Render visually (simulation handled separately)
    getAttributes: () => ({}),
  },

  'wokwi-arduino-uno': {
    elementName: 'wokwi-arduino-uno',
    category: 'special',
    supported: true, // Render the Arduino board
    getAttributes: () => ({}),
  },
};

/**
 * Gets component info for a given type
 */
export function getComponentInfo(type: string): ComponentInfo {
  return COMPONENT_REGISTRY[type] || {
    elementName: type,
    category: 'unsupported',
    supported: false,
    getAttributes: () => ({}),
  };
}

/**
 * Checks if a component type is supported
 */
export function isComponentSupported(type: string): boolean {
  const info = getComponentInfo(type);
  return info.supported && info.category !== 'unsupported';
}

/**
 * Gets all supported component types
 */
export function getSupportedTypes(): string[] {
  return Object.keys(COMPONENT_REGISTRY).filter((type) =>
    isComponentSupported(type)
  );
}

