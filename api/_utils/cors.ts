// SPDX-License-Identifier: MIT
// CORS utility for API routes

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

const DEFAULT_OPTIONS: CorsOptions = {
  origin: '*', // Allow all origins for now (restrict in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

export function setCorsHeaders(response: Response, options: CorsOptions = {}): Response {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const origin = Array.isArray(opts.origin) 
    ? opts.origin.join(', ') 
    : opts.origin;

  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Methods', opts.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', opts.allowedHeaders?.join(', ') || 'Content-Type, Authorization');
  
  if (opts.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export function handleOptions(): Response {
  const response = new Response(null, { status: 204 });
  return setCorsHeaders(response);
}
