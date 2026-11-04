# Environment configuration

| Profile           | Template                   | Intended use                                             |
| ----------------- | -------------------------- | -------------------------------------------------------- |
| Local development | `.env.development.example` | Local-only defaults and localhost origins                |
| Staging           | `.env.staging.example`     | Inventory of non-production settings; reserved hostnames |
| Production        | `.env.production.example`  | Inventory of production settings; reserved hostnames     |

Copy `apps/api/.env.example` to the ignored `apps/api/.env`; copy the web/admin
examples to the respective `.env.local` files in those app folders. The root
`.env.example` and profile templates are configuration inventories and are not
loaded automatically. Staging/production templates contain no credentials and
are not deployment instructions. A future environment must supply its real
values through an approved configuration store, validate origins and URLs, and
avoid reusing development data. Never commit `.env`, secrets, or customer data.

The API reads `NODE_ENV`, `API_PORT`, and `API_CORS_ORIGINS`. The public web app
reads `NEXT_PUBLIC_API_BASE_URL` at build/runtime. The API currently uses
in-memory/static menu content and has no database or migration requirement in
Phase 1.
