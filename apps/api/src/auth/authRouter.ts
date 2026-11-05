import { Router, type Request, type Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { setSecureCookie, clearSecureCookie } from '../security/cookies.js';
import { validateRequest } from '../security/validation.js';
import { AuthService } from './authService.js';
import { requireAuth, requireRoles } from './authMiddleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  emailVerificationSchema,
  mfaVerifySchema,
} from './schemas.js';

export function createAuthRouter(prisma: PrismaClient, isProduction: boolean): Router {
  const router = Router();
  const authService = new AuthService(prisma);

  // Helper to attach secure cookies for browser clients
  const attachAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    setSecureCookie(res, '_cafe_access', accessToken, isProduction, {
      maxAge: 15 * 60 * 1000, // 15 mins
    });
    setSecureCookie(res, '_cafe_refresh', refreshToken, isProduction, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };

  const removeAuthCookies = (res: Response) => {
    clearSecureCookie(res, '_cafe_access', isProduction);
    clearSecureCookie(res, '_cafe_refresh', isProduction);
  };

  // POST /register
  router.post(
    '/register',
    validateRequest({ body: registerSchema }),
    async (req: Request, res: Response, next) => {
      try {
        const result = await authService.register(req.body);
        res.status(201).json({
          status: 'success',
          message: 'Account registered successfully. Please verify your email.',
          user: result.user,
          verificationToken: result.verificationToken,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /login
  router.post(
    '/login',
    validateRequest({ body: loginSchema }),
    async (req: Request, res: Response, next) => {
      try {
        const meta = {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.socket.remoteAddress,
        };

        const result = await authService.login(req.body, meta);

        if (result.requiresMfa) {
          res.status(200).json({
            status: 'mfa_required',
            message: 'Please provide your 6-digit MFA verification code to complete sign-in.',
            requiresMfa: true,
          });
          return;
        }

        if (result.tokens) {
          attachAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
        }

        res.status(200).json({
          status: 'success',
          user: result.user,
          tokens: result.tokens, // Provided for Flutter Secure Storage
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /refresh (Token rotation)
  router.post(
    '/refresh',
    validateRequest({ body: refreshTokenSchema }),
    async (req: Request, res: Response, next) => {
      try {
        const rawToken = req.body.refreshToken || req.cookies?._cafe_refresh;
        if (!rawToken) {
          res.status(401).json({
            error: {
              code: 'REFRESH_TOKEN_REQUIRED',
              message: 'Refresh token is required via request body or cookie.',
              requestId: req.id,
            },
          });
          return;
        }

        const meta = {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.socket.remoteAddress,
        };

        const tokens = await authService.rotateRefreshToken(rawToken, meta);
        attachAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        res.status(200).json({
          status: 'success',
          tokens,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /logout
  router.post('/logout', async (req: Request, res: Response, next) => {
    try {
      const rawToken = req.body?.refreshToken || req.cookies?._cafe_refresh;
      if (rawToken) {
        await authService.logout(rawToken);
      }
      removeAuthCookies(res);
      res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  });

  // POST /logout-all (Revoke all devices)
  router.post('/logout-all', requireAuth, async (req: Request, res: Response, next) => {
    try {
      if (!req.user) return;
      await authService.logoutAllDevices(req.user.userId);
      removeAuthCookies(res);
      res.status(200).json({
        status: 'success',
        message: 'Successfully logged out from all active devices and sessions.',
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /me (Current user profile)
  router.get('/me', requireAuth, async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      user: req.user,
    });
  });

  // GET /sessions (Active multi-device sessions)
  router.get('/sessions', requireAuth, async (req: Request, res: Response, next) => {
    try {
      if (!req.user) return;
      const sessions = await authService.getActiveSessions(req.user.userId);
      res.status(200).json({ status: 'success', sessions });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /sessions/:id (Revoke specific session)
  router.delete('/sessions/:id', requireAuth, async (req: Request, res: Response, next) => {
    try {
      if (!req.user) return;
      const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await authService.revokeSessionById(req.user.userId, sessionId);
      res.status(200).json({ status: 'success', message: 'Session revoked successfully.' });
    } catch (err) {
      next(err);
    }
  });

  // POST /password-reset/request
  router.post(
    '/password-reset/request',
    validateRequest({ body: passwordResetRequestSchema }),
    async (req: Request, res: Response, next) => {
      try {
        const result = await authService.requestPasswordReset(req.body.email);
        res.status(200).json({
          status: 'success',
          message: result.message,
          resetToken: result.resetToken, // Provided in dev/test
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /password-reset/confirm (Single-use enforcement)
  router.post(
    '/password-reset/confirm',
    validateRequest({ body: passwordResetConfirmSchema }),
    async (req: Request, res: Response, next) => {
      try {
        await authService.confirmPasswordReset(req.body.token, req.body.newPassword);
        removeAuthCookies(res);
        res.status(200).json({
          status: 'success',
          message: 'Password reset successful. All active sessions have been invalidated. Please log in.',
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /verify-email
  router.post(
    '/verify-email',
    validateRequest({ body: emailVerificationSchema }),
    async (req: Request, res: Response, next) => {
      try {
        await authService.verifyEmail(req.body.token);
        res.status(200).json({
          status: 'success',
          message: 'Email address verified successfully.',
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /mfa/setup (Staff / Admin MFA initiation)
  router.post(
    '/mfa/setup',
    requireAuth,
    requireRoles('STAFF', 'ADMIN', 'SUPER_ADMIN'),
    async (req: Request, res: Response, next) => {
      try {
        if (!req.user) return;
        const result = await authService.setupMfa(req.user.userId);
        res.status(200).json({
          status: 'success',
          secret: result.secret,
          otpAuthUri: result.otpAuthUri,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /mfa/verify (Activate MFA)
  router.post(
    '/mfa/verify',
    requireAuth,
    requireRoles('STAFF', 'ADMIN', 'SUPER_ADMIN'),
    validateRequest({ body: mfaVerifySchema }),
    async (req: Request, res: Response, next) => {
      try {
        if (!req.user) return;
        await authService.verifyAndActivateMfa(req.user.userId, req.body.mfaCode);
        res.status(200).json({
          status: 'success',
          message: 'Two-Factor Authentication successfully activated.',
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
