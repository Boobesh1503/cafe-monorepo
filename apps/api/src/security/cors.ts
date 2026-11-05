import cors, { type CorsOptions } from 'cors';
import type { RequestHandler } from 'express';

export function createCorsMiddleware(allowedOrigins: string[]): RequestHandler {
  const allowedSet = new Set(allowedOrigins.map((origin) => origin.trim().replace(/\/$/, '')));

  const options: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = origin.trim().replace(/\/$/, '');
      if (allowedSet.has(normalized)) {
        callback(null, true);
      } else {
        const error = new Error(`Origin ${origin} is not allowed by CORS`);
        (error as Error & { status?: number; code?: string }).status = 403;
        (error as Error & { status?: number; code?: string }).code = 'CORS_NOT_ALLOWED';
        callback(error);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 86400, // 24 hours preflight cache
  };

  return cors(options);
}

