// SPDX-License-Identifier: MIT
// API route: List projects for a user or create a new project

import { listUserProjects } from '../../_utils/storage';
import { jsonResponse, errorResponse, successResponse } from '../../_utils/response';
import { handleOptions } from '../../_utils/cors';

export const config = {
  runtime: 'nodejs',
};

interface Env {
  BLOB_READ_WRITE_TOKEN?: string;
}

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const userId = pathParts[2]; // Extract userId from /api/projects/[userId]

  if (!userId) {
    return errorResponse('User ID is required', 400);
  }

  // Get blob token from environment
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (request.method === 'GET') {
      // List all projects for user
      const projectIds = await listUserProjects(userId, token);
      
      // Return project list with metadata
      const projects = projectIds.map(id => ({
        id,
        userId,
        name: id, // Default name is the project ID (can be enhanced later)
        createdAt: new Date().toISOString(), // TODO: Store actual creation date
        updatedAt: new Date().toISOString(), // TODO: Store actual update date
      }));

      return successResponse({ projects });
    } else if (request.method === 'POST') {
      // Create new project
      const body = await request.json() as { projectId?: string; name?: string; diagram?: any; code?: string };
      const { projectId, name, diagram, code } = body;

      if (!projectId) {
        return errorResponse('Project ID is required', 400);
      }

      const { saveDiagram, saveCode } = await import('../../_utils/storage');

      const urls: { diagramUrl?: string; codeUrl?: string } = {};

      // Save diagram if provided
      if (diagram) {
        urls.diagramUrl = await saveDiagram(userId, projectId, diagram, token);
      }

      // Save code if provided
      if (code) {
        urls.codeUrl = await saveCode(userId, projectId, code, token);
      }

      return successResponse({
        id: projectId,
        userId,
        name: name || projectId,
        ...urls,
        createdAt: new Date().toISOString(),
      }, 201);
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error: any) {
    console.error('[API] Error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
