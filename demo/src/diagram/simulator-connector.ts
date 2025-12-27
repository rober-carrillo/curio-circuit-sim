// SPDX-License-Identifier: MIT
// Connects rendered components to AVR8js simulator

import { PinState } from 'avr8js';
import { LEDElement, PushbuttonElement, BuzzerElement, SevenSegmentElement } from '@wokwi/elements';
import { AVRRunner } from '../execute';
import { ComponentConnection, PinMapping } from './types';
import { RenderedComponent } from './component-renderer';
import { getPinMapping, getAnalogPinMapping } from './pin-mapper';
import { BuzzerAudioController } from './buzzer-audio';

export interface SimulatorConnections {
  cleanup: () => void;
}

// Global buzzer audio controller (one per simulator instance)
let buzzerAudio: BuzzerAudioController | null = null;

/**
 * Connects components to the AVR8js simulator
 */
export function connectComponentsToSimulator(
  runner: AVRRunner,
  renderedComponents: Map<string, RenderedComponent>,
  connections: ComponentConnection[]
): SimulatorConnections {
  const cleanupFunctions: (() => void)[] = [];
  
  // Initialize buzzer audio controller
  if (!buzzerAudio) {
    buzzerAudio = new BuzzerAudioController();
  }

  // Group connections by component
  const componentConnections = new Map<string, ComponentConnection[]>();
  for (const conn of connections) {
    if (!componentConnections.has(conn.componentId)) {
      componentConnections.set(conn.componentId, []);
    }
    componentConnections.get(conn.componentId)!.push(conn);
  }

  // NEW: Group components by port for consolidated listeners (like working example)
  const portBComponents: Array<{ element: HTMLElement; conn: ComponentConnection; type: string }> = [];
  const portCComponents: Array<{ element: HTMLElement; conn: ComponentConnection; type: string }> = [];
  const portDComponents: Array<{ element: HTMLElement; conn: ComponentConnection; type: string }> = [];

  // Collect all output components by port
  for (const [componentId, conns] of componentConnections) {
    const rendered = renderedComponents.get(componentId);
    if (!rendered) continue;

    const { element, componentInfo } = rendered;

    // Only consolidate output components (LEDs, buzzer)
    if (componentInfo.category === 'output') {
      const conn = conns.find(c => c.componentPin === 'A' || c.componentPin.startsWith('A') || 
                                   c.componentPin === '1' || c.componentPin === '2');
      if (conn) {
        const portComponents = conn.port === 'B' ? portBComponents : 
                              conn.port === 'C' ? portCComponents : portDComponents;
        portComponents.push({ element, conn, type: element.tagName.toLowerCase() });
      }
    }
  }

  // Connect consolidated port listeners (like working example)
  if (portBComponents.length > 0) {
    const portBListener = createConsolidatedPortListener(runner, 'B', portBComponents, cleanupFunctions);
    runner.portB.addListener(portBListener);
    cleanupFunctions.push(() => runner.portB.removeListener(portBListener));
    // Trigger initial state
    const initialPortB = runner.cpu.data[0x25] || 0;
    portBListener(initialPortB, initialPortB);
  }

  if (portCComponents.length > 0) {
    const portCListener = createConsolidatedPortListener(runner, 'C', portCComponents, cleanupFunctions);
    runner.portC.addListener(portCListener);
    cleanupFunctions.push(() => runner.portC.removeListener(portCListener));
    const initialPortC = runner.cpu.data[0x28] || 0;
    portCListener(initialPortC, initialPortC);
  }

  if (portDComponents.length > 0) {
    const portDListener = createConsolidatedPortListener(runner, 'D', portDComponents, cleanupFunctions);
    runner.portD.addListener(portDListener);
    cleanupFunctions.push(() => runner.portD.removeListener(portDListener));
    const initialPortD = runner.cpu.data[0x2b] || 0;
    portDListener(initialPortD, initialPortD);
  }

  // Connect other components (inputs, displays, special) individually
  for (const [componentId, conns] of componentConnections) {
    const rendered = renderedComponents.get(componentId);
    if (!rendered) continue;

    const { element, componentInfo } = rendered;

    // Skip output components (already handled by consolidated listeners)
    if (componentInfo.category === 'output') continue;

    // Connect based on component type
    switch (componentInfo.category) {
      case 'input':
        connectInputComponent(runner, element, conns, cleanupFunctions);
        break;
      case 'display':
        connectDisplayComponent(runner, element, conns, cleanupFunctions);
        break;
      case 'special':
        connectSpecialComponent(runner, element, componentId, conns, cleanupFunctions);
        break;
    }
  }

  return {
    cleanup: () => {
      cleanupFunctions.forEach((fn) => fn());
      // Cleanup buzzer audio
      if (buzzerAudio) {
        buzzerAudio.cleanup();
        buzzerAudio = null;
      }
    },
  };
}

