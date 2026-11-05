import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { type AnyZodObject, ZodError } from 'zod';

export interface RequestValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validateRequest(schemas: RequestValidationSchemas): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        Object.assign(req.params, parsedParams);
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        Object.assign(req.query, parsedQuery);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          rule: issue.code,
        }));

        res.status(400).json({
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid request data provided.',
            requestId: req.id,
            details,
          },
        });
        return;
      }
      next(error);
    }
  };
}
