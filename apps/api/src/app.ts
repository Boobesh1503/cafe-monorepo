import cookieParser from 'cookie-parser';
import express, { Router, type Request, type Response } from 'express';
import { contactSubmissionSchema } from '@cafe/shared';
import { config } from './config.js';
import type { ApiDependencies } from './infrastructure/dependencies.js';
import {
  createCorsMiddleware,
  createDistributedRateLimiter,
  createSecurityHeaders,
  csrfProtection,
  generateCsrfToken,
  requestIdMiddleware,
  sanitizationMiddleware,
  validateRequest,
  centralErrorHandler,
} from './security/index.js';
import { createAuthRouter, requireAuth, requireRoles } from './auth/index.js';
import { createTenantRouter } from './tenant/index.js';
import { createMenuRouter } from './menu/index.js';

export function createApp(dependencies: ApiDependencies) {
  const app = express();
  const isProduction = config.NODE_ENV === 'production';

  // 1. Core identification & headers
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(createSecurityHeaders(isProduction));
  app.use(createCorsMiddleware(config.corsOrigins));

  // 2. Cookie parsing & body size limiting
  app.use(cookieParser());
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '4kb' }));

  // 3. Input sanitization (XSS mitigation)
  app.use(sanitizationMiddleware);

  // 4. CSRF protection for cookie-authenticated actions
  app.use(csrfProtection(isProduction));

  // 5. Distributed rate limiting
  const redisClient = dependencies.redisClient ?? null;
  const globalLimiter = createDistributedRateLimiter(redisClient, {
    windowMs: 15 * 60 * 1000,
    limit: 200,
    prefix: 'rl:global:',
    message: 'Too many requests. Please slow down and try again later.',
  });
  app.use(globalLimiter);

  const contactLimiter = createDistributedRateLimiter(redisClient, {
    windowMs: 60 * 1000,
    limit: 5,
    prefix: 'rl:contact:',
    message: 'Too many contact requests from this source. Please wait 1 minute.',
  });

  // -------------------------------------------------------------
  // API ROUTING & VERSIONING (/api/v1 + backward-compatible /api)
  // -------------------------------------------------------------
  const v1Router = Router();

  // Health check handler
  const handleHealth = (isV1: boolean) => async (_req: Request, res: Response) => {
    const [database, cache] = await Promise.allSettled([
      dependencies.checkDatabase(),
      dependencies.checkCache(),
    ]);
    const isHealthy = database.status === 'fulfilled' && cache.status === 'fulfilled';
    const body: Record<string, unknown> = {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'cafe-api',
      dependencies: {
        database: database.status === 'fulfilled' ? 'ok' : 'unavailable',
        cache: cache.status === 'fulfilled' ? 'ok' : 'unavailable',
      },
    };
    if (isV1) {
      body.version = 'v1';
    }
    res.status(isHealthy ? 200 : 503).json(body);
  };

  // Menu retrieval handler
  const handleMenu = async (_req: Request, res: Response) => {
    try {
      const cached = await dependencies.getCachedMenu();
      if (cached !== null) {
        res.json(cached);
        return;
      }
    } catch {
      console.warn('Menu cache read failed; querying PostgreSQL.');
    }

    const menu = await dependencies.getAvailableMenu();
    try {
      await dependencies.cacheMenu(menu);
    } catch {
      console.warn('Menu cache write failed; serving the PostgreSQL result.');
    }
    res.json(menu);
  };

  // Contact form handler with validation
  const handleContact = (_req: Request, res: Response) => {
    res.status(202).json({ accepted: true });
  };

  // CSRF token provider
  const handleCsrfToken = (req: Request, res: Response) => {
    const token = req.cookies?._cafe_csrf || generateCsrfToken();
    res.json({ csrfToken: token });
  };

  // Mount versioned v1 routes
  v1Router.get('/health', handleHealth(true));
  v1Router.get('/menu', handleMenu);
  v1Router.post(
    '/contact',
    contactLimiter,
    validateRequest({ body: contactSubmissionSchema }),
    handleContact,
  );
  v1Router.get('/csrf-token', handleCsrfToken);

  // Phase 4: Authentication & Authorization Routes
  if (dependencies.prismaClient) {
    const authRouter = createAuthRouter(dependencies.prismaClient, isProduction);
    v1Router.use('/auth', authRouter);
    app.use('/api/auth', authRouter);

    // Phase 5: Multi-Tenant SaaS Architecture Routes
    const tenantRouter = createTenantRouter(dependencies.prismaClient);
    v1Router.use('/tenants', tenantRouter);
    app.use('/api/tenants', tenantRouter);

    // Phase 7: Menu & Product Management Routes
    const menuModule = createMenuRouter(dependencies.prismaClient);
    v1Router.use('/menu', menuModule.router);
    v1Router.use('/tenants/current/menu', menuModule.protectedMenuRouter);
  }

  // RBAC Admin Route (Phase 4 Demonstration)
  v1Router.get(
    '/admin/overview',
    requireAuth,
    requireRoles('ADMIN', 'SUPER_ADMIN'),
    (req: Request, res: Response) => {
      res.json({
        status: 'success',
        data: { message: 'Welcome to Admin Operations' },
        user: req.user,
      });
    },
  );

  app.use('/api/v1', v1Router);

  // Backward-compatible unversioned aliases
  app.get('/api/health', handleHealth(false));
  app.get('/api/menu', handleMenu);
  app.post(
    '/api/contact',
    contactLimiter,
    validateRequest({ body: contactSubmissionSchema }),
    handleContact,
  );
  app.get('/api/csrf-token', handleCsrfToken);

  // 404 Route handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found.`,
        requestId: req.id,
      },
    });
  });

  // Central error handling middleware
  app.use(centralErrorHandler);

  return app;
}