/**
 * Creates a consolidated port listener (like working example)
 * Updates all components on a port in one callback
 */
function createConsolidatedPortListener(
  runner: AVRRunner,
  portName: 'B' | 'C' | 'D',
  components: Array<{ element: HTMLElement; conn: ComponentConnection; type: string }>,
  cleanupFunctions: (() => void)[]
): (value: number, oldValue: number) => void {
  const port = runner[`port${portName}` as 'portB' | 'portC' | 'portD'];
  
  return (value: number, oldValue: number) => {
    for (const { element, conn, type } of components) {
      const pinState = port.pinState(conn.bit);
      const isHigh = pinState === PinState.High;
      const bitMask = 1 << conn.bit;
      const bitChanged = (value & bitMask) !== ((oldValue || 0) & bitMask);

      if (type === 'wokwi-led') {
        const led = element as LEDElement;
        const oldLedValue = led.value;
        led.value = isHigh;
        if (bitChanged) {
          console.log(`[LED DEBUG] ${element.id} port ${portName} bit ${conn.bit} = ${isHigh ? 'HIGH' : 'LOW'}, LED: ${oldLedValue} → ${led.value}`);
        }
      } else if (type === 'wokwi-buzzer') {
        const buzzer = element as BuzzerElement;
        
        // Update visual indicator
        buzzer.hasSignal = isHigh;
        
        // Update audio
        if (buzzerAudio) {
          if (isHigh) {
            // Buzzer pin is HIGH - try to play tone
            // Extract frequency from Timer2 (used by tone() function)
            const frequency = buzzerAudio.getFrequencyFromTimer2(runner.cpu);
            
            if (frequency > 0 && frequency < 20000) {
              // Valid frequency range (20 Hz to 20 kHz)
              buzzerAudio.playTone(frequency);
              console.log(`[BUZZER DEBUG] ${element.id} port ${portName} bit ${conn.bit} = HIGH, playing ${frequency}Hz`);
            } else {
              // No valid frequency configured, use default beep
              buzzerAudio.playTone(440); // Default A4 note
              console.log(`[BUZZER DEBUG] ${element.id} port ${portName} bit ${conn.bit} = HIGH, playing default 440Hz`);
            }
          } else {
            // Buzzer pin is LOW - stop tone
            buzzerAudio.stopTone();
            console.log(`[BUZZER DEBUG] ${element.id} port ${portName} bit ${conn.bit} = LOW, stopped`);
          }
        }
      }
    }
  };
}

/**
 * Connects output components (LEDs, buzzer) to simulator
 * NOTE: This function is now mostly replaced by consolidated port listeners,
 * but kept for components that don't fit the consolidated pattern
 */
