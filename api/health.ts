// SPDX-License-Identifier: MIT
// Simple health check endpoint with NO imports

module.exports.config = {
  runtime: 'nodejs',
};

module.exports = async function handler(request: Request): Promise<Response> {
  return new Response(JSON.stringify({ 
    status: 'ok',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
