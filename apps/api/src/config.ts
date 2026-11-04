import 'dotenv/config';
import { z } from 'zod';

const databaseUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('postgresql://'), 'must use postgresql://');
const redisUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith('redis://') || value.startsWith('rediss://'), {
    message: 'must use redis:// or rediss://',
  });
const corsOriginsSchema = z.string().refine(
  (value) =>
    value.split(',').every((origin) => {
      try {
        const url = new URL(origin.trim());
        return url.origin === origin.trim() && !url.username && !url.password;
      } catch {
        return false;
      }
    }),
  'must be a comma-separated list of valid origins',
);
const secretUrl = <T extends z.ZodType<string>>(schema: T) =>
  schema.refine((value) => {
    try {
      const password = new URL(value).password;
      return password.length >= 32 && !password.startsWith('REPLACE_');
    } catch {
      return false;
    }
  }, 'must contain a generated password of at least 32 characters');
const databaseUrlForRole = (role: 'cafe_app' | 'cafe_migrator') =>
  secretUrl(databaseUrlSchema).refine((value) => {
    try {
      return new URL(value).username === role;
    } catch {
      return false;
    }
  }, `must use the ${role} database role`);

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_CORS_ORIGINS: corsOriginsSchema.default('http://localhost:3000,http://localhost:3001'),
  DATABASE_URL: databaseUrlForRole('cafe_app'),
  DIRECT_URL: databaseUrlForRole('cafe_migrator'),
  SHADOW_DATABASE_URL: databaseUrlForRole('cafe_migrator'),
  REDIS_URL: secretUrl(redisUrlSchema),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(300),
});

const isLocalHost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

const productionConnectionsAreSecure = (values: z.infer<typeof configSchema>) => {
  try {
    const appDatabase = new URL(values.DATABASE_URL);
    const migrationDatabase = new URL(values.DIRECT_URL);
    const shadowDatabase = new URL(values.SHADOW_DATABASE_URL);
    const cache = new URL(values.REDIS_URL);
    const origins = values.API_CORS_ORIGINS.split(',').map((origin) => new URL(origin.trim()));
    return (
      appDatabase.searchParams.get('sslmode') === 'verify-full' &&
      migrationDatabase.searchParams.get('sslmode') === 'verify-full' &&
      shadowDatabase.searchParams.get('sslmode') === 'verify-full' &&
      cache.protocol === 'rediss:' &&
      !isLocalHost(appDatabase.hostname) &&
      !isLocalHost(migrationDatabase.hostname) &&
      !isLocalHost(shadowDatabase.hostname) &&
      !isLocalHost(cache.hostname) &&
      appDatabase.username !== migrationDatabase.username &&
      appDatabase.password !== migrationDatabase.password &&
      origins.every((origin) => origin.protocol === 'https:')
    );
  } catch {
    return false;
  }
};

const validatedConfigSchema = configSchema.superRefine((values, context) => {
  try {
    if (new URL(values.DATABASE_URL).password === new URL(values.DIRECT_URL).password) {
      context.addIssue({
        code: 'custom',
        path: ['DIRECT_URL'],
        message: 'must use a different credential from the application database role',
      });
    }
    if (new URL(values.DIRECT_URL).password !== new URL(values.SHADOW_DATABASE_URL).password) {
      context.addIssue({
        code: 'custom',
        path: ['SHADOW_DATABASE_URL'],
        message: 'must use the migration role credential',
      });
    }
  } catch {
    return;
  }
  if (values.NODE_ENV === 'production' && !productionConnectionsAreSecure(values)) {
    context.addIssue({
      code: 'custom',
      path: ['DATABASE_URL'],
      message:
        'production requires distinct database roles, verified TLS, remote hosts, and HTTPS CORS origins',
    });
  }
});

export function parseConfig(environment: NodeJS.ProcessEnv) {
  const parsed = validatedConfigSchema.safeParse(environment);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid API configuration: ${details}`);
  }
  return parsed.data;
}

const values = parseConfig(process.env);
export const config = {
  ...values,
  corsOrigins: values.API_CORS_ORIGINS.split(',').map((origin) => origin.trim()),
};
