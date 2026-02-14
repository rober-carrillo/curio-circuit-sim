// SPDX-License-Identifier: MIT
// Generic demo that can render any Wokwi diagram.json file

import '@wokwi/elements';
import { buildHex } from './compile';
import { CPUPerformance } from './cpu-performance';
import { AVRRunner } from './execute';
import { formatTime } from './format-time';
import './index.css';

import { parseDiagram } from './diagram/parser';
import { extractComponentConnections } from './diagram/pin-mapper';
import { renderComponents } from './diagram/component-renderer';
import { renderWires } from './diagram/wire-renderer';
import {
  connectComponentsToSimulator,
  connectShiftRegisterDisplays,
} from './diagram/simulator-connector';
import { buildPinoutsFromDiagram } from './diagram/pin-extractor';
import {
  saveProject,
  loadProject,
  listSavedProjects,
  deleteProject,
  downloadProject,
  type ProjectData,
} from './project-persistence';

let editor: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let runner: AVRRunner | null = null;
let simulatorConnections: { cleanup: () => void } | null = null;
let editorReady = false;

// Load Editor
declare const window: any; // eslint-disable-line @typescript-eslint/no-explicit-any
declare const monaco: any; // eslint-disable-line @typescript-eslint/no-explicit-any
window.require.config({
  paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' },
});

window.require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create(document.querySelector('.code-editor'), {
    value:
      '// Load a diagram.json file to see components rendered here\n// Then paste your Arduino code here or load code files\n\n// Simple test code (uncomment to test):\n// void setup() {\n//   pinMode(9, OUTPUT);\n//   pinMode(10, OUTPUT);\n//   pinMode(11, OUTPUT);\n//   pinMode(12, OUTPUT);\n// }\n// void loop() {\n//   digitalWrite(9, HIGH);\n//   delay(500);\n//   digitalWrite(9, LOW);\n//   digitalWrite(10, HIGH);\n//   delay(500);\n//   digitalWrite(10, LOW);\n//   digitalWrite(11, HIGH);\n//   delay(500);\n//   digitalWrite(11, LOW);\n//   digitalWrite(12, HIGH);\n//   delay(500);\n//   digitalWrite(12, LOW);\n// }',
    language: 'cpp',
    minimap: { enabled: false },
  });
  editorReady = true;
  // If URL has userId & projectId, load from API; otherwise try default diagram
  tryLoadFromApi().then((loadedFromApi) => {
    if (!loadedFromApi) tryLoadDiagram();
  });
});

// UI Elements
const runButton = document.querySelector('#run-button');
const stopButton = document.querySelector('#stop-button');
const loadDiagramButton = document.querySelector('#load-diagram-button');
const loadCodeButton = document.querySelector('#load-code-button');
const saveProjectButton = document.querySelector('#save-project-button') as HTMLButtonElement;
const loadSavedButton = document.querySelector('#load-saved-button');
const downloadProjectButton = document.querySelector(
  '#download-project-button',
) as HTMLButtonElement;
const statusLabel = document.querySelector('#status-label');
const compilerOutputText = document.querySelector('#compiler-output-text');
const serialOutputText = document.querySelector('#serial-output-text');
const componentsContainer = document.querySelector('#components-container') as HTMLElement;

let currentDiagram: any = null;
let renderedComponents: Map<string, any> = new Map();
let currentProjectId: string | null = null; // Track current project for saving
let currentUserId: string | null = null; // When set, we are in API mode (load/save from API)

const API_BASE = typeof window !== 'undefined' ? (window as any).SIMULATOR_API_BASE || '/api' : '/api';

// Event Listeners
runButton?.addEventListener('click', compileAndRun);
stopButton?.addEventListener('click', stopCode);
loadDiagramButton?.addEventListener('click', loadDiagramFile);
loadCodeButton?.addEventListener('click', loadCodeFiles);
saveProjectButton?.addEventListener('click', handleSaveProject);
loadSavedButton?.addEventListener('click', handleLoadSaved);
downloadProjectButton?.addEventListener('click', handleDownloadProject);

