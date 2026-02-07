// SPDX-License-Identifier: MIT
// CORS utility – sets headers on Node.js ServerResponse

import type { ServerResponse } from 'http';

const DEFAULT_ORIGIN = '*';
const DEFAULT_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
const DEFAULT_HEADERS = 'Content-Type, Authorization';

export function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', DEFAULT_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', DEFAULT_METHODS);
  res.setHeader('Access-Control-Allow-Headers', DEFAULT_HEADERS);
}

export function handleOptions(res: ServerResponse): void {
  setCorsHeaders(res);
  res.writeHead(204);
  res.end();
}
