# Hearth & Hill Cafe

Monorepo foundation for an independent neighborhood cafe. It contains a
customer website, future-facing admin dashboard, Express API, shared TypeScript
contracts, and an independently managed Flutter app. Local development uses
PostgreSQL and authenticated Redis through Docker Compose. **No checkout,
payment, cloud resources, or deployment is included.**

## Requirements

- Node.js 20.11 or newer
- pnpm 9 or newer (the repository pins pnpm 10.12.1 through Corepack)
- Docker with the Compose plugin
- Flutter stable SDK (only for `apps/mobile`)

```sh
corepack prepare pnpm@10.12.1 --activate
corepack pnpm install
```

## Local configuration

Generate strong local-only credentials, copy `apps/api/.env.example` to the
ignored `apps/api/.env`, and paste the generated assignments into that file:

```sh
corepack pnpm secrets:generate:dev
```

Keep the output private; it contains local credentials. Copy the web/admin
examples to `.env.local` in their respective app folders. The root
`.env.example` and environment profile files are inventories, not loaded
automatically. Staging and production templates use reserved `example.invalid`
hosts and must be replaced through an approved secret manager before deployment.

## Run locally

```sh
corepack pnpm infra:up
corepack pnpm db:migrate
corepack pnpm dev
```

| Area             | Address               | Command                                  |
| ---------------- | --------------------- | ---------------------------------------- |
| Customer site    | http://localhost:3000 | `corepack pnpm --filter @cafe/web dev`   |
| Admin foundation | http://localhost:3001 | `corepack pnpm --filter @cafe/admin dev` |
| API              | http://localhost:4000 | `corepack pnpm --filter @cafe/api dev`   |

`corepack pnpm dev` starts the three JavaScript services in parallel.
PostgreSQL and Redis run separately in Docker, bound only to localhost. The API
health endpoint checks both services; it returns `503` and safe dependency
statuses when one is unavailable.

The API reads available menu items from PostgreSQL and caches them in Redis.
The new database starts empty; no menu seed data is installed. The website
shows a friendly empty-menu message until menu records exist. Contact
submissions are validated and acknowledged but are not stored or forwarded.
Menu prices, cafe address, hours, and contact details shown in the starter UI
are illustrative placeholders and must be confirmed before public use.

Stop the local services without removing their data:

```sh
corepack pnpm infra:down
corepack pnpm db:status
corepack pnpm db:studio
```

Removing the named Docker volumes permanently deletes local database/cache
data.

The Flutter app is not part of the pnpm workspace:

```sh
cd apps/mobile
flutter pub get
flutter run
```

## Workspace commands

```sh
corepack pnpm build
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm format:check
corepack pnpm secrets:check    # requires the gitleaks CLI
corepack pnpm db:deploy        # apply reviewed migrations in a deployment
```

Run a package script with `corepack pnpm --filter @cafe/web <script>` (or
`@cafe/admin`, `@cafe/api`, `@cafe/shared`). Build uses Next.js for both web
apps and TypeScript for API/shared code. Flutter checks are `flutter analyze`
and `flutter test` from `apps/mobile`.

## Layout

See [docs/project-structure.md](docs/project-structure.md) for a detailed guide
to the Phase 1 and Phase 2 folders. Infrastructure details, role boundaries,
and production security planning are in
[docs/infrastructure.md](docs/infrastructure.md).

## Environments and secrets

The API validates database URLs, TLS settings, Redis authentication, allowed
origins, and cache TTL through Zod at startup. `DATABASE_URL` is the restricted
runtime role; `DIRECT_URL` is the migration role. Keep credentials in ignored
local `.env` files or an approved production secret store. Never commit real
credentials, API keys, customer data, or connection strings. See
[docs/environments.md](docs/environments.md).

## Branching and required checks

See [docs/branching-and-protection.md](docs/branching-and-protection.md).
CI runs workspace checks and Gitleaks on pull requests. No cloud infrastructure
is provisioned by this repository.
