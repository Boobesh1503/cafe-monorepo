import type { MenuItem } from '@cafe/shared';
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import { cacheMenu, checkCache, getCachedMenu, redis } from './cache.js';
import { checkDatabase, getAvailableMenu, prisma } from './database.js';

export interface ApiDependencies {
  checkDatabase: () => Promise<void>;
  checkCache: () => Promise<void>;
  getCachedMenu: () => Promise<MenuItem[] | null>;
  cacheMenu: (items: MenuItem[]) => Promise<void>;
  getAvailableMenu: () => Promise<MenuItem[]>;
  redisClient?: Redis | null;
  prismaClient?: PrismaClient;
}

export const apiDependencies: ApiDependencies = {
  checkDatabase,
  checkCache,
  getCachedMenu,
  cacheMenu,
  getAvailableMenu,
  redisClient: redis,
  prismaClient: prisma,
};