// Static projects (diagram + code paths). Default is simple-test.
const STATIC_PROJECTS: Record<string, { diagram: string; code: string }> = {
  'simple-test': {
    diagram: '/projects/simple-test/diagram.json',
    code: '/projects/simple-test/simple-test.ino',
  },
  'simon-with-score': {
    diagram: '/projects/simon-with-score/diagram.json',
    code: '/projects/simon-with-score/simon-with-score.ino',
  },
};

const DEFAULT_STATIC_PROJECT = 'simple-test';

function applyDiagramAndCode(diagram: any, code: string) {
  if (!diagram) return;
  currentDiagram = diagram;
  buildPinoutsFromDiagram(diagram.connections || [], diagram.parts || []);
  if (componentsContainer) {
    renderedComponents = renderComponents(
      diagram.parts || [],
      componentsContainer,
      diagram.connections || [],
    );
    requestAnimationFrame(() => {
      setTimeout(() => {
        const existingSvg = componentsContainer.querySelector('svg');
        if (existingSvg) existingSvg.remove();
        const svg = renderWires(
          diagram.connections || [],
          diagram.parts || [],
          renderedComponents,
          componentsContainer,
        );
        componentsContainer.appendChild(svg);
      }, 100);
    });
    statusLabel.textContent = `Loaded diagram: ${(diagram.parts || []).length} components`;
    enableProjectButtons();
  }
  if (editor && editorReady && code) {
    editor.setValue(code);
  }
}

// Load a static project by id (from URL ?project= or default). Fails gracefully.
async function tryLoadStaticProject(projectId: string): Promise<boolean> {
  const paths = STATIC_PROJECTS[projectId];
  if (!paths) return false;
  try {
    const [diagramRes, codeRes] = await Promise.all([
      fetch(paths.diagram),
      fetch(paths.code),
    ]);
    if (!diagramRes.ok) return false;
    const diagram = parseDiagram(await diagramRes.text());
    const code = codeRes.ok ? await codeRes.text() : '';
    applyDiagramAndCode(diagram, code);
    return true;
  } catch {
    return false;
  }
}

// Try to load diagram/code: default simple-test, or ?project=simon-with-score
async function tryLoadDiagram() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const projectId = params.get('project') || DEFAULT_STATIC_PROJECT;
  await tryLoadStaticProject(projectId);
}

/**
 * If URL has ?userId= & projectId=, load project from API and return true; else return false.
 */
async function tryLoadFromApi(): Promise<boolean> {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const userId = params.get('userId');
  const projectId = params.get('projectId');
  if (!userId || !projectId) return false;

  try {
    const [diagramRes, codeRes] = await Promise.all([
      fetch(`${API_BASE}/projects/${encodeURIComponent(userId)}/${encodeURIComponent(projectId)}/diagram`),
      fetch(`${API_BASE}/projects/${encodeURIComponent(userId)}/${encodeURIComponent(projectId)}/code`),
    ]);

    let diagram: any = null;
    let code = '';
    if (diagramRes.ok) {
      const data = await diagramRes.json();
      diagram = data;
    }
    if (codeRes.ok) {
      code = await codeRes.text();
    }
    if (!diagram && !code) {
      console.warn('[API] No diagram or code found for project');
      return false;
    }

    currentUserId = userId;
    currentProjectId = projectId;

    if (diagram) {
      currentDiagram = diagram;
      buildPinoutsFromDiagram(diagram.connections || [], diagram.parts || []);
      if (componentsContainer) {
        renderedComponents = renderComponents(
          diagram.parts || [],
          componentsContainer,
          diagram.connections || [],
        );
        requestAnimationFrame(() => {
          setTimeout(() => {
            const existingSvg = componentsContainer.querySelector('svg');
            if (existingSvg) existingSvg.remove();
            const svg = renderWires(
              diagram.connections || [],
              diagram.parts || [],
              renderedComponents,
              componentsContainer,
            );
            componentsContainer.appendChild(svg);
          }, 100);
        });
        statusLabel.textContent = `Loaded from cloud: ${projectId}`;
        enableProjectButtons();
      }
    }
    if (editor && editorReady) {
      editor.setValue(code || '// No code saved yet');
    }
    return true;
  } catch (err) {
    console.error('[API] Failed to load project:', err);
    return false;
  }
}

