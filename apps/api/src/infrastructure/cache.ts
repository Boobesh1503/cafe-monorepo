import { Redis } from 'ioredis';
import { menuItemSchema, type MenuItem } from '@cafe/shared';
import { config } from '../config.js';

const menuCacheKey = 'cafe:menu:v1';
export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (attempt) => (attempt < 3 ? attempt * 100 : null),
  enableOfflineQueue: false,
});

redis.on('error', () => {
  console.warn('Redis connection error; cache operations may be unavailable.');
});

export async function checkCache() {
  await redis.ping();
}

export async function getCachedMenu(): Promise<MenuItem[] | null> {
  const value = await redis.get(menuCacheKey);
  if (value === null) return null;

  try {
    const parsed = menuItemSchema.array().safeParse(JSON.parse(value));
    if (parsed.success) return parsed.data;
  } catch {
    console.warn('Cached menu data is invalid; refreshing it from PostgreSQL.');
    return null;
  }

  console.warn('Cached menu data is invalid; refreshing it from PostgreSQL.');
  return null;
}

export async function cacheMenu(items: MenuItem[]) {
  await redis.setex(menuCacheKey, config.CACHE_TTL_SECONDS, JSON.stringify(items));
}
