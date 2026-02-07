// SPDX-License-Identifier: MIT
// Simple test endpoint

import type { IncomingMessage, ServerResponse } from 'http';
import { successResponse, errorResponse } from './_utils/response';

export const config = { runtime: 'nodejs' };

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    successResponse(res, {
      message: 'API is working!',
      method: req.method,
      url: req.url,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    errorResponse(res, message, 500);
  }
}
