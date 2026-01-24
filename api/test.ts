// SPDX-License-Identifier: MIT
// Simple test endpoint

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request): Promise<Response> {
  return new Response(JSON.stringify({ 
    message: 'API is working!',
    method: request.method,
    url: request.url 
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
