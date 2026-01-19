// SPDX-License-Identifier: MIT
// API route: Embeddable simulator page

import { getDiagram, getCode } from '../../_utils/storage';
import { errorResponse } from '../../_utils/response';
import { handleOptions } from '../../_utils/cors';

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

  if (request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const projectId = url.searchParams.get('projectId');

  if (!userId || !projectId) {
    return errorResponse('userId and projectId query parameters are required', 400);
  }

  // Get blob token from environment
  const token = env?.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

  try {
    // Load project data
    const [diagram, code] = await Promise.all([
      getDiagram(userId, projectId, token),
      getCode(userId, projectId, token),
    ]);

    if (!diagram && !code) {
      return errorResponse('Project not found', 404);
    }

    // Generate HTML page that loads the simulator
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulator - ${projectId}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #simulator-container {
      width: 100%;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="simulator-container"></div>
  <script>
    // Store project data for the simulator to load
    window.PROJECT_DATA = {
      userId: ${JSON.stringify(userId)},
      projectId: ${JSON.stringify(projectId)},
      diagram: ${diagram ? JSON.stringify(diagram) : 'null'},
      code: ${code ? JSON.stringify(code) : 'null'},
    };
    
    // Redirect to the main simulator page with data
    const params = new URLSearchParams({
      userId: ${JSON.stringify(userId)},
      projectId: ${JSON.stringify(projectId)},
    });
    window.location.href = '/generic.html?' + params.toString();
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('[API] Error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
