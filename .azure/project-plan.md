# Cafe Monorepo Project Plan

## Goal

Create a secure, maintainable Phase 1 foundation for a cafe product in a pnpm
monorepo. The repository includes a customer-facing website, an admin
dashboard, an Express API, shared TypeScript contracts and API client, and a
Flutter mobile app.

## Scope

- `apps/web`: Next.js cafe website with a home page, menu presentation, and
  contact section. No checkout or payment processing in Phase 1.
- `apps/admin`: Next.js admin dashboard foundation for future cafe operations.
- `apps/api`: Node.js, Express, and TypeScript API foundation.
- `packages/shared`: shared TypeScript types/contracts and API client.
- `apps/mobile`: standalone Flutter application; Flutter tooling is not managed
  by pnpm.
- Root pnpm workspace, lockfile, shared lint/format/type-check configuration,
  environment templates, and CI checks.
- Secure `.gitignore`, `.env.example` files, Gitleaks configuration/check, and
  branch strategy/protection guidance. Never include real credentials.
- Dev, staging, and production configuration separation without provisioning
  infrastructure or deploying.

## Design direction

Use an inviting, premium neighborhood-cafe identity with readable typography
and accessible color contrast:

- Espresso brown for strong text and grounding elements.
- Warm cream for primary surfaces and backgrounds.
- Muted terracotta for the main brand/action accent.
- Sage green as a restrained supporting accent.

Use subtle, purposeful motion for page entrance, menu-card hover/focus, and
navigation feedback. Respect reduced-motion preferences and avoid motion that
interferes with reading or interaction.

## Architecture and conventions

- Use pnpm workspaces for JavaScript/TypeScript projects; keep Flutter as an
  independently managed app in the same repository.
- Use TypeScript for Next.js, Express, and shared packages.
- Keep secrets out of source control; commit only clearly fake example values.
- Validate the JavaScript/TypeScript workspace with the repository's configured
  lint, format, type-check, build, and test commands.
- Document local setup, package scripts, environment configuration, GitHub
  branch strategy, and required branch protections.

## Phase 1 acceptance criteria

- A complete, understandable monorepo layout with all five app/package areas.
- Workspace install and documented development commands.
- Both Next.js apps and the Express API have runnable starter entry points.
- Shared types/API client are wired into the workspace.
- Flutter has a runnable starter app and setup instructions.
- Environment examples, lockfile, secret scanning, and CI checks are present.
- No live secrets, deployment, payments, or production infrastructure are
  introduced.