/**
 * Save current diagram and code to the project API (when in API mode).
 */
async function saveToApi(userId: string, projectId: string, diagram: any, code: string): Promise<void> {
  const diagramRes = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(userId)}/${encodeURIComponent(projectId)}/diagram`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(diagram) },
  );
  const codeRes = await fetch(
    `${API_BASE}/projects/${encodeURIComponent(userId)}/${encodeURIComponent(projectId)}/code`,
    { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: code },
  );
  if (!diagramRes.ok) throw new Error(`Diagram save failed: ${diagramRes.status}`);
  if (!codeRes.ok) throw new Error(`Code save failed: ${codeRes.status}`);
}

/**
 * Loads a diagram.json file
 */
async function loadDiagramFile() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none'; // Hide the input
    document.body.appendChild(input); // Add to DOM (required for some browsers)

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input); // Clean up
        return;
      }

      try {
        const text = await file.text();
        const diagram = parseDiagram(text);
        currentDiagram = diagram;

        // Extract pin names from connections and build pinouts
        console.log('[DIAGRAM] Building pinouts from connections...');
        buildPinoutsFromDiagram(diagram.connections, diagram.parts);

        // Render components
        if (componentsContainer) {
          // Render all parts including Arduino
          renderedComponents = renderComponents(
            diagram.parts, // Use all parts directly
            componentsContainer,
            diagram.connections,
          );

          console.log('Rendered components:', Array.from(renderedComponents.keys()));

          // Render wires after components are positioned (use setTimeout to ensure DOM is ready)
          setTimeout(() => {
            // Remove any existing wire SVG
            const existingSvg = componentsContainer.querySelector('svg');
            if (existingSvg) existingSvg.remove();

            console.log('Rendering wires for', diagram.connections.length, 'connections');
            const svg = renderWires(
              diagram.connections,
              diagram.parts,
              renderedComponents,
              componentsContainer,
            );
            componentsContainer.appendChild(svg);
            console.log('Wires rendered, SVG has', svg.children.length, 'paths');
          }, 200); // Increased delay to ensure all components are rendered

          statusLabel.textContent = `Loaded ${renderedComponents.size} components`;
          enableProjectButtons();
        }
      } catch (err) {
        alert('Failed to load diagram: ' + err);
        console.error(err);
      } finally {
        document.body.removeChild(input); // Clean up
      }
    };

    // Trigger file dialog
    input.click();
  } catch (err) {
    console.error('Error opening file dialog:', err);
    alert('Error opening file dialog. Please check the browser console.');
  }
}

/**
 * Loads code files (.ino and .h files)
 */
async function loadCodeFiles() {
  if (!editorReady || !editor) {
    alert('Editor not ready yet, please wait...');
    return;
  }

  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ino,.h,.cpp,.c';
    input.multiple = true;
    input.style.display = 'none'; // Hide the input
    document.body.appendChild(input); // Add to DOM (required for some browsers)

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) {
        document.body.removeChild(input); // Clean up if no files selected
        return;
      }

      try {
        // Get current editor content (might already have .ino code)
        let mainCode = editor.getModel().getValue();
        const headerFiles: { name: string; content: string }[] = [];

        // Read all files
        for (const file of files) {
          const text = await file.text();
          if (
            file.name.endsWith('.ino') ||
            file.name.endsWith('.cpp') ||
            file.name.endsWith('.c')
          ) {
            mainCode = text; // Replace with new main file
          } else if (file.name.endsWith('.h')) {
            headerFiles.push({ name: file.name, content: text });
          }
        }

        // If no main file but we have headers, use current editor content
        const hasMainFile = files.some(
          (f) => f.name.endsWith('.ino') || f.name.endsWith('.cpp') || f.name.endsWith('.c'),
        );

        if (!hasMainFile && mainCode.trim() === '') {
          alert(
            'Please select at least one .ino, .cpp, or .c file, or paste code in the editor first',
          );
          return;
        }

        // Replace includes with actual content
        if (mainCode) {
          for (const header of headerFiles) {
            // Match: #include "pitches.h" or #include <pitches.h>
            const headerName = header.name.replace('.h', '');
            const patterns = [
              new RegExp(`#include\\s+"${headerName}\\.h"`, 'g'),
              new RegExp(`#include\\s+<${headerName}\\.h>`, 'g'),
              new RegExp(`#include\\s+"${headerName}"`, 'g'),
              new RegExp(`#include\\s+<${headerName}>`, 'g'),
            ];

            let replaced = false;
            for (const pattern of patterns) {
              if (pattern.test(mainCode)) {
                mainCode = mainCode.replace(pattern, header.content);
                console.log(`Replaced #include for ${header.name} with content`);
                replaced = true;
                break;
              }
            }

            // If no include found but we have a header, prepend it (for manual pasting)
            if (!replaced && headerFiles.length > 0 && !hasMainFile) {
              mainCode = header.content + '\n\n' + mainCode;
              console.log(`Prepended ${header.name} to existing code`);
            }
          }
          editor.setValue(mainCode);
          statusLabel.textContent = `Loaded ${files.length} code file(s)`;
        }
      } catch (err) {
        alert('Failed to load code files: ' + err);
        console.error(err);
      } finally {
        document.body.removeChild(input); // Clean up
      }
    };

    // Trigger file dialog
    input.click();
  } catch (err) {
    console.error('Error opening file dialog:', err);
    alert('Error opening file dialog. Please check the browser console.');
  }
}

