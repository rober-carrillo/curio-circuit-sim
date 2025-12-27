/**
 * Project Persistence Layer
 * Handles saving/loading projects to/from localStorage and downloading as files
 */

export interface ProjectData {
  id: string;
  name: string;
  diagram: any; // diagram.json structure
  code: string; // Arduino code
  lastModified: number;
}

const STORAGE_KEY_PREFIX = 'avr8js-project-';
const PROJECTS_INDEX_KEY = 'avr8js-projects-index';

/**
 * Get list of all saved projects
 */
export function listSavedProjects(): { id: string; name: string; lastModified: number }[] {
  const indexJson = localStorage.getItem(PROJECTS_INDEX_KEY);
  if (!indexJson) return [];
  
  try {
    return JSON.parse(indexJson);
  } catch (e) {
    console.error('Failed to parse projects index:', e);
    return [];
  }
}

/**
 * Save a project to localStorage
 */
export function saveProject(project: ProjectData): void {
  const key = STORAGE_KEY_PREFIX + project.id;
  project.lastModified = Date.now();
  
  // Save project data
  localStorage.setItem(key, JSON.stringify(project));
  
  // Update projects index
  const index = listSavedProjects();
  const existingIndex = index.findIndex(p => p.id === project.id);
  
  const indexEntry = {
    id: project.id,
    name: project.name,
    lastModified: project.lastModified
  };
  
  if (existingIndex >= 0) {
    index[existingIndex] = indexEntry;
  } else {
    index.push(indexEntry);
  }
  
  localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(index));
  console.log(`[PERSISTENCE] Saved project: ${project.name} (${project.id})`);
}

/**
 * Load a project from localStorage
 */
export function loadProject(projectId: string): ProjectData | null {
  const key = STORAGE_KEY_PREFIX + projectId;
  const dataJson = localStorage.getItem(key);
  
  if (!dataJson) {
    console.warn(`[PERSISTENCE] Project ${projectId} not found in localStorage`);
    return null;
  }
  
  try {
    return JSON.parse(dataJson);
  } catch (e) {
    console.error(`[PERSISTENCE] Failed to parse project ${projectId}:`, e);
    return null;
  }
}

/**
 * Delete a project from localStorage
 */
export function deleteProject(projectId: string): void {
  const key = STORAGE_KEY_PREFIX + projectId;
  localStorage.removeItem(key);
  
  // Update index
  const index = listSavedProjects();
  const filtered = index.filter(p => p.id !== projectId);
  localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(filtered));
  
  console.log(`[PERSISTENCE] Deleted project: ${projectId}`);
}

/**
 * Download project as a ZIP file (in the future, for now just separate files)
 */
export function downloadProject(project: ProjectData): void {
  // Download diagram.json
  downloadFile(
    `${project.id}-diagram.json`,
    JSON.stringify(project.diagram, null, 2),
    'application/json'
  );
  
  // Download code file
  downloadFile(
    `${project.id}.ino`,
    project.code,
    'text/plain'
  );
  
  console.log(`[PERSISTENCE] Downloaded project: ${project.name}`);
}

/**
 * Helper to download a file
 */
function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import project from files (user uploads)
 */
export async function importProjectFromFiles(
  diagramFile: File,
  codeFile: File
): Promise<ProjectData> {
  const diagramText = await diagramFile.text();
  const codeText = await codeFile.text();
  
  const diagram = JSON.parse(diagramText);
  
  // Generate project ID from diagram file name (or random)
  const projectId = diagramFile.name.replace('.json', '').replace('diagram-', '');
  
  return {
    id: projectId,
    name: diagram.name || projectId,
    diagram,
    code: codeText,
    lastModified: Date.now()
  };
}

/**
 * Check localStorage quota
 */
export function checkStorageQuota(): { used: number; available: number; percentage: number } {
  let used = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  
  // Most browsers have ~5-10MB localStorage limit
  const available = 10 * 1024 * 1024; // Assume 10MB
  
  return {
    used,
    available,
    percentage: (used / available) * 100
  };
}

