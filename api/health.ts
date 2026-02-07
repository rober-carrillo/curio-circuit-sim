// SPDX-License-Identifier: MIT
// Health check endpoint

import type { IncomingMessage, ServerResponse } from 'http';
import { setCorsHeaders } from './_utils/cors';

export const config = { runtime: 'nodejs' };

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify({
    status: 'ok',
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  }));
}
