# Prompt-Gineer

Prompt-Gineer is a prompt engineering workspace for turning rough ideas into clear, reusable prompt systems. It combines a guided builder, a public library, comments and likes, account settings, and server-side model execution without exposing provider secrets to the browser.

The repository contains two deliberately separate runtime paths:

- **Production mode:** Vercel-hosted Vite frontend connected to the Cloudflare Worker/D1 API.
- **Local demo mode:** explicit, labelled browser-local fixtures used when `VITE_API_BASE_URL` is not set. Demo data is not an authentication, authorization, or persistence boundary.

## Product map

- **Prompt studio:** structured, conversational, and draft-refinement modes built around the CLEAR framework.
- **Prompt CRUD:** authenticated create, list, update, publish/private, and delete operations with D1 ownership checks and section transactions.
- **Community library:** public detail/list/search/sort, server-backed views, idempotent likes, comments, and cursor pagination.
- **Account:** registration, password hashing, cookie or bearer sessions, logout, email verification/reset hooks, profile/settings, data export, and service metadata.
- **AI services:** OpenAI, Anthropic, and Google provider adapters. Calls are made by the Worker using secrets; the UI never accepts or stores provider keys.
- **Operations:** request IDs, structured request logs, audit events, Worker health, KV rate limiting, scheduled token/audit cleanup, validation, origin checks, and safe error mapping.
- **SEO/accessibility:** metadata, canonicals, robots/sitemap placeholders, semantic public pages, keyboard-visible controls, responsive layouts, and reduced-motion CSS.

## Local development

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
cp .env.example .env.local # optional; omit it for the local demo
npm run dev
```

The Vite server listens on `0.0.0.0:8080` and locally at <http://localhost:8080>.

### Frontend environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Production | Worker API origin plus `/api`, for example `https://prompt-gineer-api.example.workers.dev/api`. A same-origin `/api` proxy is also supported. |
| `VITE_SITE_URL` | Production | Canonical site origin used by SEO metadata. |
| `VITE_SUPABASE_URL` | Legacy fallback only | Optional legacy auth path when Worker API mode is not configured. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Legacy fallback only | Supabase publishable/anon key. Never put provider secrets here. |

When `VITE_API_BASE_URL` is absent, the UI does **not** make placeholder API requests. It displays and persists the labelled local demo instead. When it is present, API failures are surfaced to the user and are not silently replaced with demo success.

## Checks

```bash
npm run lint
npm run typecheck
npm run worker:typecheck
npm run build
# or all of the above:
npm run check
```

The repository does not claim browser, keyboard, responsive, accessibility, or live-provider verification unless those checks have actually been run against a deployed/staged environment.

## Cloudflare API

The Worker lives in `workers/api/src/index.ts`. Its D1 schema is in `workers/api/migrations/0001_initial.sql`; the explicit development fixture is `workers/api/seed/development.sql` and must not be applied to production.

### API surface

All routes work with an `/api` prefix (the Worker also accepts direct routes without the prefix).

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Public health check with no secrets. |
| `POST` | `/api/auth/register` | Validated account creation; email verification when enabled. |
| `POST` | `/api/auth/login` / `/logout` | PBKDF2 password verification and revocable HttpOnly sessions. |
| `GET` | `/api/auth/verify` | Consume a one-time verification token. |
| `POST` | `/api/auth/forgot-password` / `/reset-password` | One-time password reset hooks through Resend. |
| `GET` | `/api/prompts` | Public prompt list with search, category, mode, sort, and cursor. |
| `GET` | `/api/prompts/:id` | Public detail or owner-only private detail; increments views. |
| `POST` | `/api/prompts` | Authenticated prompt + sections transaction. |
| `PATCH` / `DELETE` | `/api/prompts/:id` | Owner/admin update and deletion. |
| `POST` | `/api/prompts/:id/like` | Authenticated idempotent like toggle (`/likes` is an alias). |
| `GET` / `POST` | `/api/prompts/:id/comments` | Public comments for public prompts; authenticated writes. |
| `DELETE` | `/api/prompts/:id/comments/:commentId` | Comment owner/admin deletion. |
| `GET` / `PATCH` | `/api/me`, `/api/me/settings` | Profile, settings, stats, and preferences. |
| `GET` | `/api/me/prompts` / `/api/me/export` | Private library and JSON data export. |
| `GET` | `/api/services` | Supported/configured provider metadata for the account. |
| `POST` / `DELETE` | `/api/services/:service/connect` | Enable/disable a configured provider for the account. |
| `POST` | `/api/provider-runs` | Rate-limited server-side provider execution. |
| `GET` | `/api/leaderboard` | Public points leaderboard. |
| `GET` | `/api/admin/health` | Admin-only dependency/configuration check. |

