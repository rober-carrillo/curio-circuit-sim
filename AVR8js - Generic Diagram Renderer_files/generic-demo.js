import "/@fs/Users/engineering1/Desktop/projects/curio-lab/simulator/avr8js/node_modules/.vite/deps/@wokwi_elements.js?v=a664c800";
import { buildHex } from "/src/compile.ts";
import { CPUPerformance } from "/src/cpu-performance.ts";
import { AVRRunner } from "/src/execute.ts";
import { formatTime } from "/src/format-time.ts";
import "/src/index.css";
import { parseDiagram, getComponents } from "/src/diagram/parser.ts";
import { extractComponentConnections } from "/src/diagram/pin-mapper.ts?t=1766713736045";
import { renderComponents } from "/src/diagram/component-renderer.ts?t=1766716087644";
import { renderWires } from "/src/diagram/wire-renderer.ts?t=1766716087644";
import { connectComponentsToSimulator, connectShiftRegisterDisplays } from "/src/diagram/simulator-connector.ts?t=1766713736045";
let editor;
let runner = null;
let simulatorConnections = null;
let editorReady = false;
window.require.config({
  paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs" }
});
window.require(["vs/editor/editor.main"], () => {
  editor = monaco.editor.create(document.querySelector(".code-editor"), {
    value: "// Load a diagram.json file to see components rendered here\n// Then paste your Arduino code here or load code files",
    language: "cpp",
    minimap: { enabled: false }
  });
  editorReady = true;
  tryLoadDiagram();
});
const runButton = document.querySelector("#run-button");
const stopButton = document.querySelector("#stop-button");
const loadDiagramButton = document.querySelector("#load-diagram-button");
const loadCodeButton = document.querySelector("#load-code-button");
const statusLabel = document.querySelector("#status-label");
const compilerOutputText = document.querySelector("#compiler-output-text");
const serialOutputText = document.querySelector("#serial-output-text");
const componentsContainer = document.querySelector("#components-container");
let currentDiagram = null;
let renderedComponents = /* @__PURE__ */ new Map();
runButton?.addEventListener("click", compileAndRun);
stopButton?.addEventListener("click", stopCode);
loadDiagramButton?.addEventListener("click", loadDiagramFile);
loadCodeButton?.addEventListener("click", loadCodeFiles);
async function tryLoadDiagram() {
  try {
    const response = await fetch("../simon-with-score/diagram.json");
    if (response.ok) {
      const text = await response.text();
      const diagram = parseDiagram(text);
      currentDiagram = diagram;
      if (componentsContainer) {
        renderedComponents = renderComponents(getComponents(diagram.parts), componentsContainer);
        statusLabel.textContent = `Loaded diagram: ${renderedComponents.size} components`;
      }
    }
  } catch (err) {
  }
}
async function loadDiagramFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const diagram = parseDiagram(text);
      currentDiagram = diagram;
      if (componentsContainer) {
        renderedComponents = renderComponents(
          getComponents(diagram.parts),
          componentsContainer,
          diagram.connections
        );
        setTimeout(() => {
          const existingSvg = componentsContainer.querySelector("svg");
          if (existingSvg) existingSvg.remove();
          const svg = renderWires(
            diagram.connections,
            diagram.parts,
            renderedComponents,
            componentsContainer
          );
          componentsContainer.appendChild(svg);
        }, 100);
        statusLabel.textContent = `Loaded ${renderedComponents.size} components`;
      }
    } catch (err) {
      alert("Failed to load diagram: " + err);
    }
  };
  input.click();
}
async function loadCodeFiles() {
  if (!editorReady || !editor) {
    alert("Editor not ready yet, please wait...");
    return;
  }
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".ino,.h,.cpp,.c";
  input.multiple = true;
  input.onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      let mainCode = editor.getModel().getValue();
      const headerFiles = [];
      for (const file of files) {
        const text = await file.text();
        if (file.name.endsWith(".ino") || file.name.endsWith(".cpp") || file.name.endsWith(".c")) {
          mainCode = text;
        } else if (file.name.endsWith(".h")) {
          headerFiles.push({ name: file.name, content: text });
        }
      }
      const hasMainFile = files.some((f) => f.name.endsWith(".ino") || f.name.endsWith(".cpp") || f.name.endsWith(".c"));
      if (!hasMainFile && mainCode.trim() === "") {
        alert("Please select at least one .ino, .cpp, or .c file, or paste code in the editor first");
        return;
      }
      if (mainCode) {
        for (const header of headerFiles) {
          const headerName = header.name.replace(".h", "");
          const patterns = [
            new RegExp(`#include\\s+"${headerName}\\.h"`, "g"),
            new RegExp(`#include\\s+<${headerName}\\.h>`, "g"),
            new RegExp(`#include\\s+"${headerName}"`, "g"),
            new RegExp(`#include\\s+<${headerName}>`, "g")
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
          if (!replaced && headerFiles.length > 0 && !hasMainFile) {
            mainCode = header.content + "\n\n" + mainCode;
            console.log(`Prepended ${header.name} to existing code`);
          }
        }
        editor.setValue(mainCode);
        statusLabel.textContent = `Loaded ${files.length} code file(s)`;
      }
    } catch (err) {
      alert("Failed to load code files: " + err);
      console.error(err);
    }
  };
  input.click();
}
async function compileAndRun() {
  if (!currentDiagram) {
    alert("Please load a diagram.json file first");
    return;
  }
  if (simulatorConnections) {
    simulatorConnections.cleanup();
    simulatorConnections = null;
  }
  if (runner) {
    runner.stop();
    runner = null;
  }
  for (const rendered of renderedComponents.values()) {
    if (rendered.element.tagName.toLowerCase() === "wokwi-led") {
      rendered.element.value = false;
    }
  }
  runButton.setAttribute("disabled", "1");
  loadDiagramButton.setAttribute("disabled", "1");
  serialOutputText.textContent = "";
  try {
    statusLabel.textContent = "Compiling...";
    const code = editor.getModel().getValue();
    const result = await buildHex(code);
    compilerOutputText.textContent = result.stderr || result.stdout;
    if (result.hex) {
      compilerOutputText.textContent += "\nProgram running...";
      stopButton.removeAttribute("disabled");
      runner = new AVRRunner(result.hex);
      const MHZ = 16e6;
      const connections = extractComponentConnections(currentDiagram.connections);
      console.log("Extracted connections:", connections);
      console.log("Rendered components:", Array.from(renderedComponents.keys()));
      simulatorConnections = connectComponentsToSimulator(
        runner,
        renderedComponents,
        connections
      );
      const hasShiftRegister = currentDiagram.parts.some(
        (p) => p.type === "wokwi-74hc595"
      );
      if (hasShiftRegister) {
        const shiftConn = connectShiftRegisterDisplays(runner, renderedComponents, 0, 2, 1);
        const originalCleanup = simulatorConnections.cleanup;
        simulatorConnections.cleanup = () => {
          originalCleanup();
          shiftConn.cleanup();
        };
      }
      runner.usart.onByteTransmit = (value) => {
        serialOutputText.textContent += String.fromCharCode(value);
      };
      const cpuPerf = new CPUPerformance(runner.cpu, MHZ);
      runner.execute((cpu) => {
        const time = formatTime(cpu.cycles / MHZ);
        const speed = (cpuPerf.update() * 100).toFixed(0);
        statusLabel.textContent = `Simulation time: ${time} (${speed}%)`;
      });
    } else {
      runButton.removeAttribute("disabled");
    }
  } catch (err) {
    runButton.removeAttribute("disabled");
    loadDiagramButton.removeAttribute("disabled");
    alert("Failed: " + err);
  } finally {
    if (!runner) {
      statusLabel.textContent = "";
    }
  }
}
function stopCode() {
  stopButton.setAttribute("disabled", "1");
  runButton.removeAttribute("disabled");
  loadDiagramButton.removeAttribute("disabled");
  if (simulatorConnections) {
    simulatorConnections.cleanup();
    simulatorConnections = null;
  }
  if (runner) {
    runner.stop();
    runner = null;
  }
  statusLabel.textContent = "";
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdlbmVyaWMtZGVtby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogTUlUXG4vLyBHZW5lcmljIGRlbW8gdGhhdCBjYW4gcmVuZGVyIGFueSBXb2t3aSBkaWFncmFtLmpzb24gZmlsZVxuXG5pbXBvcnQgJ0B3b2t3aS9lbGVtZW50cyc7XG5pbXBvcnQgeyBidWlsZEhleCB9IGZyb20gJy4vY29tcGlsZSc7XG5pbXBvcnQgeyBDUFVQZXJmb3JtYW5jZSB9IGZyb20gJy4vY3B1LXBlcmZvcm1hbmNlJztcbmltcG9ydCB7IEFWUlJ1bm5lciB9IGZyb20gJy4vZXhlY3V0ZSc7XG5pbXBvcnQgeyBmb3JtYXRUaW1lIH0gZnJvbSAnLi9mb3JtYXQtdGltZSc7XG5pbXBvcnQgJy4vaW5kZXguY3NzJztcblxuaW1wb3J0IHsgcGFyc2VEaWFncmFtLCBnZXRDb21wb25lbnRzIH0gZnJvbSAnLi9kaWFncmFtL3BhcnNlcic7XG5pbXBvcnQgeyBleHRyYWN0Q29tcG9uZW50Q29ubmVjdGlvbnMgfSBmcm9tICcuL2RpYWdyYW0vcGluLW1hcHBlcic7XG5pbXBvcnQgeyByZW5kZXJDb21wb25lbnRzIH0gZnJvbSAnLi9kaWFncmFtL2NvbXBvbmVudC1yZW5kZXJlcic7XG5pbXBvcnQgeyByZW5kZXJXaXJlcyB9IGZyb20gJy4vZGlhZ3JhbS93aXJlLXJlbmRlcmVyJztcbmltcG9ydCB7IGNvbm5lY3RDb21wb25lbnRzVG9TaW11bGF0b3IsIGNvbm5lY3RTaGlmdFJlZ2lzdGVyRGlzcGxheXMgfSBmcm9tICcuL2RpYWdyYW0vc2ltdWxhdG9yLWNvbm5lY3Rvcic7XG5cbmxldCBlZGl0b3I6IGFueTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5sZXQgcnVubmVyOiBBVlJSdW5uZXIgfCBudWxsID0gbnVsbDtcbmxldCBzaW11bGF0b3JDb25uZWN0aW9uczogeyBjbGVhbnVwOiAoKSA9PiB2b2lkIH0gfCBudWxsID0gbnVsbDtcbmxldCBlZGl0b3JSZWFkeSA9IGZhbHNlO1xuXG4vLyBMb2FkIEVkaXRvclxuZGVjbGFyZSBjb25zdCB3aW5kb3c6IGFueTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5kZWNsYXJlIGNvbnN0IG1vbmFjbzogYW55OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbndpbmRvdy5yZXF1aXJlLmNvbmZpZyh7XG4gIHBhdGhzOiB7IHZzOiAnaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvbW9uYWNvLWVkaXRvci8wLjMzLjAvbWluL3ZzJyB9LFxufSk7XG5cbndpbmRvdy5yZXF1aXJlKFsndnMvZWRpdG9yL2VkaXRvci5tYWluJ10sICgpID0+IHtcbiAgZWRpdG9yID0gbW9uYWNvLmVkaXRvci5jcmVhdGUoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNvZGUtZWRpdG9yJyksIHtcbiAgICB2YWx1ZTogJy8vIExvYWQgYSBkaWFncmFtLmpzb24gZmlsZSB0byBzZWUgY29tcG9uZW50cyByZW5kZXJlZCBoZXJlXFxuLy8gVGhlbiBwYXN0ZSB5b3VyIEFyZHVpbm8gY29kZSBoZXJlIG9yIGxvYWQgY29kZSBmaWxlcycsXG4gICAgbGFuZ3VhZ2U6ICdjcHAnLFxuICAgIG1pbmltYXA6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgfSk7XG4gIGVkaXRvclJlYWR5ID0gdHJ1ZTtcbiAgLy8gVHJ5IGxvYWRpbmcgZGlhZ3JhbSBhZnRlciBlZGl0b3IgaXMgcmVhZHkgKG9wdGlvbmFsKVxuICB0cnlMb2FkRGlhZ3JhbSgpO1xufSk7XG5cbi8vIFVJIEVsZW1lbnRzXG5jb25zdCBydW5CdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcnVuLWJ1dHRvbicpO1xuY29uc3Qgc3RvcEJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdG9wLWJ1dHRvbicpO1xuY29uc3QgbG9hZERpYWdyYW1CdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9hZC1kaWFncmFtLWJ1dHRvbicpO1xuY29uc3QgbG9hZENvZGVCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9hZC1jb2RlLWJ1dHRvbicpO1xuY29uc3Qgc3RhdHVzTGFiZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhdHVzLWxhYmVsJyk7XG5jb25zdCBjb21waWxlck91dHB1dFRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29tcGlsZXItb3V0cHV0LXRleHQnKTtcbmNvbnN0IHNlcmlhbE91dHB1dFRleHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2VyaWFsLW91dHB1dC10ZXh0Jyk7XG5jb25zdCBjb21wb25lbnRzQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbXBvbmVudHMtY29udGFpbmVyJykgYXMgSFRNTEVsZW1lbnQ7XG5cbmxldCBjdXJyZW50RGlhZ3JhbTogYW55ID0gbnVsbDtcbmxldCByZW5kZXJlZENvbXBvbmVudHM6IE1hcDxzdHJpbmcsIGFueT4gPSBuZXcgTWFwKCk7XG5cbi8vIEV2ZW50IExpc3RlbmVyc1xucnVuQnV0dG9uPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNvbXBpbGVBbmRSdW4pO1xuc3RvcEJ1dHRvbj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdG9wQ29kZSk7XG5sb2FkRGlhZ3JhbUJ1dHRvbj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBsb2FkRGlhZ3JhbUZpbGUpO1xubG9hZENvZGVCdXR0b24/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbG9hZENvZGVGaWxlcyk7XG5cbi8vIFRyeSB0byBsb2FkIGRpYWdyYW0gZnJvbSBjb21tb24gbG9jYXRpb24gKG9wdGlvbmFsLCBmYWlscyBncmFjZWZ1bGx5KVxuYXN5bmMgZnVuY3Rpb24gdHJ5TG9hZERpYWdyYW0oKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnLi4vc2ltb24td2l0aC1zY29yZS9kaWFncmFtLmpzb24nKTtcbiAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICBjb25zdCBkaWFncmFtID0gcGFyc2VEaWFncmFtKHRleHQpO1xuICAgICAgY3VycmVudERpYWdyYW0gPSBkaWFncmFtO1xuICAgICAgXG4gICAgICAvLyBSZW5kZXIgY29tcG9uZW50c1xuICAgICAgaWYgKGNvbXBvbmVudHNDb250YWluZXIpIHtcbiAgICAgICAgcmVuZGVyZWRDb21wb25lbnRzID0gcmVuZGVyQ29tcG9uZW50cyhnZXRDb21wb25lbnRzKGRpYWdyYW0ucGFydHMpLCBjb21wb25lbnRzQ29udGFpbmVyKTtcbiAgICAgICAgc3RhdHVzTGFiZWwudGV4dENvbnRlbnQgPSBgTG9hZGVkIGRpYWdyYW06ICR7cmVuZGVyZWRDb21wb25lbnRzLnNpemV9IGNvbXBvbmVudHNgO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gRmFpbCBzaWxlbnRseSAtIHVzZXIgY2FuIGxvYWQgbWFudWFsbHlcbiAgfVxufVxuXG5cbi8qKlxuICogTG9hZHMgYSBkaWFncmFtLmpzb24gZmlsZVxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRGlhZ3JhbUZpbGUoKSB7XG4gIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQudHlwZSA9ICdmaWxlJztcbiAgaW5wdXQuYWNjZXB0ID0gJy5qc29uJztcbiAgaW5wdXQub25jaGFuZ2UgPSBhc3luYyAoZSkgPT4ge1xuICAgIGNvbnN0IGZpbGUgPSAoZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkuZmlsZXM/LlswXTtcbiAgICBpZiAoIWZpbGUpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgZmlsZS50ZXh0KCk7XG4gICAgICBjb25zdCBkaWFncmFtID0gcGFyc2VEaWFncmFtKHRleHQpO1xuICAgICAgY3VycmVudERpYWdyYW0gPSBkaWFncmFtO1xuXG4gICAgICAvLyBSZW5kZXIgY29tcG9uZW50c1xuICAgICAgaWYgKGNvbXBvbmVudHNDb250YWluZXIpIHtcbiAgICAgICAgcmVuZGVyZWRDb21wb25lbnRzID0gcmVuZGVyQ29tcG9uZW50cyhcbiAgICAgICAgICBnZXRDb21wb25lbnRzKGRpYWdyYW0ucGFydHMpLCBcbiAgICAgICAgICBjb21wb25lbnRzQ29udGFpbmVyLFxuICAgICAgICAgIGRpYWdyYW0uY29ubmVjdGlvbnNcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIC8vIFJlbmRlciB3aXJlcyBhZnRlciBjb21wb25lbnRzIGFyZSBwb3NpdGlvbmVkICh1c2Ugc2V0VGltZW91dCB0byBlbnN1cmUgRE9NIGlzIHJlYWR5KVxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAvLyBSZW1vdmUgYW55IGV4aXN0aW5nIHdpcmUgU1ZHXG4gICAgICAgICAgY29uc3QgZXhpc3RpbmdTdmcgPSBjb21wb25lbnRzQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ3N2ZycpO1xuICAgICAgICAgIGlmIChleGlzdGluZ1N2ZykgZXhpc3RpbmdTdmcucmVtb3ZlKCk7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3Qgc3ZnID0gcmVuZGVyV2lyZXMoXG4gICAgICAgICAgICBkaWFncmFtLmNvbm5lY3Rpb25zLFxuICAgICAgICAgICAgZGlhZ3JhbS5wYXJ0cyxcbiAgICAgICAgICAgIHJlbmRlcmVkQ29tcG9uZW50cyxcbiAgICAgICAgICAgIGNvbXBvbmVudHNDb250YWluZXJcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbXBvbmVudHNDb250YWluZXIuYXBwZW5kQ2hpbGQoc3ZnKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgXG4gICAgICAgIHN0YXR1c0xhYmVsLnRleHRDb250ZW50ID0gYExvYWRlZCAke3JlbmRlcmVkQ29tcG9uZW50cy5zaXplfSBjb21wb25lbnRzYDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gbG9hZCBkaWFncmFtOiAnICsgZXJyKTtcbiAgICB9XG4gIH07XG4gIGlucHV0LmNsaWNrKCk7XG59XG5cbi8qKlxuICogTG9hZHMgY29kZSBmaWxlcyAoLmlubyBhbmQgLmggZmlsZXMpXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRDb2RlRmlsZXMoKSB7XG4gIGlmICghZWRpdG9yUmVhZHkgfHwgIWVkaXRvcikge1xuICAgIGFsZXJ0KCdFZGl0b3Igbm90IHJlYWR5IHlldCwgcGxlYXNlIHdhaXQuLi4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnR5cGUgPSAnZmlsZSc7XG4gIGlucHV0LmFjY2VwdCA9ICcuaW5vLC5oLC5jcHAsLmMnO1xuICBpbnB1dC5tdWx0aXBsZSA9IHRydWU7XG4gIGlucHV0Lm9uY2hhbmdlID0gYXN5bmMgKGUpID0+IHtcbiAgICBjb25zdCBmaWxlcyA9IEFycmF5LmZyb20oKGUudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZpbGVzIHx8IFtdKTtcbiAgICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgLy8gR2V0IGN1cnJlbnQgZWRpdG9yIGNvbnRlbnQgKG1pZ2h0IGFscmVhZHkgaGF2ZSAuaW5vIGNvZGUpXG4gICAgICBsZXQgbWFpbkNvZGUgPSBlZGl0b3IuZ2V0TW9kZWwoKS5nZXRWYWx1ZSgpO1xuICAgICAgY29uc3QgaGVhZGVyRmlsZXM6IHsgbmFtZTogc3RyaW5nOyBjb250ZW50OiBzdHJpbmcgfVtdID0gW107XG5cbiAgICAgIC8vIFJlYWQgYWxsIGZpbGVzXG4gICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IGZpbGUudGV4dCgpO1xuICAgICAgICBpZiAoZmlsZS5uYW1lLmVuZHNXaXRoKCcuaW5vJykgfHwgZmlsZS5uYW1lLmVuZHNXaXRoKCcuY3BwJykgfHwgZmlsZS5uYW1lLmVuZHNXaXRoKCcuYycpKSB7XG4gICAgICAgICAgbWFpbkNvZGUgPSB0ZXh0OyAvLyBSZXBsYWNlIHdpdGggbmV3IG1haW4gZmlsZVxuICAgICAgICB9IGVsc2UgaWYgKGZpbGUubmFtZS5lbmRzV2l0aCgnLmgnKSkge1xuICAgICAgICAgIGhlYWRlckZpbGVzLnB1c2goeyBuYW1lOiBmaWxlLm5hbWUsIGNvbnRlbnQ6IHRleHQgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gbWFpbiBmaWxlIGJ1dCB3ZSBoYXZlIGhlYWRlcnMsIHVzZSBjdXJyZW50IGVkaXRvciBjb250ZW50XG4gICAgICBjb25zdCBoYXNNYWluRmlsZSA9IGZpbGVzLnNvbWUoZiA9PiBmLm5hbWUuZW5kc1dpdGgoJy5pbm8nKSB8fCBmLm5hbWUuZW5kc1dpdGgoJy5jcHAnKSB8fCBmLm5hbWUuZW5kc1dpdGgoJy5jJykpO1xuICAgICAgXG4gICAgICBpZiAoIWhhc01haW5GaWxlICYmIG1haW5Db2RlLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgYWxlcnQoJ1BsZWFzZSBzZWxlY3QgYXQgbGVhc3Qgb25lIC5pbm8sIC5jcHAsIG9yIC5jIGZpbGUsIG9yIHBhc3RlIGNvZGUgaW4gdGhlIGVkaXRvciBmaXJzdCcpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFJlcGxhY2UgaW5jbHVkZXMgd2l0aCBhY3R1YWwgY29udGVudFxuICAgICAgaWYgKG1haW5Db2RlKSB7XG4gICAgICAgIGZvciAoY29uc3QgaGVhZGVyIG9mIGhlYWRlckZpbGVzKSB7XG4gICAgICAgICAgLy8gTWF0Y2g6ICNpbmNsdWRlIFwicGl0Y2hlcy5oXCIgb3IgI2luY2x1ZGUgPHBpdGNoZXMuaD5cbiAgICAgICAgICBjb25zdCBoZWFkZXJOYW1lID0gaGVhZGVyLm5hbWUucmVwbGFjZSgnLmgnLCAnJyk7XG4gICAgICAgICAgY29uc3QgcGF0dGVybnMgPSBbXG4gICAgICAgICAgICBuZXcgUmVnRXhwKGAjaW5jbHVkZVxcXFxzK1wiJHtoZWFkZXJOYW1lfVxcXFwuaFwiYCwgJ2cnKSxcbiAgICAgICAgICAgIG5ldyBSZWdFeHAoYCNpbmNsdWRlXFxcXHMrPCR7aGVhZGVyTmFtZX1cXFxcLmg+YCwgJ2cnKSxcbiAgICAgICAgICAgIG5ldyBSZWdFeHAoYCNpbmNsdWRlXFxcXHMrXCIke2hlYWRlck5hbWV9XCJgLCAnZycpLFxuICAgICAgICAgICAgbmV3IFJlZ0V4cChgI2luY2x1ZGVcXFxccys8JHtoZWFkZXJOYW1lfT5gLCAnZycpLFxuICAgICAgICAgIF07XG4gICAgICAgICAgXG4gICAgICAgICAgbGV0IHJlcGxhY2VkID0gZmFsc2U7XG4gICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICAgICAgICBpZiAocGF0dGVybi50ZXN0KG1haW5Db2RlKSkge1xuICAgICAgICAgICAgICBtYWluQ29kZSA9IG1haW5Db2RlLnJlcGxhY2UocGF0dGVybiwgaGVhZGVyLmNvbnRlbnQpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVwbGFjZWQgI2luY2x1ZGUgZm9yICR7aGVhZGVyLm5hbWV9IHdpdGggY29udGVudGApO1xuICAgICAgICAgICAgICByZXBsYWNlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyBJZiBubyBpbmNsdWRlIGZvdW5kIGJ1dCB3ZSBoYXZlIGEgaGVhZGVyLCBwcmVwZW5kIGl0IChmb3IgbWFudWFsIHBhc3RpbmcpXG4gICAgICAgICAgaWYgKCFyZXBsYWNlZCAmJiBoZWFkZXJGaWxlcy5sZW5ndGggPiAwICYmICFoYXNNYWluRmlsZSkge1xuICAgICAgICAgICAgbWFpbkNvZGUgPSBoZWFkZXIuY29udGVudCArICdcXG5cXG4nICsgbWFpbkNvZGU7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUHJlcGVuZGVkICR7aGVhZGVyLm5hbWV9IHRvIGV4aXN0aW5nIGNvZGVgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWRpdG9yLnNldFZhbHVlKG1haW5Db2RlKTtcbiAgICAgICAgc3RhdHVzTGFiZWwudGV4dENvbnRlbnQgPSBgTG9hZGVkICR7ZmlsZXMubGVuZ3RofSBjb2RlIGZpbGUocylgO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYWxlcnQoJ0ZhaWxlZCB0byBsb2FkIGNvZGUgZmlsZXM6ICcgKyBlcnIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgfTtcbiAgaW5wdXQuY2xpY2soKTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyBhbmQgcnVucyB0aGUgY29kZVxuICovXG5hc3luYyBmdW5jdGlvbiBjb21waWxlQW5kUnVuKCkge1xuICBpZiAoIWN1cnJlbnREaWFncmFtKSB7XG4gICAgYWxlcnQoJ1BsZWFzZSBsb2FkIGEgZGlhZ3JhbS5qc29uIGZpbGUgZmlyc3QnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBDbGVhbiB1cCBwcmV2aW91cyBydW5cbiAgaWYgKHNpbXVsYXRvckNvbm5lY3Rpb25zKSB7XG4gICAgc2ltdWxhdG9yQ29ubmVjdGlvbnMuY2xlYW51cCgpO1xuICAgIHNpbXVsYXRvckNvbm5lY3Rpb25zID0gbnVsbDtcbiAgfVxuICBpZiAocnVubmVyKSB7XG4gICAgcnVubmVyLnN0b3AoKTtcbiAgICBydW5uZXIgPSBudWxsO1xuICB9XG5cbiAgLy8gUmVzZXQgY29tcG9uZW50c1xuICBmb3IgKGNvbnN0IHJlbmRlcmVkIG9mIHJlbmRlcmVkQ29tcG9uZW50cy52YWx1ZXMoKSkge1xuICAgIGlmIChyZW5kZXJlZC5lbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3dva3dpLWxlZCcpIHtcbiAgICAgIChyZW5kZXJlZC5lbGVtZW50IGFzIGFueSkudmFsdWUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBydW5CdXR0b24uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICcxJyk7XG4gIGxvYWREaWFncmFtQnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnMScpO1xuXG4gIHNlcmlhbE91dHB1dFRleHQudGV4dENvbnRlbnQgPSAnJztcbiAgdHJ5IHtcbiAgICBzdGF0dXNMYWJlbC50ZXh0Q29udGVudCA9ICdDb21waWxpbmcuLi4nO1xuICAgIGNvbnN0IGNvZGUgPSBlZGl0b3IuZ2V0TW9kZWwoKS5nZXRWYWx1ZSgpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJ1aWxkSGV4KGNvZGUpO1xuICAgIGNvbXBpbGVyT3V0cHV0VGV4dC50ZXh0Q29udGVudCA9IHJlc3VsdC5zdGRlcnIgfHwgcmVzdWx0LnN0ZG91dDtcbiAgICBcbiAgICBpZiAocmVzdWx0LmhleCkge1xuICAgICAgY29tcGlsZXJPdXRwdXRUZXh0LnRleHRDb250ZW50ICs9ICdcXG5Qcm9ncmFtIHJ1bm5pbmcuLi4nO1xuICAgICAgc3RvcEJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSBydW5uZXJcbiAgICAgIHJ1bm5lciA9IG5ldyBBVlJSdW5uZXIocmVzdWx0LmhleCk7XG4gICAgICBjb25zdCBNSFogPSAxNjAwMDAwMDtcblxuICAgICAgLy8gRXh0cmFjdCBjb25uZWN0aW9uc1xuICAgICAgY29uc3QgY29ubmVjdGlvbnMgPSBleHRyYWN0Q29tcG9uZW50Q29ubmVjdGlvbnMoY3VycmVudERpYWdyYW0uY29ubmVjdGlvbnMpO1xuICAgICAgY29uc29sZS5sb2coJ0V4dHJhY3RlZCBjb25uZWN0aW9uczonLCBjb25uZWN0aW9ucyk7XG4gICAgICBjb25zb2xlLmxvZygnUmVuZGVyZWQgY29tcG9uZW50czonLCBBcnJheS5mcm9tKHJlbmRlcmVkQ29tcG9uZW50cy5rZXlzKCkpKTtcblxuICAgICAgLy8gQ29ubmVjdCBjb21wb25lbnRzIHRvIHNpbXVsYXRvclxuICAgICAgc2ltdWxhdG9yQ29ubmVjdGlvbnMgPSBjb25uZWN0Q29tcG9uZW50c1RvU2ltdWxhdG9yKFxuICAgICAgICBydW5uZXIsXG4gICAgICAgIHJlbmRlcmVkQ29tcG9uZW50cyxcbiAgICAgICAgY29ubmVjdGlvbnNcbiAgICAgICk7XG5cbiAgICAgIC8vIENoZWNrIGZvciBzaGlmdCByZWdpc3RlciAoNzRIQzU5NSkgLSBTaW1vbiBnYW1lIHVzZXMgQTAsIEExLCBBMlxuICAgICAgY29uc3QgaGFzU2hpZnRSZWdpc3RlciA9IGN1cnJlbnREaWFncmFtLnBhcnRzLnNvbWUoXG4gICAgICAgIChwOiBhbnkpID0+IHAudHlwZSA9PT0gJ3dva3dpLTc0aGM1OTUnXG4gICAgICApO1xuICAgICAgaWYgKGhhc1NoaWZ0UmVnaXN0ZXIpIHtcbiAgICAgICAgY29uc3Qgc2hpZnRDb25uID0gY29ubmVjdFNoaWZ0UmVnaXN0ZXJEaXNwbGF5cyhydW5uZXIsIHJlbmRlcmVkQ29tcG9uZW50cywgMCwgMiwgMSk7XG4gICAgICAgIC8vIENvbWJpbmUgY2xlYW51cFxuICAgICAgICBjb25zdCBvcmlnaW5hbENsZWFudXAgPSBzaW11bGF0b3JDb25uZWN0aW9ucy5jbGVhbnVwO1xuICAgICAgICBzaW11bGF0b3JDb25uZWN0aW9ucy5jbGVhbnVwID0gKCkgPT4ge1xuICAgICAgICAgIG9yaWdpbmFsQ2xlYW51cCgpO1xuICAgICAgICAgIHNoaWZ0Q29ubi5jbGVhbnVwKCk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIFNlcmlhbCBvdXRwdXRcbiAgICAgIHJ1bm5lci51c2FydC5vbkJ5dGVUcmFuc21pdCA9ICh2YWx1ZSkgPT4ge1xuICAgICAgICBzZXJpYWxPdXRwdXRUZXh0LnRleHRDb250ZW50ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUodmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgLy8gUGVyZm9ybWFuY2UgbW9uaXRvcmluZ1xuICAgICAgY29uc3QgY3B1UGVyZiA9IG5ldyBDUFVQZXJmb3JtYW5jZShydW5uZXIuY3B1LCBNSFopO1xuICAgICAgcnVubmVyLmV4ZWN1dGUoKGNwdSkgPT4ge1xuICAgICAgICBjb25zdCB0aW1lID0gZm9ybWF0VGltZShjcHUuY3ljbGVzIC8gTUhaKTtcbiAgICAgICAgY29uc3Qgc3BlZWQgPSAoY3B1UGVyZi51cGRhdGUoKSAqIDEwMCkudG9GaXhlZCgwKTtcbiAgICAgICAgc3RhdHVzTGFiZWwudGV4dENvbnRlbnQgPSBgU2ltdWxhdGlvbiB0aW1lOiAke3RpbWV9ICgke3NwZWVkfSUpYDtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBydW5CdXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcnVuQnV0dG9uLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICBsb2FkRGlhZ3JhbUJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgYWxlcnQoJ0ZhaWxlZDogJyArIGVycik7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFydW5uZXIpIHtcbiAgICAgIHN0YXR1c0xhYmVsLnRleHRDb250ZW50ID0gJyc7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHN0b3BDb2RlKCkge1xuICBzdG9wQnV0dG9uLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnMScpO1xuICBydW5CdXR0b24ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICBsb2FkRGlhZ3JhbUJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gIFxuICBpZiAoc2ltdWxhdG9yQ29ubmVjdGlvbnMpIHtcbiAgICBzaW11bGF0b3JDb25uZWN0aW9ucy5jbGVhbnVwKCk7XG4gICAgc2ltdWxhdG9yQ29ubmVjdGlvbnMgPSBudWxsO1xuICB9XG4gIFxuICBpZiAocnVubmVyKSB7XG4gICAgcnVubmVyLnN0b3AoKTtcbiAgICBydW5uZXIgPSBudWxsO1xuICB9XG4gIFxuICBzdGF0dXNMYWJlbC50ZXh0Q29udGVudCA9ICcnO1xufVxuXG4iXSwibWFwcGluZ3MiOiJBQUdBLE9BQU87QUFDUCxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGtCQUFrQjtBQUMzQixPQUFPO0FBRVAsU0FBUyxjQUFjLHFCQUFxQjtBQUM1QyxTQUFTLG1DQUFtQztBQUM1QyxTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLG1CQUFtQjtBQUM1QixTQUFTLDhCQUE4QixvQ0FBb0M7QUFFM0UsSUFBSTtBQUNKLElBQUksU0FBMkI7QUFDL0IsSUFBSSx1QkFBdUQ7QUFDM0QsSUFBSSxjQUFjO0FBS2xCLE9BQU8sUUFBUSxPQUFPO0FBQUEsRUFDcEIsT0FBTyxFQUFFLElBQUkscUVBQXFFO0FBQ3BGLENBQUM7QUFFRCxPQUFPLFFBQVEsQ0FBQyx1QkFBdUIsR0FBRyxNQUFNO0FBQzlDLFdBQVMsT0FBTyxPQUFPLE9BQU8sU0FBUyxjQUFjLGNBQWMsR0FBRztBQUFBLElBQ3BFLE9BQU87QUFBQSxJQUNQLFVBQVU7QUFBQSxJQUNWLFNBQVMsRUFBRSxTQUFTLE1BQU07QUFBQSxFQUM1QixDQUFDO0FBQ0QsZ0JBQWM7QUFFZCxpQkFBZTtBQUNqQixDQUFDO0FBR0QsTUFBTSxZQUFZLFNBQVMsY0FBYyxhQUFhO0FBQ3RELE1BQU0sYUFBYSxTQUFTLGNBQWMsY0FBYztBQUN4RCxNQUFNLG9CQUFvQixTQUFTLGNBQWMsc0JBQXNCO0FBQ3ZFLE1BQU0saUJBQWlCLFNBQVMsY0FBYyxtQkFBbUI7QUFDakUsTUFBTSxjQUFjLFNBQVMsY0FBYyxl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