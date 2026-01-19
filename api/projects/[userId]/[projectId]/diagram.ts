// SPDX-License-Identifier: MIT
// API route: Get or update project diagram JSON

import { getDiagram, saveDiagram } from '../../../../_utils/storage';
import { jsonResponse, errorResponse, successResponse } from '../../../../_utils/response';
import { handleOptions } from '../../../../_utils/cors';

export const config = {
  runtime: 'edge',
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
      // Get diagram JSON
      const diagram = await getDiagram(userId, projectId, token);
      
      if (!diagram) {
        return errorResponse('Diagram not found', 404);
      }

      return successResponse(diagram);
    } else if (request.method === 'PUT') {
      // Save diagram JSON
      const diagram = await request.json();
      
      if (!diagram || typeof diagram !== 'object') {
        return errorResponse('Invalid diagram data', 400);
      }

      const url = await saveDiagram(userId, projectId, diagram, token);
      
      return successResponse({
        url,
        message: 'Diagram saved successfully',
      });
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error: any) {
    console.error('[API] Error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