/**
 * Compiles and runs the code
 */
async function compileAndRun() {
  if (!currentDiagram) {
    alert('Please load a diagram.json file first');
    return;
  }

  // Clean up previous run
  if (simulatorConnections) {
    simulatorConnections.cleanup();
    simulatorConnections = null;
  }
  if (runner) {
    runner.stop();
    runner = null;
  }

  // Reset components
  for (const rendered of renderedComponents.values()) {
    if (rendered.element.tagName.toLowerCase() === 'wokwi-led') {
      (rendered.element as any).value = false;
    }
  }

  runButton.setAttribute('disabled', '1');
  loadDiagramButton.setAttribute('disabled', '1');

  serialOutputText.textContent = '';
  try {
    statusLabel.textContent = 'Compiling...';
    const code = editor.getModel().getValue();
    const result = await buildHex(code);
    compilerOutputText.textContent = result.stderr || result.stdout;

    if (result.hex) {
      compilerOutputText.textContent += '\nProgram running...';
      stopButton.removeAttribute('disabled');

      // Create runner
      runner = new AVRRunner(result.hex);
      const MHZ = 16000000;

      console.log('[COMPILE DEBUG] Hex loaded, program size:', result.hex.length, 'bytes');
      console.log('[COMPILE DEBUG] CPU cycles at start:', runner.cpu.cycles);

      // Log initial port states
      const logPortStates = () => {
        const portB = runner.cpu.data[0x25] || 0; // PORTB register
        const portC = runner.cpu.data[0x28] || 0; // PORTC register
        const portD = runner.cpu.data[0x2b] || 0; // PORTD register
        const ddrB = runner.cpu.data[0x24] || 0; // DDRB register
        const ddrC = runner.cpu.data[0x27] || 0; // DDRC register
        const ddrD = runner.cpu.data[0x2a] || 0; // DDRD register

        return {
          PORTB: `0x${portB.toString(16).padStart(2, '0')}`,
          PORTC: `0x${portC.toString(16).padStart(2, '0')}`,
          PORTD: `0x${portD.toString(16).padStart(2, '0')}`,
          DDRB: `0x${ddrB.toString(16).padStart(2, '0')}`,
          DDRC: `0x${ddrC.toString(16).padStart(2, '0')}`,
          DDRD: `0x${ddrD.toString(16).padStart(2, '0')}`,
        };
      };

      console.log('[PORT DEBUG] Initial port states:', logPortStates());

      // Track port changes
      let lastPortB = runner.cpu.data[0x25] || 0;
      let lastPortC = runner.cpu.data[0x28] || 0;
      let lastPortD = runner.cpu.data[0x2b] || 0;

      // Add listeners to track port changes
      runner.portB.addListener((value, oldValue) => {
        if (value !== lastPortB) {
          console.log(
            `[PORT DEBUG] PORTB changed: 0x${lastPortB.toString(16).padStart(2, '0')} → 0x${value.toString(16).padStart(2, '0')} (cycles: ${runner.cpu.cycles})`,
          );
          lastPortB = value;
        }
      });

      runner.portC.addListener((value, oldValue) => {
        if (value !== lastPortC) {
          console.log(
            `[PORT DEBUG] PORTC changed: 0x${lastPortC.toString(16).padStart(2, '0')} → 0x${value.toString(16).padStart(2, '0')} (cycles: ${runner.cpu.cycles})`,
          );
          lastPortC = value;
        }
      });

      runner.portD.addListener((value, oldValue) => {
        if (value !== lastPortD) {
          console.log(
            `[PORT DEBUG] PORTD changed: 0x${lastPortD.toString(16).padStart(2, '0')} → 0x${value.toString(16).padStart(2, '0')} (cycles: ${runner.cpu.cycles})`,
          );
          lastPortD = value;
        }
      });

      // Extract connections
      const connections = extractComponentConnections(currentDiagram.connections);
      console.log('Extracted connections:', connections);
      console.log('Rendered components:', Array.from(renderedComponents.keys()));

      // Connect components to simulator
      simulatorConnections = connectComponentsToSimulator(runner, renderedComponents, connections);

      // Test: Manually trigger port change to verify listeners work (REMOVED - was just for testing)
      // Removed the manual test - we want to see actual code execution

      // Check for shift register (74HC595) - Simon game uses A0, A1, A2
      const hasShiftRegister = currentDiagram.parts.some((p: any) => p.type === 'wokwi-74hc595');
      if (hasShiftRegister) {
        const shiftConn = connectShiftRegisterDisplays(runner, renderedComponents, 0, 2, 1);
        // Combine cleanup
        const originalCleanup = simulatorConnections.cleanup;
        simulatorConnections.cleanup = () => {
          originalCleanup();
          shiftConn.cleanup();
        };
      }

      // Serial output
      runner.usart.onByteTransmit = (value) => {
        serialOutputText.textContent += String.fromCharCode(value);
      };

      // Performance monitoring
      const cpuPerf = new CPUPerformance(runner.cpu, MHZ);

      // Create a shared object to track running state
      const simulationState = { isRunning: true };

      console.log('Starting simulation...');
      console.log('[SIM DEBUG] Initial port states:', logPortStates());

      let lastCycleCount = 0;
      let cycleCheckInterval = 0;

      runner.execute((cpu) => {
        if (!simulationState.isRunning) {
          // Stop the execution loop
          return;
        }

        const time = formatTime(cpu.cycles / MHZ);
        const speed = (cpuPerf.update() * 100).toFixed(0);
        statusLabel.textContent = `Simulation time: ${time} (${speed}%)`;

        // Verify CPU is executing (cycles should increase)
        const cyclesDelta = cpu.cycles - lastCycleCount;
        if (cyclesDelta === 0 && cycleCheckInterval++ > 100) {
          console.warn('[CPU DEBUG] WARNING: CPU cycles not increasing! CPU may be stuck.');
          cycleCheckInterval = 0;
        } else if (cyclesDelta > 0) {
          lastCycleCount = cpu.cycles;
          cycleCheckInterval = 0;
        }

        // Log port changes every 100ms for debugging
        if (cpu.cycles % (MHZ / 10) < 50000) {
          // Roughly every 100ms
          const currentStates = logPortStates();
          console.log(`[SIM DEBUG] Cycles: ${cpu.cycles.toLocaleString()}, States:`, currentStates);
        }
      });

      // Store the simulation state on the runner so stopCode can access it
      (runner as any).simulationState = simulationState;

      console.log('Simulation started, runner cycles:', runner.cpu.cycles);
    } else {
      runButton.removeAttribute('disabled');
    }
  } catch (err) {
    runButton.removeAttribute('disabled');
    loadDiagramButton.removeAttribute('disabled');
    alert('Failed: ' + err);
  } finally {
    if (!runner) {
      statusLabel.textContent = '';
    }
  }
}

