// SPDX-License-Identifier: MIT
// Response utility functions

import { setCorsHeaders } from './cors';

export function jsonResponse(data: any, status: number = 200): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return setCorsHeaders(response);
}

export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

export function successResponse(data: any, status: number = 200): Response {
  return jsonResponse(data, status);
}
