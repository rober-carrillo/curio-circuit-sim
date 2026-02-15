// SPDX-License-Identifier: MIT
// API route: Embeddable simulator page

import type { IncomingMessage, ServerResponse } from 'http';
import { getDiagram, getCode } from '../_utils/storage';
import { errorResponse } from '../_utils/response';
import { handleOptions } from '../_utils/cors';

export const config = { runtime: 'nodejs' };

function getQuery(req: IncomingMessage): URLSearchParams {
  const url = req.url || '';
  const q = url.indexOf('?');
  return new URLSearchParams(q >= 0 ? url.slice(q) : '');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed', 405);
    return;
  }

  const params = getQuery(req);
  const userId = params.get('userId');
  const projectId = params.get('projectId');
  const viewRaw = params.get('view');
  const view =
    viewRaw === 'code' || viewRaw === 'diagram' ? viewRaw : undefined;

  if (!userId || !projectId) {
    errorResponse(res, 'userId and projectId query parameters are required', 400);
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const [diagram, code] = await Promise.all([
      getDiagram(userId, projectId, token),
      getCode(userId, projectId, token),
    ]);

    if (!diagram && !code) {
      errorResponse(res, 'Project not found', 404);
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulator - ${projectId}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #simulator-container { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="simulator-container"></div>
  <script>
    window.PROJECT_DATA = {
      userId: ${JSON.stringify(userId)},
      projectId: ${JSON.stringify(projectId)},
      diagram: ${diagram ? JSON.stringify(diagram) : 'null'},
      code: ${code ? JSON.stringify(code) : 'null'},
    };
    const params = new URLSearchParams({ userId: ${JSON.stringify(userId)}, projectId: ${JSON.stringify(projectId)} });
    ${view ? `params.set('view', ${JSON.stringify(view)});` : ''}
    window.location.href = '/generic.html?' + params.toString();
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(html);
  } catch (err: unknown) {
    console.error('[API] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    errorResponse(res, message, 500);
  }
}
