// SPDX-License-Identifier: MIT
// Simple test endpoint

const { successResponse } = require('./_utils/response');

module.exports.config = {
  runtime: 'nodejs',
};

module.exports = async function handler(request: Request): Promise<Response> {
  try {
    return successResponse({ 
      message: 'API is working!',
      method: request.method,
      url: request.url 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
