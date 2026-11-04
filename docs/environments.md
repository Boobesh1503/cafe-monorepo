# Environment configuration

| Profile           | Template                   | Intended use                                             |
| ----------------- | -------------------------- | -------------------------------------------------------- |
| Local development | `.env.development.example` | Local-only defaults and localhost origins                |
| Staging           | `.env.staging.example`     | Inventory of non-production settings; reserved hostnames |
| Production        | `.env.production.example`  | Inventory of production settings; reserved hostnames     |

Generate local credentials with `corepack pnpm secrets:generate:dev`, copy
`apps/api/.env.example` to the ignored `apps/api/.env`, and paste the generated
values into that private file. Docker Compose and the API read it. Copy the
web/admin examples to the respective `.env.local` files in those app folders.
The root `.env.example` and profile templates are configuration inventories
and are not loaded automatically. Staging/production templates contain no
credentials and are not deployment instructions.

The API validates `NODE_ENV`, `API_PORT`, `API_CORS_ORIGINS`, `DATABASE_URL`,
`DIRECT_URL`, `SHADOW_DATABASE_URL`, `REDIS_URL`, and `CACHE_TTL_SECONDS` with Zod. Production mode
requires TLS-protected PostgreSQL URLs, TLS-protected Redis, non-local hosts,
and generated credentials of at least 32 characters. The public web app reads
`NEXT_PUBLIC_API_BASE_URL` at build/runtime.

For production, inject values from an approved managed secret service at
runtime. Do not copy development credentials or data. Never commit `.env`,
secrets, or customer data.
