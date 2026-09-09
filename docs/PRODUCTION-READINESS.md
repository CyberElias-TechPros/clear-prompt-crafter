# Production-readiness ledger

Updated: 2026-09-09

## Implemented

### Frontend

- Vite/Vercel SPA with a coherent responsive workspace and explicit local demo fallback.
- API client with credentialed requests, stable error parsing, request-ID visibility, and no silent demo fallback when API mode is configured.
- Worker-backed authentication restoration, registration/login/logout/reset hooks, prompt creation, public library/detail/search/sort, likes, comments, profile, settings, service metadata, export, and provider connection status.
- Demo mode remains available only when `VITE_API_BASE_URL` is absent or when the user explicitly chooses the demo; its local state is labelled and never claims durable/server behavior.
- Public/private prompt visibility is enforced by the API as well as by the UI.

### Worker/D1

- Cloudflare Worker implementation in `workers/api/src/index.ts`.
- D1 migration with foreign keys, unique constraints, indexes, prompt sections, comments, likes, sessions, settings, service connections, tokens, and audit events.
- PBKDF2 password hashing, hashed expiring sessions, origin/CORS checks, input/body limits, allow-listed profile/settings fields, ownership checks, safe error mapping, and request IDs.
- Auth email verification/password reset hooks through Resend; missing email values produce explicit configuration errors.
- Provider adapters for OpenAI, Anthropic, and Google with Worker-only secrets, bounded inputs, timeout handling, rate-limit hooks, and safe failure mapping.
- KV-backed route/IP and per-user provider rate-limit counters when the required binding is configured.
- Explicit health/admin-health endpoints, structured request/error logs, and audit records.
- Local/staging-only SQL fixture and Wrangler/npm migration/deployment scripts.

### Deployment/documentation

- `workers/api/wrangler.toml.example` and `.dev.vars.example` define non-secret deployment inputs and secret names without committing identifiers or credentials.
- `README.md`, `docs/ARCHITECTURE.md`, and this ledger distinguish implemented code, verified checks, and deployment-dependent behavior.
- SEO metadata, canonical helpers, robots/sitemap placeholders, and no-index private routes remain in place.

## Verified in this checkout

| Check | Result |
| --- | --- |
| `npm install` | Completed. |
| `npm run typecheck` | Passed after frontend API integration. |
| `npm run worker:typecheck` | Passed for the Worker entry point and Cloudflare types. |
| `npm run build` | Run before the current Worker/frontend integration; rerun before release. |
| `npm run lint` | Run before the current integration; rerun before release. |
| `npm run check` | Newly includes Worker typecheck; rerun before release. |
| Worker type/package dry run | `npx wrangler deploy --dry-run` passed with the copied local config; no remote deployment was made. |
| Local D1 migration/fixture | `npm run db:migrate:local` and `npm run db:seed:local` passed against a local D1 database. |
| Local API smoke | Health, register/session restore, prompt create/detail/update, private visibility, like, comment, settings, origin rejection, leaderboard, and missing-provider configuration behavior were exercised against local Wrangler. |
| Browser/E2E/keyboard/responsive/accessibility | Not run in this environment. |
| Email delivery | Not live without Resend values; code returns explicit configuration failures. |
| Provider execution | Not live without provider secrets; code returns explicit `PROVIDER_NOT_CONFIGURED` and does not claim live output. |

The final release report must update this table with only commands and environments actually exercised.

## Environment-dependent release steps

1. Create staging and production D1 databases and KV namespaces.
2. Copy `workers/api/wrangler.toml.example` to the ignored `workers/api/wrangler.toml`; replace D1/KV identifiers and exact origins/URLs.
3. Apply `npm run db:migrate:local` or `npm run db:migrate:remote` only to the intended database. Use `npm run db:seed:local` only for development/staging fixtures.
4. Configure `APP_ORIGIN`, `APP_URL`, `API_URL`, verification policy, session duration, and provider model names.
5. Add `RESEND_API_KEY`, `EMAIL_FROM`, and whichever provider secrets are intentionally enabled with `wrangler secret put`.
6. Deploy the Worker and configure Vercel `VITE_API_BASE_URL` / `VITE_SITE_URL`. If using same-origin `/api`, add a Worker rewrite before the SPA fallback.
7. Run staging smoke and security checks before production cutover.

## Required staging test matrix

- registration with malformed/weak/oversized inputs, duplicate email, verification success/expiry, login failure, logout, expiry, reset, and multi-device revocation;
- direct private prompt access by a different user, changing `user_id`/role/visibility in request payloads, update/delete authorization, prompt/section transaction rollback;
- duplicate/retried/concurrent likes, comments ownership, cursor order, search escaping, max limits, and public/private list separation;
- provider missing-key, timeout, 429, malformed response, prompt access, input size, and rate-limit behavior;
- origin/CORS behavior, request IDs, audit events, error response redaction, export, migration apply, backup/restore procedure;
- no-JavaScript public metadata, keyboard navigation, mobile layout, reduced-motion behavior, and safe rendering of hostile prompt/comment text.

## Out of scope until separately decided

- billing/entitlements;
- arbitrary customer-owned API key encryption and rotation;
- real-time collaboration;
- file uploads and R2 objects;
- background notifications/queues;
- ranking integrity beyond the current aggregate leaderboard.