function connectOutputComponent(
  runner: AVRRunner,
  element: HTMLElement,
  connections: ComponentConnection[],
  cleanupFunctions: (() => void)[]
) {
  const elementType = element.tagName.toLowerCase();

  // Skip - these are now handled by consolidated listeners
  if (elementType === 'wokwi-led' || elementType === 'wokwi-buzzer') {
    console.log(`[SKIP] ${elementType} ${element.id} handled by consolidated port listener`);
    return;
  }

  if (false && elementType === 'wokwi-led') {
    const led = element as LEDElement;
    // Find the connection (LEDs typically connect pin A to Arduino)
    // Try different pin names: 'A', 'A.1', etc.
    const conn = connections.find((c) => 
      c.componentPin === 'A' || 
      c.componentPin.startsWith('A') ||
      c.componentPin.includes('A')
    );
    
    if (!conn) {
      console.warn(`LED ${element.id} has no connection found. Connections:`, connections);
      return;
    }

    const port = runner[`port${conn.port}` as 'portB' | 'portC' | 'portD'];
    if (!port) {
      console.warn(`Port ${conn.port} not found for LED ${element.id}`);
      return;
    }

    console.log(`[LED DEBUG] Connecting LED ${element.id}:`, {
      pinName: conn.componentPin,
      arduinoPin: conn.arduinoPin,
      port: conn.port,
      bit: conn.bit,
      portObj: port ? 'found' : 'missing'
    });

    // Use the same pattern as original: listener receives (value, oldValue)
    const listener = (value: number, oldValue: number) => {
      const pinState = port.pinState(conn.bit);
      const isHigh = pinState === PinState.High;
      const bitMask = 1 << conn.bit;
      const bitChanged = (value & bitMask) !== ((oldValue || 0) & bitMask);
      
      // Always update LED value
      const oldLedValue = led.value;
      led.value = isHigh;
      
      // Log when bit actually changes or on first call
      if (bitChanged || oldValue === undefined) {
        console.log(`[LED DEBUG] ${element.id} port ${conn.port} bit ${conn.bit} = ${isHigh ? 'HIGH' : 'LOW'}, LED: ${oldLedValue} → ${led.value}, port: 0x${(oldValue || 0).toString(16).padStart(2, '0')} → 0x${value.toString(16).padStart(2, '0')}`);
      }
    };

    port.addListener(listener);
    // Trigger initial state - get current port value
    const portRegister = (port as any).portConfig?.PORT;
    if (portRegister !== undefined) {
      const initialValue = runner.cpu.data[portRegister] || 0;
      listener(initialValue, initialValue); // Call with same value to trigger initial state
    } else {
      // Fallback: just check current state
      const pinState = port.pinState(conn.bit);
      led.value = pinState === PinState.High;
      console.log(`[LED DEBUG] ${element.id} initial state: ${pinState === PinState.High ? 'HIGH' : 'LOW'}`);
    }
    
    cleanupFunctions.push(() => {
      port.removeListener(listener);
      console.log(`[LED DEBUG] Cleaned up listener for ${element.id}`);
    });
    
    console.log(`Connecting LED ${element.id} to pin ${conn.arduinoPin} (${conn.port} bit ${conn.bit})`);
  } else if (elementType === 'wokwi-buzzer') {
    const buzzer = element as BuzzerElement;
    // Find the connection (buzzer typically connects to one pin)
    const conn = connections.find((c) => c.componentPin === '2' || c.componentPin === '1');
    
    if (!conn) {
      console.warn(`[BUZZER DEBUG] No connection found for buzzer ${element.id}`);
      return;
    }

    const port = runner[`port${conn.port}` as 'portB' | 'portC' | 'portD'];
    if (!port) {
      console.warn(`[BUZZER DEBUG] Port ${conn.port} not found for buzzer ${element.id}`);
      return;
    }

    console.log(`[BUZZER DEBUG] Connecting buzzer ${element.id}:`, {
      pinName: conn.componentPin,
      arduinoPin: conn.arduinoPin,
      port: conn.port,
      bit: conn.bit,
      hasStartTone: typeof (buzzer as any).startTone === 'function',
      hasStopTone: typeof (buzzer as any).stopTone === 'function'
    });

    let lastState = false;
    const listener = (value: number, oldValue: number) => {
      const currentState = port.pinState(conn.bit) === PinState.High;
      const bitMask = 1 << conn.bit;
      const bitChanged = (value & bitMask) !== ((oldValue || 0) & bitMask);
      
      if (currentState !== lastState || bitChanged) {
        // Buzzer API: startTone(frequency) - use 0 to stop, or frequency to start
        if (typeof (buzzer as any).startTone === 'function') {
          (buzzer as any).startTone(currentState ? 440 : 0); // 0 stops the tone
          console.log(`[BUZZER DEBUG] ${element.id} port ${conn.port} bit ${conn.bit} = ${currentState ? 'HIGH' : 'LOW'}, ${currentState ? 'started' : 'stopped'} tone, port: 0x${(oldValue || 0).toString(16).padStart(2, '0')} → 0x${value.toString(16).padStart(2, '0')}`);
        } else {
          console.warn(`[BUZZER DEBUG] ${element.id} startTone method not available`);
        }
        lastState = currentState;
      }
    };

    port.addListener(listener);
    listener(); // Initial state
    
    cleanupFunctions.push(() => {
      port.removeListener(listener);
      // Safe buzzer cleanup - use startTone(0) to stop
      if (buzzer && typeof (buzzer as any).startTone === 'function') {
        try {
          (buzzer as any).startTone(0); // 0 stops the tone
        } catch (e) {
          console.warn('Buzzer cleanup error:', e);
        }
      }
    });
  }
}

