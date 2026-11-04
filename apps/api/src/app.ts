import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { contactSubmissionSchema, type MenuItem } from '@cafe/shared';
import { config } from './config.js';

const menu: MenuItem[] = [
  {
    id: 'hilltop-flat-white',
    name: 'Hilltop Flat White',
    description: 'Double espresso, silky steamed milk.',
    priceCents: 480,
    category: 'coffee',
    tags: ['house favorite'],
    available: true,
  },
  {
    id: 'brown-butter-cookie',
    name: 'Brown Butter Cookie',
    description: 'A little crisp at the edge, soft in the middle.',
    priceCents: 350,
    category: 'bakery',
    tags: ['baked daily'],
    available: true,
  },
  {
    id: 'maple-oat-latte',
    name: 'Maple Oat Latte',
    description: 'Our espresso with oat milk and a touch of maple.',
    priceCents: 560,
    category: 'coffee',
    tags: ['plant based'],
    available: true,
  },
  {
    id: 'garden-mint-tea',
    name: 'Garden Mint Tea',
    description: 'A bright, calming cup from our favorite local blender.',
    priceCents: 390,
    category: 'tea',
    tags: ['caffeine free'],
    available: true,
  },
];

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'cafe-api' });
});

app.get('/api/menu', (_request, response) => {
  response.json(menu.filter((item) => item.available));
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

    // Phase 1 does not persist or forward personal information.
    response.status(202).json({ accepted: true });
  },
);

app.use((_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

const errors: ErrorRequestHandler = (error, _request, response) => {
  if (error instanceof SyntaxError) {
    response
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' } });
    return;
  }
  response
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } });
};
app.use(errors);
