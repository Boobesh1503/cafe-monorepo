import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_COOKIE_NAME = '_cafe_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function csrfProtection(isProduction: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure CSRF cookie exists
    let token = req.cookies?.[CSRF_COOKIE_NAME];
    if (!token) {
      token = generateCsrfToken();
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Accessible by frontend JavaScript for double-submit
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
      });
    }

    // Skip validation for safe HTTP methods
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    // If request contains cookies (credentialed), verify CSRF header
    const hasCookies = req.headers.cookie && req.headers.cookie.length > 0;
    if (hasCookies) {
      const headerToken = req.headers[CSRF_HEADER_NAME];
      if (
        typeof headerToken !== 'string' ||
        typeof token !== 'string' ||
        headerToken.length !== token.length
      ) {
        res.status(403).json({
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid or missing CSRF token in header.',
            requestId: req.id,
          },
        });
        return;
      }

      const tokenBuf = Buffer.from(token);
      const headerBuf = Buffer.from(headerToken);
      if (!timingSafeEqual(tokenBuf, headerBuf)) {
        res.status(403).json({
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token mismatch.',
            requestId: req.id,
          },
        });
        return;
      }
    }

    next();
  };
}

