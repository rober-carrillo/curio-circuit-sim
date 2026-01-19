// SPDX-License-Identifier: MIT
// Vercel Blob Storage utilities

import { put, get, del, list } from '@vercel/blob';

// Get token from environment (set in Vercel dashboard)
const getBlobToken = () => {
  // In Vercel, this will be available as process.env.BLOB_READ_WRITE_TOKEN
  // For edge runtime, we need to pass it explicitly
  return process.env.BLOB_READ_WRITE_TOKEN;
};

/**
 * Get the blob path for a user's project file
 */
export function getProjectBlobPath(userId: string, projectId: string, fileType: 'diagram' | 'code'): string {
  return `projects/${userId}/${projectId}/${fileType === 'diagram' ? 'diagram.json' : 'code.ino'}`;
}

/**
 * Save diagram JSON to blob storage
 */
export async function saveDiagram(userId: string, projectId: string, diagramData: any, token?: string): Promise<string> {
  const path = getProjectBlobPath(userId, projectId, 'diagram');
  const blob = await put(path, JSON.stringify(diagramData, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token: token || getBlobToken(),
  });
  return blob.url;
}

/**
 * Get diagram JSON from blob storage
 */
export async function getDiagram(userId: string, projectId: string, token?: string): Promise<any | null> {
  const path = getProjectBlobPath(userId, projectId, 'diagram');
  try {
    const blob = await get(path, { token: token || getBlobToken() });
    const text = await blob.text();
    return JSON.parse(text);
  } catch (error: any) {
    if (error.status === 404 || error.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
}

/**
 * Save code file to blob storage
 */
export async function saveCode(userId: string, projectId: string, code: string, token?: string): Promise<string> {
  const path = getProjectBlobPath(userId, projectId, 'code');
  const blob = await put(path, code, {
    access: 'public',
    contentType: 'text/plain',
    addRandomSuffix: false,
    token: token || getBlobToken(),
  });
  return blob.url;
}

/**
 * Get code file from blob storage
 */
export async function getCode(userId: string, projectId: string, token?: string): Promise<string | null> {
  const path = getProjectBlobPath(userId, projectId, 'code');
  try {
    const blob = await get(path, { token: token || getBlobToken() });
    return await blob.text();
  } catch (error: any) {
    if (error.status === 404 || error.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a project's files from blob storage
 */
export async function deleteProjectFiles(userId: string, projectId: string, token?: string): Promise<void> {
  const diagramPath = getProjectBlobPath(userId, projectId, 'diagram');
  const codePath = getProjectBlobPath(userId, projectId, 'code');
  const blobToken = token || getBlobToken();
  
  try {
    await del(diagramPath, { token: blobToken });
  } catch (error) {
    // Ignore if file doesn't exist
  }
  
  try {
    await del(codePath, { token: blobToken });
  } catch (error) {
    // Ignore if file doesn't exist
  }
}

/**
 * List all projects for a user
 */
export async function listUserProjects(userId: string, token?: string): Promise<string[]> {
  const prefix = `projects/${userId}/`;
  const { blobs } = await list({ prefix, token: token || getBlobToken() });
  
  // Extract unique project IDs from blob paths
  const projectIds = new Set<string>();
  for (const blob of blobs) {
    const match = blob.pathname.match(/projects\/[^/]+\/([^/]+)\//);
    if (match) {
      projectIds.add(match[1]);
    }
  }
  
  return Array.from(projectIds);
}
