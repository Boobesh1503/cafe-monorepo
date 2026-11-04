import type { MenuItem } from '@cafe/shared';
import { cacheMenu, checkCache, getCachedMenu } from './cache.js';
import { checkDatabase, getAvailableMenu } from './database.js';

export interface ApiDependencies {
  checkDatabase: () => Promise<void>;
  checkCache: () => Promise<void>;
  getCachedMenu: () => Promise<MenuItem[] | null>;
  cacheMenu: (items: MenuItem[]) => Promise<void>;
  getAvailableMenu: () => Promise<MenuItem[]>;
}

export const apiDependencies: ApiDependencies = {
  checkDatabase,
  checkCache,
  getCachedMenu,
  cacheMenu,
  getAvailableMenu,
};
