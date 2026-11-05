import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const centralErrorHandler: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next;

  const requestId = req.id || 'unknown';

  // 1. JSON parse syntax error
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request payload contains malformed JSON syntax.',
        requestId,
      },
    });
    return;
  }

  // 2. Body limit exceeded (Oversized request protection)
  if (
    error &&
    typeof error === 'object' &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload size exceeds the allowable limit.',
        requestId,
      },
    });
    return;
  }

  // 3. CORS origin rejected
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'CORS_NOT_ALLOWED'
  ) {
    const errorMsg = error instanceof Error ? error.message : 'Origin is not allowed by CORS';
    res.status(403).json({
      error: {
        code: 'CORS_NOT_ALLOWED',
        message: errorMsg,
        requestId,
      },
    });
    return;
  }

  // 4. Custom application errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    });
    return;
  }

  // 5. Unexpected Internal Server Error
  // Mask details in all environments; do not leak database strings, passwords, or file paths
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[INTERNAL_ERROR][${requestId}]:`, error instanceof Error ? error.message : error);
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact support with the requestId.',
      requestId,
    },
  });
};
