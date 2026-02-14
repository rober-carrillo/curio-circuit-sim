// SPDX-License-Identifier: MIT
// API route: Get, update, or delete a specific project

import type { IncomingMessage, ServerResponse } from 'http';
import { getDiagram, getCode, deleteProjectFiles } from '../../../_utils/storage';
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
      const code = await getCode(userId, projectId, token);

      if (!diagram && !code) {
        errorResponse(res, 'Project not found', 404);
        return;
      }

      successResponse(res, {
        id: projectId,
        userId,
        name: projectId,
        hasDiagram: !!diagram,
        hasCode: !!code,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (req.method === 'PUT') {
      const bodyStr = await getRequestBody(req);
      const body = JSON.parse(bodyStr) as { name?: string };
      successResponse(res, {
        id: projectId,
        userId,
        name: body.name || projectId,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (req.method === 'DELETE') {
      await deleteProjectFiles(userId, projectId, token);
      successResponse(res, { message: 'Project deleted successfully' });
      return;
    }

    errorResponse(res, 'Method not allowed', 405);
  } catch (err: unknown) {
    console.error('[API] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    errorResponse(res, message, 500);
  }
}