/**
 * Connects input components (buttons) to simulator
 */
function connectInputComponent(
  runner: AVRRunner,
  element: HTMLElement,
  connections: ComponentConnection[],
  cleanupFunctions: (() => void)[]
) {
  if (element.tagName.toLowerCase() !== 'wokwi-pushbutton') return;

  const button = element as PushbuttonElement;
  // Find the connection (buttons can connect via pin 1 or 2, with .l or .r suffixes)
  const conn = connections.find((c) => 
    c.componentPin === '1.l' || 
    c.componentPin === '2.r' || 
    c.componentPin === '1' ||
    c.componentPin === '2' ||
    c.componentPin.startsWith('1') || 
    c.componentPin.startsWith('2')
  );
  
  if (!conn) {
    console.warn(`Button ${element.id} has no connection found. Connections:`, connections);
    return;
  }

  const port = runner[`port${conn.port}` as 'portB' | 'portC' | 'portD'];
  if (!port) {
    console.warn(`Port ${conn.port} not found for button ${element.id}`);
    return;
  }

  console.log(`[BUTTON DEBUG] Connecting button ${element.id} to pin ${conn.arduinoPin} (${conn.port} bit ${conn.bit})`);

  const handlePress = () => {
    // Button pressed: set pin LOW (pull-up resistor, pressed = LOW)
    const oldState = port.pinState(conn.bit);
    port.setPin(conn.bit, false);
    console.log(`[BUTTON DEBUG] ${element.id} PRESSED - pin ${conn.arduinoPin} (${conn.port} bit ${conn.bit}) set to LOW (was ${oldState === PinState.High ? 'HIGH' : 'LOW'})`);
  };

  const handleRelease = () => {
    // Button released: set pin HIGH (pull-up resistor, released = HIGH)
    const oldState = port.pinState(conn.bit);
    port.setPin(conn.bit, true);
    console.log(`[BUTTON DEBUG] ${element.id} RELEASED - pin ${conn.arduinoPin} (${conn.port} bit ${conn.bit}) set to HIGH (was ${oldState === PinState.High ? 'HIGH' : 'LOW'})`);
  };

  button.addEventListener('button-press', handlePress);
  button.addEventListener('button-release', handleRelease);

  // Initialize button state (HIGH = not pressed)
  port.setPin(conn.bit, true);

  cleanupFunctions.push(() => {
    button.removeEventListener('button-press', handlePress);
    button.removeEventListener('button-release', handleRelease);
  });
}