Responses are JSON and include `X-Request-ID`. Client errors expose stable codes; unexpected errors do not expose stack traces or provider responses.

### Worker setup

The tracked `workers/api/wrangler.toml.example` is a safe deployment template. Copy it to `workers/api/wrangler.toml`, create the D1 database and KV namespace, and replace only the deployment identifiers and origins:

```bash
cp workers/api/wrangler.toml.example workers/api/wrangler.toml
npx wrangler d1 create prompt-gineer
npx wrangler kv namespace create RATE_LIMIT
# put the printed ids into wrangler.toml
npm run db:migrate:local
npm run worker:dev
```

For production, review the schema in staging first, then run:

```bash
npm run db:migrate:remote
npm run worker:deploy
```

The seed file is intentionally explicit:

```bash
npm run db:seed:local
# Never run db:seed:remote against a production database.
```

`.dev.vars.example` is the local secret template. The real `.dev.vars` and `wrangler.toml` are ignored and must never be committed.

## Secrets and deployment variables

Set non-secret configuration in `wrangler.toml`:

- `APP_ORIGIN`: exact Vercel origin(s), comma-separated only when needed for controlled previews.
- `APP_URL`: frontend origin used for reset links.
- `API_URL`: public Worker origin used for verification links when the Worker is not behind same-origin `/api`.
- `REQUIRE_EMAIL_VERIFICATION=true`, `SESSION_DAYS`, and provider model names.

Set secrets with Wrangler; never use `VITE_` variables for these values:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GOOGLE_AI_API_KEY
```

If email/provider secrets are absent, their paths return an explicit configuration error; the application does not claim that email delivery or provider execution is live. If verification is intentionally disabled for a controlled local environment, set `REQUIRE_EMAIL_VERIFICATION=false` only in local vars.

## Vercel frontend

1. Import the repository into Vercel.
2. Use `npm run build` with output directory `dist`.
3. Set `VITE_SITE_URL` and `VITE_API_BASE_URL` to the deployed Worker API, or merge `vercel.worker.json.example` into `vercel.json`, replace `REPLACE_WITH_WORKER_HOST`, and use `/api` as the frontend base.
4. Keep the SPA fallback in `vercel.json` after the API rewrite; API traffic must not be rewritten to `index.html`.
5. Replace the placeholder domain in `public/robots.txt` and `public/sitemap.xml`.
6. Run staging smoke checks before enabling production writes.

## Security and operations

- Passwords are PBKDF2-derived in the Worker; sessions store only SHA-256 token hashes in D1 and are revocable/expiring.
- Mutating requests validate JSON size, field lengths, modes, section types, tags, URLs, ownership, and allowed settings. Prompt text is never treated as HTML.
- Cookie-backed mutating requests are origin-checked. CORS allows only configured origins and credentials are not exposed to arbitrary origins.
- Provider keys remain Worker secrets. Provider calls have timeouts, safe error mapping, per-user rate-limit hooks, and no raw response logging.
- D1 foreign keys, unique likes, section ordering, audit events, and explicit migration history protect consistency. KV is only a short-lived edge rate-limit counter, not a source of truth.
- Request IDs are returned to clients and structured request/error logs are emitted without passwords, raw sessions, provider keys, or prompt content.
- The browser route guard is UX only; every protected API route independently authenticates and authorizes.

## Demo mode

Choose **Open the demo workspace** on `/auth`, or **Open studio** from the landing page. Demo mode stores a demo session flag, fixture prompts, settings, and connection status in browser storage. It never sends drafts to a provider. Use Settings → Clear local cache to remove demo-only records.

## Legacy Supabase notes

The original Supabase migrations and client remain as historical/legacy fallback evidence. They are not the production architecture described above. Do not enable the legacy provider-key function; it is not a safe secret store. A Worker API deployment should be configured before handling real private data.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/PRODUCTION-READINESS.md`](docs/PRODUCTION-READINESS.md) for decisions, migration safeguards, threat-model checks, and verification status.
