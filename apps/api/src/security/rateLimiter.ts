import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Redis } from 'ioredis';

export interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  prefix?: string;
  message?: string;
}

export function createDistributedRateLimiter(
  redisClient: Redis | null,
  options: RateLimiterOptions,
): RateLimitRequestHandler {
  const { windowMs, limit, prefix = 'rl:', message = 'Too many requests, please try again later.' } = options;

  let store: Options['store'] | undefined;

  if (redisClient && redisClient.status === 'ready') {
    try {
      store = new RedisStore({
        // @ts-expect-error - ioredis call signature compatibility
        sendCommand: (...args: string[]) => redisClient.call(...args),
        prefix,
      });
    } catch {
      // Fallback to in-memory store
      store = undefined;
    }
  }

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: true,
    validate: { trustProxy: false, xForwardedForHeader: false },
    store,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterMs: windowMs,
      },
    },
  });
}
