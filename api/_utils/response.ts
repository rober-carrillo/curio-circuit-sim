// SPDX-License-Identifier: MIT
// Response helpers – write JSON to Node.js ServerResponse with CORS

import type { IncomingMessage, ServerResponse } from 'http';
import { setCorsHeaders } from './cors';

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

export function successResponse(res: ServerResponse, data: unknown, status: number = 200): void {
  sendJson(res, status, data);
}

export function errorResponse(res: ServerResponse, message: string, status: number = 400): void {
  sendJson(res, status, { error: message });
}

/** Read request body as string (for JSON or text). */
export function getRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
