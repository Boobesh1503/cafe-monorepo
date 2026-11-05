import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const reqId = typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.slice(0, 64)
    : randomUUID();

  req.id = reqId;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', reqId);

  // Structured request completion logging
  res.on('finish', () => {
    const durationMs = Date.now() - req.startTime;
    const logEntry = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId: req.id,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}

