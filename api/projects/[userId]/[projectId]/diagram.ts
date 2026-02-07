// SPDX-License-Identifier: MIT
// API route: Get or update project diagram JSON

import type { IncomingMessage, ServerResponse } from 'http';
import { getDiagram, saveDiagram } from '../../../_utils/storage';
import { errorResponse, successResponse, getRequestBody } from '../../../_utils/response';
import { handleOptions } from '../../../_utils/cors';

export const config = { runtime: 'nodejs' };

function getPathParts(req: IncomingMessage): string[] {
  const url = req.url || '';
  const path = url.split('?')[0];
  return path.split('/').filter(Boolean);
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  const pathParts = getPathParts(req);
  const userId = pathParts[2];
  const projectId = pathParts[3];

  if (!userId || !projectId) {
    errorResponse(res, 'User ID and Project ID are required', 400);
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (req.method === 'GET') {
      const diagram = await getDiagram(userId, projectId, token);
      if (!diagram) {
        errorResponse(res, 'Diagram not found', 404);
        return;
      }
      successResponse(res, diagram);
      return;
    }

    if (req.method === 'PUT') {
      const bodyStr = await getRequestBody(req);
      const diagram = JSON.parse(bodyStr);
      if (!diagram || typeof diagram !== 'object') {
        errorResponse(res, 'Invalid diagram data', 400);
        return;
      }
      const url = await saveDiagram(userId, projectId, diagram, token);
      successResponse(res, { url, message: 'Diagram saved successfully' });
      return;
    }

    errorResponse(res, 'Method not allowed', 405);
  } catch (err: unknown) {
    console.error('[API] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    errorResponse(res, message, 500);
  }
}
