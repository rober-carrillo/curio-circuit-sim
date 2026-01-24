// SPDX-License-Identifier: MIT
// API route: Get, update, or delete a specific project

import { getDiagram, getCode, deleteProjectFiles } from '../../../_utils/storage';
import { jsonResponse, errorResponse, successResponse } from '../../../_utils/response';
import { handleOptions } from '../../../_utils/cors';

export const config = {
  runtime: 'nodejs',
};

interface Env {
  BLOB_READ_WRITE_TOKEN?: string;
}

export default async function handler(request: Request, env?: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const userId = pathParts[2];
  const projectId = pathParts[3];

  if (!userId || !projectId) {
    return errorResponse('User ID and Project ID are required', 400);
  }

  // Get blob token from environment
  const token = env?.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (request.method === 'GET') {
      // Get project metadata
      const diagram = await getDiagram(userId, projectId, token);
      const code = await getCode(userId, projectId, token);

      if (!diagram && !code) {
        return errorResponse('Project not found', 404);
      }

      return successResponse({
        id: projectId,
        userId,
        name: projectId, // TODO: Store actual project name
        hasDiagram: !!diagram,
        hasCode: !!code,
        createdAt: new Date().toISOString(), // TODO: Store actual creation date
        updatedAt: new Date().toISOString(), // TODO: Store actual update date
      });
    } else if (request.method === 'PUT') {
      // Update project metadata (for now, just return success)
      // TODO: Implement actual metadata updates when we add a database
      const body = await request.json();
      return successResponse({
        id: projectId,
        userId,
        name: body.name || projectId,
        updatedAt: new Date().toISOString(),
      });
    } else if (request.method === 'DELETE') {
      // Delete project files
      await deleteProjectFiles(userId, projectId, token);
      return successResponse({ message: 'Project deleted successfully' });
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error: any) {
    console.error('[API] Error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