function stopCode() {
  stopButton.setAttribute('disabled', '1');
  runButton.removeAttribute('disabled');
  loadDiagramButton.removeAttribute('disabled');

  if (simulatorConnections) {
    simulatorConnections.cleanup();
    simulatorConnections = null;
  }

  if (runner) {
    // Stop status updates first
    const simState = (runner as any).simulationState;
    if (simState) {
      simState.isRunning = false;
      console.log('Stopped simulation updates');
    }

    // Stop the runner
    runner.stop();
    runner = null;
  }

  statusLabel.textContent = 'Stopped';
}

/**
 * Save current project to localStorage or to API (when opened with userId/projectId).
 */
async function handleSaveProject() {
  if (!currentDiagram || !editor) {
    alert('No project to save. Please load a diagram and code first.');
    return;
  }

  if (currentUserId && currentProjectId) {
    try {
      statusLabel.textContent = 'Saving to cloud...';
      await saveToApi(currentUserId, currentProjectId, currentDiagram, editor.getValue());
      statusLabel.textContent = `Saved to cloud: ${currentProjectId}`;
      alert('Project saved to cloud.');
    } catch (err) {
      console.error('[API] Save failed:', err);
      alert('Failed to save to cloud: ' + (err instanceof Error ? err.message : err));
    }
    return;
  }

  const projectName = prompt('Enter a name for this project:', currentProjectId || 'my-project');
  if (!projectName) return;

  const projectData: ProjectData = {
    id: currentProjectId || projectName.toLowerCase().replace(/\s+/g, '-'),
    name: projectName,
    diagram: currentDiagram,
    code: editor.getValue(),
    lastModified: Date.now(),
  };

  saveProject(projectData);
  currentProjectId = projectData.id;
  alert(`Project "${projectName}" saved successfully!`);
  statusLabel.textContent = `Saved: ${projectName}`;
}

