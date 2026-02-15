// SPDX-License-Identifier: MIT
// API route: Get, update, or delete a specific project

import type { IncomingMessage, ServerResponse } from 'http';
import { getDiagram, getCode, deleteProjectFiles } from '../../../_utils/storage';
import { errorResponse, successResponse, getRequestBody, getPathname } from '../../../_utils/response';
import { handleOptions } from '../../../_utils/cors';

export const config = { runtime: 'nodejs' };

function getUserIdProjectId(req: IncomingMessage): { userId: string; projectId: string } | null {
  const pathname = getPathname(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('projects');
  if (idx < 0 || parts.length < idx + 3) return null;
  return { userId: parts[idx + 1], projectId: parts[idx + 2] };
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  const ids = getUserIdProjectId(req);
  if (!ids) {
    errorResponse(res, 'User ID and Project ID are required', 400);
    return;
  }
  const { userId, projectId } = ids;

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (req.method === 'GET') {
      let diagram: any = null;
      let code: string | null = null;
      try {
        [diagram, code] = await Promise.all([
          getDiagram(userId, projectId, token),
          getCode(userId, projectId, token),
        ]);
      } catch (e) {
        console.error('[API] Error loading project files:', e);
      }

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
