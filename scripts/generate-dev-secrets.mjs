import { randomBytes } from 'node:crypto';

const secret = () => randomBytes(32).toString('base64url');
const bootstrapPassword = secret();
const migratorPassword = secret();
const appPassword = secret();
const redisPassword = secret();

console.log(`NODE_ENV=development
API_PORT=4000
API_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
DATABASE_URL=postgresql://cafe_app:${appPassword}@localhost:5432/cafe?schema=public
DIRECT_URL=postgresql://cafe_migrator:${migratorPassword}@localhost:5432/cafe?schema=public
SHADOW_DATABASE_URL=postgresql://cafe_migrator:${migratorPassword}@localhost:5432/cafe_shadow?schema=public
REDIS_URL=redis://:${redisPassword}@localhost:6379
POSTGRES_BOOTSTRAP_USER=cafe_bootstrap
POSTGRES_BOOTSTRAP_PASSWORD=${bootstrapPassword}
DATABASE_MIGRATOR_PASSWORD=${migratorPassword}
DATABASE_APP_PASSWORD=${appPassword}
REDIS_PASSWORD=${redisPassword}
CACHE_TTL_SECONDS=300
`);
