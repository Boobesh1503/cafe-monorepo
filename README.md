# Hearth & Hill Cafe

Phase 1 monorepo foundation for an independent neighborhood cafe. It contains a
customer website, future-facing admin dashboard, Express API, shared TypeScript
contracts, and an independently managed Flutter app. **No checkout, payment,
cloud resources, or deployment is included.**

## Requirements

- Node.js 20.11 or newer
- pnpm 9 or newer (the repository pins pnpm 10.12.1 through Corepack)
- Flutter stable SDK (only for `apps/mobile`)

```sh
corepack prepare pnpm@10.12.1 --activate
corepack pnpm install
```

Local app configuration is loaded from each app folder:

Copy `apps/api/.env.example` to `apps/api/.env`, and copy the web/admin
examples to `.env.local` in their respective app folders.

These are optional local defaults; ignored local files need no secrets. The root
`.env.example` and profile templates are configuration inventories, not loaded
automatically. Staging and production templates use reserved `example.invalid`
hostnames and must be replaced through an approved secret/configuration system
before any future deployment.

## Run locally

```sh
corepack pnpm dev
```

| Area             | Address               | Command                                |
| ---------------- | --------------------- | -------------------------------------- |
| Customer site    | http://localhost:3000 | `corepack pnpm --filter @cafe/web dev` |
| Admin foundation | http://localhost:3001 | `pnpm --filter @cafe/admin dev`        |
| API              | http://localhost:4000 | `pnpm --filter @cafe/api dev`          |

`corepack pnpm dev` starts those three JavaScript services in parallel. The API has
`GET /api/health`, `GET /api/menu`, and a validation-only
`POST /api/contact` endpoint. Contact submissions are acknowledged but are not
stored or sent anywhere in Phase 1. The website uses a local mock menu behind a
single API seam until integration is configured.
Menu prices, cafe address, hours, and contact details shown in the starter UI
are illustrative placeholders and must be confirmed before public use.

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
```

Run a package script with `corepack pnpm --filter @cafe/web <script>` (or `@cafe/admin`,
`@cafe/api`, `@cafe/shared`). Build uses Next.js for both web apps and TypeScript
for API/shared code. Flutter checks are `flutter analyze` and `flutter test`
from `apps/mobile`.

## Layout

```text
apps/
  admin/       Next.js operations-dashboard shell
  api/         Express API, health/menu/contact endpoints
  mobile/      Standalone Flutter starter
  web/         Next.js public cafe website
packages/
  shared/      Zod contracts, shared types, API client
docs/          Setup, environments, branch protections
.github/       CI and contribution templates
```

## Environments and secrets

Use `.env.example` as the local starting point and the environment-specific
`*.example` files as configuration inventories, not as deployable secrets.
Keep credentials in a local ignored `.env` or an approved environment/secret
store. Never put real credentials, API keys, customer data, or connection
strings in source, logs, screenshots, pull requests, or example files.

## Branching and required checks

See [docs/branching-and-protection.md](docs/branching-and-protection.md) and
[docs/environments.md](docs/environments.md). CI runs workspace checks and
Gitleaks on pull requests. Configure the `validate` check as required in GitHub
branch protection; this repository intentionally does not configure or
provision any cloud infrastructure.
