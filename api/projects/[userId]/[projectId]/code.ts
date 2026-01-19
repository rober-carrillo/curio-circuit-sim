// SPDX-License-Identifier: MIT
// API route: Get or update project code file

import { getCode, saveCode } from '../../../../_utils/storage';
import { errorResponse, successResponse } from '../../../../_utils/response';
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
      // Get code file
      const code = await getCode(userId, projectId, token);
      
      if (!code) {
        return errorResponse('Code file not found', 404);
      }

      // Return as plain text
      const response = new Response(code, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      return response;
    } else if (request.method === 'PUT') {
      // Save code file
      const code = await request.text();
      
      if (!code) {
        return errorResponse('Code content is required', 400);
      }

      const url = await saveCode(userId, projectId, code, token);
      
      return successResponse({
        url,
        message: 'Code saved successfully',
      });
    } else {
      return errorResponse('Method not allowed', 405);
    }
  } catch (error: any) {
    console.error('[API] Error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
