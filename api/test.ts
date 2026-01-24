// SPDX-License-Identifier: MIT
// Simple test endpoint

import { successResponse } from './_utils/response';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request): Promise<Response> {
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
}