/**
 * Show modal with saved projects
 */
function handleLoadSaved() {
  const modal = document.getElementById('saved-projects-modal');
  const projectList = document.getElementById('project-list');
  const closeBtn = document.getElementById('modal-close');

  if (!modal || !projectList) return;

  // Get saved projects
  const projects = listSavedProjects();

  // Clear existing list
  projectList.innerHTML = '';

  if (projects.length === 0) {
    projectList.innerHTML =
      '<li style="padding: 20px; text-align: center; color: #999;">No saved projects yet</li>';
  } else {
    // Sort by last modified (newest first)
    projects.sort((a, b) => b.lastModified - a.lastModified);

    projects.forEach((proj) => {
      const li = document.createElement('li');
      li.className = 'project-item';

      const date = new Date(proj.lastModified).toLocaleString();

      li.innerHTML = `
        <div class="project-info" data-id="${proj.id}">
          <div class="project-name">${proj.name}</div>
          <div class="project-date">Last modified: ${date}</div>
        </div>
        <div class="project-actions">
          <button class="load-btn" data-id="${proj.id}">Load</button>
          <button class="delete-btn" data-id="${proj.id}" style="background: #f44336; color: white;">Delete</button>
        </div>
      `;

      projectList.appendChild(li);
    });

    // Add event listeners for load/delete buttons
    projectList.querySelectorAll('.load-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = (e.target as HTMLElement).getAttribute('data-id');
        if (projectId) {
          loadSavedProject(projectId);
          modal.style.display = 'none';
        }
      });
    });

    projectList.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = (e.target as HTMLElement).getAttribute('data-id');
        if (projectId && confirm('Are you sure you want to delete this project?')) {
          deleteProject(projectId);
          handleLoadSaved(); // Refresh the list
        }
      });
    });

    // Also allow clicking the project info to load
    projectList.querySelectorAll('.project-info').forEach((div) => {
      div.addEventListener('click', () => {
        const projectId = div.getAttribute('data-id');
        if (projectId) {
          loadSavedProject(projectId);
          modal.style.display = 'none';
        }
      });
    });
  }

  // Show modal
  modal.style.display = 'block';

  // Close button
  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Load a saved project from localStorage
 */
