// SPDX-License-Identifier: MIT
// API route: Get or update project code file

import type { IncomingMessage, ServerResponse } from 'http';
import { getCode, saveCode } from '../../../_utils/storage';
import { errorResponse, successResponse, getRequestBody } from '../../../_utils/response';
import { setCorsHeaders, handleOptions } from '../../../_utils/cors';

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
      const code = await getCode(userId, projectId, token);
      if (!code) {
        errorResponse(res, 'Code file not found', 404);
        return;
      }
      setCorsHeaders(res);
      res.setHeader('Content-Type', 'text/plain');
      res.writeHead(200);
      res.end(code);
      return;
    }

    if (req.method === 'PUT') {
      const code = await getRequestBody(req);
      if (!code) {
        errorResponse(res, 'Code content is required', 400);
        return;
      }
      const url = await saveCode(userId, projectId, code, token);
      successResponse(res, { url, message: 'Code saved successfully' });
      return;
    }

    errorResponse(res, 'Method not allowed', 405);
  } catch (err: unknown) {
    console.error('[API] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    errorResponse(res, message, 500);
  }
}
