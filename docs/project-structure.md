# Project folder guide

## Phase 1 folders

- `apps/` contains the independently runnable applications.
  - `apps/web/` is the public Next.js cafe website. `src/app/` contains its App
    Router pages, layout, and styles; `src/components/` contains reusable
    website sections and illustrations; `src/api/` contains its server-side
    client for the live cafe API.
  - `apps/admin/` is the separate Next.js operations-dashboard shell.
    `src/app/` contains its page, layout, and styles.
  - `apps/api/` is the Express/TypeScript backend. `src/` contains API,
    configuration, server, tests, and infrastructure client code.
  - `apps/mobile/` is the standalone Flutter app.
    - `lib/` contains the Dart application UI and entry point; `test/` contains
      widget tests.
    - `web/` contains the Flutter web bootstrap, manifest, and `icons/` for the
      installed web app.
    - `android/` contains the Android Studio/Gradle project. `app/src/main/`
      holds the app manifest, Kotlin entry point, launch drawables, and
      density-specific launcher icons under `res/mipmap-*`. `src/debug/` and
      `src/profile/` contain build-mode manifests. `gradle/wrapper/` pins the
      Gradle wrapper version.
    - `ios/Flutter/` contains Flutter build settings for Xcode.
      `ios/Runner/` contains the native iOS app delegate, launch setup, and
      `Assets.xcassets/` app/launch images; `Base.lproj/` contains localized
      storyboards. `Runner.xcodeproj/` and `Runner.xcworkspace/` are Xcode
      project/workspace metadata; `RunnerTests/` contains native runner tests.
    - `.dart_tool/`, `build/`, `ios/Flutter/ephemeral/`, local Android
      properties, and IDE state are generated or machine-specific and ignored.
- `packages/` contains code shared across workspace apps.
  - `packages/shared/src/` contains shared TypeScript contracts, validation
    schemas, API client, and contract tests.
- `.github/` contains GitHub contribution and automation files.
  - `.github/workflows/` contains CI validation and secret scanning.
- `.azure/` contains the approved project scope in `project-plan.md`.
- `docs/` contains setup, environment, branch-protection, infrastructure, and
  folder-purpose documentation.

Root configuration files define pnpm workspaces, dependency lock versions,
TypeScript/ESLint/Prettier settings, safe environment templates, and Git ignore
rules. Root `node_modules/`, app `.next/`, build output, and local `.env` files
are generated or private and must not be committed.

## Phase 2 additions

- `infra/` contains local development infrastructure.
  - `infra/docker-compose.yml` runs PostgreSQL and authenticated Redis with
    loopback-only host ports and a private Compose network.
  - `infra/postgres/init/` contains the one-time database role initializer. It
    creates separate migration and read-only application roles plus the
    migration shadow database.
- `apps/api/prisma/` contains the database model and migrations.
  - `apps/api/prisma/migrations/` contains ordered, versioned SQL schema
    changes. `20261104154500_init/` creates the initial menu schema; Prisma uses
    migrations to create/update the database.
- `apps/api/src/infrastructure/` contains PostgreSQL and Redis client setup,
  health checks, and API dependency wiring.
- `scripts/` contains repository maintenance utilities.
  - `scripts/generate-dev-secrets.mjs` generates strong local-only credentials
    and prints environment assignments; its output belongs in the ignored
    `apps/api/.env`, never in Git.