/**
 * Connects display components (7-segment displays) to simulator
 */
function connectDisplayComponent(
  runner: AVRRunner,
  element: HTMLElement,
  connections: ComponentConnection[],
  cleanupFunctions: (() => void)[]
) {
  if (element.tagName.toLowerCase() !== 'wokwi-7segment') return;

  // 7-segment displays are typically controlled via shift registers
  // This is handled separately in connectSpecialComponent
  // For now, we'll handle direct connections if any
  console.log('7-segment display connection (may need shift register support):', element.id);
}

/**
 * Connects special components (shift registers, etc.) to simulator
 */
function connectSpecialComponent(
  runner: AVRRunner,
  element: HTMLElement,
  componentId: string,
  connections: ComponentConnection[],
  cleanupFunctions: (() => void)[]
) {
  // Shift register simulation will be handled separately
  // when we detect shift register components in the diagram
  console.log('Special component (may need custom simulation):', componentId);
}

/**
 * Connects shift register-controlled displays to simulator
 * This simulates 74HC595 shift registers that control 7-segment displays
 */
export function connectShiftRegisterDisplays(
  runner: AVRRunner,
  renderedComponents: Map<string, RenderedComponent>,
  dataPin: number, // A0 = PORTC bit 0
  clockPin: number, // A2 = PORTC bit 2
  latchPin: number // A1 = PORTC bit 1
): SimulatorConnections {
  const displays: SevenSegmentElement[] = [];
  
  // Find all 7-segment displays
  for (const rendered of renderedComponents.values()) {
    if (rendered.element.tagName.toLowerCase() === 'wokwi-7segment') {
      displays.push(rendered.element as SevenSegmentElement);
    }
  }

  if (displays.length === 0) {
    return { cleanup: () => {} };
  }

  // Shift register simulation state
  let shiftData: number[] = [];
  let lastClockState = false;
  let lastLatchState = false;

  const portC = runner.portC;
  if (!portC) {
    return { cleanup: () => {} };
  }

  const listener = () => {
    const dataState = portC.pinState(dataPin) === PinState.High ? 1 : 0;
    const clockState = portC.pinState(clockPin) === PinState.High;
    const latchState = portC.pinState(latchPin) === PinState.High;

    // Detect clock rising edge: shift in data bit
    if (clockState && !lastClockState) {
      shiftData.push(dataState);
      // Keep last 16 bits (for 2 bytes = 2 displays)
      if (shiftData.length > 16) {
        shiftData.shift();
      }
    }

    // Detect latch rising edge: update displays
    if (latchState && !lastLatchState && shiftData.length >= 16) {
      // Extract two bytes (LSB first, then MSB)
      const lowByte = parseInt(shiftData.slice(0, 8).reverse().join(''), 2);
      const highByte = parseInt(shiftData.slice(8, 16).reverse().join(''), 2);

      // Decode 7-segment patterns
      const digitTable: Record<number, number | null> = {
        0b11000000: 0,
        0b11111001: 1,
        0b10100100: 2,
        0b10110000: 3,
        0b10011001: 4,
        0b10010010: 5,
        0b10000010: 6,
        0b11111000: 7,
        0b10000000: 8,
        0b10010000: 9,
        0b10111111: null, // dash
      };

      const onesDigit = digitTable[lowByte] ?? null;
      const tensDigit = digitTable[highByte] ?? null;

      // Update displays (assuming first display is ones, second is tens)
      if (displays[0]) displays[0].value = onesDigit;
      if (displays[1]) displays[1].value = tensDigit;
    }

    lastClockState = clockState;
    lastLatchState = latchState;
  };

  portC.addListener(listener);

  return {
    cleanup: () => {
      portC.removeListener(listener);
    },
  };
}

