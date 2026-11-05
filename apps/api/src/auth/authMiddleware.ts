import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './tokens.js';
import type { AccessTokenPayload, UserRole } from './types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Extracts and verifies the access token from Authorization header or secure cookie.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // 1. Check Bearer Authorization header (Mobile/Flutter, curl, API clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Check secure cookie fallback (_cafe_access)
  if (!token && req.cookies?._cafe_access) {
    token = req.cookies._cafe_access;
  }

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please provide a valid Bearer token or session cookie.',
        requestId: req.id,
      },
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Access token is invalid or has expired.',
        requestId: req.id,
      },
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware.
 * Enforces that the authenticated user possesses one of the allowed roles.
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          requestId: req.id,
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
          requestId: req.id,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Requires verified email for sensitive operations.
 */
export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isEmailVerified) {
    res.status(403).json({
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email address verification is required to perform this action.',
        requestId: req.id,
      },
    });
    return;
  }
  next();
}

