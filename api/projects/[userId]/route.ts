// SPDX-License-Identifier: MIT
// API route: List projects for a user or create a new project

import type { IncomingMessage, ServerResponse } from 'http';
import { listUserProjects, saveDiagram, saveCode } from '../../_utils/storage';
import { errorResponse, successResponse, getRequestBody } from '../../_utils/response';
import { handleOptions } from '../../_utils/cors';

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
  const userId = pathParts[2]; // /api/projects/[userId]

  if (!userId) {
    errorResponse(res, 'User ID is required', 400);
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (req.method === 'GET') {
      const projectIds = await listUserProjects(userId, token);
      const projects = projectIds.map((id) => ({
        id,
        userId,
        name: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      successResponse(res, { projects });
      return;
    }

    if (req.method === 'POST') {
      const bodyStr = await getRequestBody(req);
      const body = JSON.parse(bodyStr) as { projectId?: string; name?: string; diagram?: unknown; code?: string };
      const { projectId, name, diagram, code } = body;

      if (!projectId) {
        errorResponse(res, 'Project ID is required', 400);
        return;
      }

      const urls: { diagramUrl?: string; codeUrl?: string } = {};

      if (diagram) {
        urls.diagramUrl = await saveDiagram(userId, projectId, diagram, token);
      }
      if (code) {
        urls.codeUrl = await saveCode(userId, projectId, code, token);
      }

      successResponse(res, {
        id: projectId,
        userId,
        name: name || projectId,
        ...urls,
        createdAt: new Date().toISOString(),
      }, 201);
      return;
    }

    errorResponse(res, 'Method not allowed', 405);
  } catch (err: unknown) {
    console.error('[API] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    errorResponse(res, message, 500);
  }
}
