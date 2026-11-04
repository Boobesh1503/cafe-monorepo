import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { contactSubmissionSchema } from '@cafe/shared';
import { config } from './config.js';
import type { ApiDependencies } from './infrastructure/dependencies.js';

export function createApp(dependencies: ApiDependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', async (_request, response) => {
    const [database, cache] = await Promise.allSettled([
      dependencies.checkDatabase(),
      dependencies.checkCache(),
    ]);
    const isHealthy = database.status === 'fulfilled' && cache.status === 'fulfilled';
    response.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'cafe-api',
      dependencies: {
        database: database.status === 'fulfilled' ? 'ok' : 'unavailable',
        cache: cache.status === 'fulfilled' ? 'ok' : 'unavailable',
      },
    });
  });

  app.get('/api/menu', async (_request, response) => {
    try {
      const cached = await dependencies.getCachedMenu();
      if (cached !== null) {
        response.json(cached);
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
    response.json(menu);
  });

  app.post(
    '/api/contact',
    rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false }),
    (request, response) => {
      const submission = contactSubmissionSchema.safeParse(request.body);
      if (!submission.success) {
        response.status(400).json({
          error: { code: 'INVALID_CONTACT', message: 'Please check the contact form fields.' },
        });
        return;
      }

      response.status(202).json({ accepted: true });
    },
  );

  app.use((_request, response) => {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  });

  const errors: ErrorRequestHandler = (error, _request, response, _next) => {
    void _next;
    if (error instanceof SyntaxError) {
      response
        .status(400)
        .json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' } });
      return;
    }
    console.error('Request failed; error details suppressed to protect configuration and data.');
    response
      .status(500)
      .json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } });
  };
  app.use(errors);

  return app;
}
