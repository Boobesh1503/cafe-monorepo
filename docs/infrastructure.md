# Database, cache, and backend infrastructure

## Local development

Requirements: Docker with the Compose plugin, Node.js, and pnpm.

1. Run `corepack pnpm secrets:generate:dev` and copy its output into
   `apps/api/.env` (copied from `apps/api/.env.example`). Keep this file private
   and untracked.
2. Run `corepack pnpm infra:up`. PostgreSQL and Redis are available only on
   loopback (`127.0.0.1`) and communicate with each other over an isolated
   Compose network. Both services have authenticated health checks.
3. Run `corepack pnpm db:migrate` to apply the checked-in Prisma migration.
4. Run `corepack pnpm dev` to start the API and Next.js applications.

`corepack pnpm infra:down` stops the services but preserves their named
volumes. Removing the volumes deletes local data. The database starts without
menu records; no seed data is installed.

## PostgreSQL and Prisma

- `DATABASE_URL` uses `cafe_app`, a non-superuser, read-only runtime role with
  schema usage and table `SELECT` access, but no write or schema-creation
  privileges. This matches the current read-only menu API.
- `DIRECT_URL` uses `cafe_migrator`, a separate non-superuser role that owns the
  application database/schema and applies migrations.
- `SHADOW_DATABASE_URL` uses that migration role against a separate local
  `cafe_shadow` database. Prisma uses it only for `migrate dev` drift detection;
  it must never point to the application database. Prisma's schema requires a
  valid shadow URL setting when loading the schema, but `migrate deploy` does
  not connect to the shadow database; production migration jobs should inject
  the value through the secret manager and must not run the development flow.
- `cafe_bootstrap` is only used by the local container's one-time initialization
  script to create the roles and local shadow database. It is not used by the
  API or migration commands.
- `apps/api/prisma/schema.prisma` defines the menu schema. Migration SQL is
  versioned under `apps/api/prisma/migrations/`; migration files are reviewed
  and committed.

Use `corepack pnpm db:migrate` for local development and
`corepack pnpm db:deploy` to apply already-reviewed migrations in a deployment
pipeline. Do not run development migration generation automatically in
production. `corepack pnpm db:status` reports migration state.

The API reads available menu items from PostgreSQL and caches them in Redis for
the configured `CACHE_TTL_SECONDS`. If Redis is temporarily unavailable, it
logs a credential-safe warning and serves the PostgreSQL result. The current
phase has no menu-editing endpoint, so it does not need cache invalidation for
writes. Contact data is validated but never persisted.

## Health and failure behavior

`GET /api/health` checks both PostgreSQL and Redis. It returns `200` with
dependency statuses when healthy, or `503` and only the affected dependency
status when unhealthy. Connection strings and raw driver errors are not sent to
clients. API startup rejects invalid configuration and production URLs that do
not require TLS.

## Production security plan (not deployed)

- Store database URLs and Redis credentials in the selected hosting provider's
  managed secret service (for example Azure Key Vault when hosted on Azure);
  inject them at runtime using workload identity rather than baking them into
  images or source control. Rotate secrets and audit access.
- Use private network endpoints/firewall rules so PostgreSQL and Redis have no
  public ingress. Permit connections only from the API and controlled migration
  runner.
- Keep separate runtime and migration database identities. Grant the runtime
  role only the specific table operations it needs (currently `SELECT` only);
  never use the bootstrap or migration identity in the API.
- Require verified TLS for PostgreSQL and Redis. Production API configuration
  rejects non-TLS URLs and local hosts.
- Use a private Redis endpoint with authentication (and TLS); restrict network
  access to the API. Do not expose cache/database ports publicly.
- Configure and verify backups, retention, recovery, monitoring, rotation, and
  alerting before deploying. None of these production resources are provisioned
  by this repository.