async function loadSavedProject(projectId: string) {
  const project = loadProject(projectId);
  if (!project) {
    alert('Failed to load project');
    return;
  }

  // Load diagram
  currentDiagram = project.diagram;
  currentProjectId = project.id;

  // Extract pin names from connections and build pinouts
  console.log('[DIAGRAM] Building pinouts from connections...');
  buildPinoutsFromDiagram(project.diagram.connections, project.diagram.parts);

  // Render components
  if (componentsContainer) {
    renderedComponents = renderComponents(
      project.diagram.parts,
      componentsContainer,
      project.diagram.connections,
    );

    console.log('Rendered components:', Array.from(renderedComponents.keys()));

    // Render wires after components are positioned
    setTimeout(() => {
      const existingSvg = componentsContainer.querySelector('svg');
      if (existingSvg) existingSvg.remove();

      console.log('Rendering wires for', project.diagram.connections.length, 'connections');
      const svg = renderWires(
        project.diagram.connections,
        project.diagram.parts,
        renderedComponents,
        componentsContainer,
      );
      componentsContainer.appendChild(svg);
      console.log('Wires rendered, SVG has', svg.children.length, 'paths');
    }, 200);

    statusLabel.textContent = `Loaded: ${project.name}`;
  }

  // Load code into editor
  if (editor && editorReady) {
    editor.setValue(project.code);
  }

  // Enable save/download buttons
  saveProjectButton.removeAttribute('disabled');
  downloadProjectButton.removeAttribute('disabled');

  console.log(`[PERSISTENCE] Loaded project: ${project.name}`);
}

/**
 * Download current project as files
 */
function handleDownloadProject() {
  if (!currentDiagram || !editor) {
    alert('No project to download. Please load a diagram and code first.');
    return;
  }

  const projectData: ProjectData = {
    id: currentProjectId || 'project',
    name: currentProjectId || 'project',
    diagram: currentDiagram,
    code: editor.getValue(),
    lastModified: Date.now(),
  };

  downloadProject(projectData);
  statusLabel.textContent = 'Project downloaded';
}

// Enable save/download buttons when diagram is loaded
function enableProjectButtons() {
  if (currentDiagram) {
    saveProjectButton?.removeAttribute('disabled');
    downloadProjectButton?.removeAttribute('disabled');
  }
}
