// SPDX-License-Identifier: MIT
// Response utility functions

const { setCorsHeaders } = require('./cors');

function jsonResponse(data: any, status: number = 200): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return setCorsHeaders(response);
}

function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

function successResponse(data: any, status: number = 200): Response {
  return jsonResponse(data, status);
}

module.exports = {
  jsonResponse,
  errorResponse,
  successResponse,
};
