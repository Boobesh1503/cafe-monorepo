# Integration hand-off — Hearth & Hill Phase 1

## Backend

- Folder: `apps/api`
- Start from workspace root: `corepack pnpm --filter @cafe/api dev`
- Port: `4000` (`API_PORT`, defaults to `4000`)
- Build: `corepack pnpm --filter @cafe/api build`
- Health: `GET /api/health`

## Frontend

- Folder: `apps/web`
- Dev: `corepack pnpm --filter @cafe/web dev` (port `3000`)
- Build: `corepack pnpm --filter @cafe/web build`
- Live-data seam: `apps/web/src/api/index.ts` (`getMenuForDisplay`)
- Preview mock to remove after live wiring: `apps/web/src/api/mockClient.ts`
- No `src/mocks/` directory, local duplicate contracts, preview-state switcher,
  or corner switcher exists.
- API base URL: `NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.local`
  (defaults to `http://localhost:4000`)

## API route inventory

- `GET /api/health` → `200 { status: "ok", service: "cafe-api" }`
- `GET /api/menu` → `200 MenuItem[]` (shared Zod contract)
- `POST /api/contact` → validates `{ name, email, message }`; responds `202`
  with `{ accepted: true }` when valid, `400` when invalid; limited to five
  requests per minute. Phase 1 does not persist or forward contact data.

## Database and migrations

- Database: none in the approved Phase 1 scope.
- Migration tool/directory/connection variables: none.
- Do not add a database or migration framework for this hand-off. **NO seed data.**

## Shared contracts and services

- Shared package: `packages/shared`, imported as `@cafe/shared`.
- Essential: `apps/web`, `apps/api`, `packages/shared`.
- Enhancement foundations: `apps/admin`, `apps/mobile`.
- Contact/address/hours/menu values are illustrative placeholders; confirm them
  before any public release.
