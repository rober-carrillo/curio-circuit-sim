# Curio Lab - Arduino Simulator Platform

## Overview

This is a web-based Arduino simulator platform built on top of **AVR8js** - a JavaScript implementation of the AVR 8-bit microcontroller architecture. The platform allows users to:

- **Edit Arduino code** using Monaco Editor (VS Code's editor)
- **Design circuits** by loading `diagram.json` files (Wokwi format)
- **Simulate hardware** in real-time with visual feedback
- **See connections** between components with accurate wire rendering
- **Hear audio** from buzzers and other audio components

## What We've Built

### Core Features

1. **Generic Diagram Renderer**
   - Parses Wokwi `diagram.json` format
   - Dynamically renders components (Arduino, LEDs, buttons, buzzers, displays)
   - Renders wires with accurate pin-to-pin connections
   - Supports Manhattan routing (straight lines, 90-degree turns)

2. **AVR8js Integration**
   - Full ATmega328P simulation (Arduino Uno)
   - Real-time CPU execution
   - I/O port monitoring (PORTB, PORTC, PORTD)
   - Timer simulation for PWM and `tone()`

3. **Component Simulation**
   - **LEDs**: Visual feedback based on pin states
   - **Pushbuttons**: Input handling with pull-up resistors
   - **Buzzer**: Web Audio API integration with frequency detection from Timer2
   - **7-Segment Displays**: Via shift register simulation (74HC595)
   - **Arduino Uno**: Full board visualization with accurate pin positions

4. **Code Compilation**
   - Integration with `hexi.wokwi.com` online compiler
   - Multi-file support (header inlining for `.h` files)
   - Real-time compilation feedback

5. **Serial Monitor**
   - Captures Serial.print() output
   - Real-time display of program output

### Technical Implementation

#### Pinout Data Extraction
- Extracted accurate pin coordinates from `wokwi-elements-source`
- Created `pinout-data-corrected.ts` with proper SVG viewBox coordinates
- Enables precise wire rendering to actual pin positions

#### Audio System
- `BuzzerAudioController` class using Web Audio API
- Reads Timer2 registers to extract frequency from Arduino's `tone()` function
- Plays square wave tones matching the programmed frequency

#### Component Registry
- Maps Wokwi component types to `@wokwi/elements` web components
- Handles unsupported components gracefully
- Supports dynamic component loading

#### Wire Rendering
- SVG-based wire rendering
- Manhattan routing (L-shaped paths)
- Color-coded wires (red=power, black=ground, green=signal)
- Real-time coordinate conversion from SVG to screen space

## Project Structure

```
avr8js/
├── demo/                          # Main application
│   ├── src/
│   │   ├── diagram/              # Circuit visualization
│   │   │   ├── parser.ts         # diagram.json parser
│   │   │   ├── component-renderer.ts  # Component rendering
│   │   │   ├── wire-renderer.ts  # Wire rendering
│   │   │   ├── pinout-data-corrected.ts  # Pin coordinates
│   │   │   ├── simulator-connector.ts   # AVR8js integration
│   │   │   └── buzzer-audio.ts   # Audio controller
│   │   ├── execute.ts            # AVRRunner class
│   │   ├── compile.ts            # Code compilation
│   │   └── generic-demo.ts       # Main application logic
│   ├── generic.html              # Main UI
│   └── vite.config.js            # Build configuration
├── src/                          # AVR8js library (core simulator)
│   ├── cpu/                      # CPU core
│   └── peripherals/              # Hardware peripherals
└── package.json                  # Dependencies
```

## How It Works

### 1. Loading a Project

1. **Load Diagram**: User clicks "Load diagram.json" → selects `diagram.json` file
   - Parser extracts components and connections
   - Components are rendered using `@wokwi/elements`
   - Wires are drawn using SVG paths

2. **Load Code**: User clicks "Load Code Files" → selects `.ino` and `.h` files
   - Header files are inlined into main `.ino` file
   - Code is displayed in Monaco Editor

3. **Run**: User clicks "Run" button
   - Code is sent to `hexi.wokwi.com` for compilation
   - Compiled hex is loaded into AVR8js CPU
   - Simulation starts executing
   - Components update in real-time based on pin states

### 2. Simulation Flow

```
Arduino Code → Compiler → Hex File → AVR8js CPU
                                         ↓
                              I/O Port Changes (PORTB/C/D)
                                         ↓
                              Component Listeners
                                         ↓
                    Visual Updates (LEDs, Displays, Audio)
```

### 3. Component Connection

- Each component has connections defined in `diagram.json`
- Connections are parsed to extract Arduino pin → component pin mappings
- Pin names are converted to port/bit pairs (e.g., "pin 9" → PORTB bit 1)
- Listeners are attached to AVR8js ports
- When port changes, components update their visual state

## Current Limitations

1. **Single-file compilation**: Header files must be inlined (compiler limitation)
2. **Limited components**: Only components in `@wokwi/elements` are supported
3. **No drag-and-drop**: Components are positioned from `diagram.json` only
4. **Shift registers**: 74HC595 simulation is basic (works for 7-segment displays)

## Future Enhancements

1. **Multi-file compilation**: Use Arduino CLI for proper library support
2. **Component dragging**: Allow users to reposition components
3. **More components**: Add support for more Wokwi components
4. **Cloud storage**: Save projects to Vercel Blob Storage
5. **User authentication**: Multi-user support with Vercel Postgres
6. **Tutor/Student system**: Role-based access for educational use

## Deployment

See `VERCEL_DEPLOYMENT_ANALYSIS.md` for detailed deployment information.

**Quick Summary:**
- **Size**: ~800 KB (gzipped) served to users
- **Compute**: 0 server CPU (static site), 5-10% client CPU
- **Cost**: $0/month (Free tier) for MVP
- **Bandwidth**: Supports ~80,000 users/month on free tier

## Development

### Running Locally

```bash
npm install
npm start
```

Open `http://localhost:3000/generic.html`

### Testing

1. **Simple Test Project**: `simple-test/` folder
   - Basic LED and buzzer functionality
   - Good for testing individual components

2. **Simon Game**: `simon-with-score/` folder
   - Full project with LEDs, buttons, buzzer, shift registers, 7-segment displays
   - Tests complex interactions

### Key Files to Modify

- **UI Layout**: `demo/generic.html` and `demo/src/generic-demo.ts`
- **Component Rendering**: `demo/src/diagram/component-renderer.ts`
- **Wire Rendering**: `demo/src/diagram/wire-renderer.ts`
- **Simulation Logic**: `demo/src/diagram/simulator-connector.ts`
- **Pinout Data**: `demo/src/diagram/pinout-data-corrected.ts`

## License

This project is built on top of **AVR8js** (MIT License) and uses **@wokwi/elements** (MIT License).

See `README.md` for the original AVR8js documentation.


