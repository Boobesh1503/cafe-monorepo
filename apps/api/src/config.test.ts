import assert from 'node:assert/strict';
import test from 'node:test';
import { parseConfig } from './config.js';

const localEnvironment = {
  NODE_ENV: 'development',
  API_PORT: '4000',
  API_CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
  DATABASE_URL:
    'postgresql://cafe_app:test-app-password-with-32-characters@localhost:5432/cafe?schema=public',
  DIRECT_URL:
    'postgresql://cafe_migrator:test-migrator-password-with-32chars@localhost:5432/cafe?schema=public',
  SHADOW_DATABASE_URL:
    'postgresql://cafe_migrator:test-migrator-password-with-32chars@localhost:5432/cafe_shadow?schema=public',
  REDIS_URL: 'redis://:test-redis-password-with-32-characters@localhost:6379',
};

test('environment validation parses local URLs and applies safe defaults', () => {
  const parsed = parseConfig(localEnvironment);
  assert.equal(parsed.API_PORT, 4000);
  assert.equal(parsed.CACHE_TTL_SECONDS, 300);
});

test('environment validation rejects weak credentials without echoing them', () => {
  const weakSecret = 'short-private-value';
  assert.throws(
    () =>
      parseConfig({
        ...localEnvironment,
        DATABASE_URL: `postgresql://cafe_app:${weakSecret}@localhost:5432/cafe`,
      }),
    (error: Error) => {
      assert.match(error.message, /generated password/);
      assert.equal(error.message.includes(weakSecret), false);
      return true;
    },
  );
});

test('environment validation rejects checked-in credential placeholders', () => {
  assert.throws(() =>
    parseConfig({
      ...localEnvironment,
      DATABASE_URL:
        'postgresql://cafe_app:REPLACE_WITH_GENERATED_APP_PASSWORD@localhost:5432/cafe?schema=public',
    }),
  );
});

test('environment validation enforces separate least-privilege database roles', () => {
  assert.throws(() =>
    parseConfig({
      ...localEnvironment,
      DATABASE_URL: localEnvironment.DIRECT_URL,
    }),
  );
  assert.throws(() =>
    parseConfig({
      ...localEnvironment,
      DIRECT_URL: localEnvironment.DIRECT_URL.replace(
        'test-migrator-password-with-32chars',
        'test-app-password-with-32-characters',
      ),
    }),
  );
});

test('environment validation requires verified TLS and distinct roles in production', () => {
  const productionEnvironment = {
    NODE_ENV: 'production',
    API_PORT: '4000',
    API_CORS_ORIGINS: 'https://cafe.example.invalid',
    DATABASE_URL:
      'postgresql://cafe_app:app-password-with-at-least-32-characters@db.example.invalid:5432/cafe?sslmode=verify-full',
    DIRECT_URL:
      'postgresql://cafe_migrator:migrator-password-with-at-least-32-chars@db.example.invalid:5432/cafe?sslmode=verify-full',
    SHADOW_DATABASE_URL:
      'postgresql://cafe_migrator:migrator-password-with-at-least-32-chars@db-shadow.example.invalid:5432/cafe_shadow?sslmode=verify-full',
    REDIS_URL: 'rediss://:redis-password-with-at-least-32-characters@cache.example.invalid:6379',
  };
  assert.equal(parseConfig(productionEnvironment).NODE_ENV, 'production');
  assert.throws(() =>
    parseConfig({
      ...productionEnvironment,
      DATABASE_URL: productionEnvironment.DATABASE_URL.replace('verify-full', 'disable'),
    }),
  );
  assert.throws(() =>
    parseConfig({
      ...productionEnvironment,
      DATABASE_URL: 'not-a-database-url',
    }),
  );
});

test('environment validation rejects malformed CORS origins', () => {
  assert.throws(() =>
    parseConfig({
      ...localEnvironment,
      API_CORS_ORIGINS: 'https://user:password@example.invalid/path',
    }),
  );
});
