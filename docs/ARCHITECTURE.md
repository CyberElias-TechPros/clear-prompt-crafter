# Architecture and decision record

Updated: 2026-09-09

## Product boundary

Prompt-Gineer is a prompt engineering workspace with a public prompt library. The strong repository evidence supports the builder's structured/conversational/refinement modes, prompt sections, public prompts, likes/comments, accounts, settings, service metadata, profiles, and contribution points. Billing, real-time collaboration, rich attachments, and arbitrary provider-key storage remain out of scope until a separate product decision exists.

## Runtime topology

```text
Vercel (Vite React SPA)
  ├── public pages + explicit local demo fallback when VITE_API_BASE_URL is absent
  └── API requests with credentials
        └── Cloudflare Worker (/api)
              ├── D1: accounts, sessions, prompts, sections, likes, comments, settings, audit events
              ├── KV: short-lived edge rate-limit counters
              └── provider/email HTTPS calls using Worker secrets
```

The browser never calls localhost or a provider directly. In production, set `VITE_API_BASE_URL` to the Worker `/api` origin or merge `vercel.worker.json.example` into `vercel.json` for a same-origin Vercel rewrite. The current `vercel.json` keeps the SPA fallback; an API rewrite must be placed before that fallback when same-origin routing is selected.

## Implemented Worker contract

The implementation is in `workers/api/src/index.ts`; the D1 schema is in `workers/api/migrations/0001_initial.sql`.

| Method | Route | Authorization / behavior |
| --- | --- | --- |
| `GET` | `/api/health` | Public dependency check; no secrets. |
| `POST` | `/api/auth/register` | Validated password/email; optional Resend verification; creates an HttpOnly session only when verification permits it. |
| `POST` | `/api/auth/login` | PBKDF2 verification, unverified-account enforcement, revocable session cookie. |
| `POST` | `/api/auth/logout` | Revokes the current session and clears the cookie. |
| `GET` | `/api/auth/verify` | One-time, expiring verification token. |
| `POST` | `/api/auth/forgot-password` / `/reset-password` | Non-enumerating request path where configured; one-time password reset token; revokes old sessions. |
| `GET` | `/api/prompts` | Published list with search, category/mode filters, sort, deterministic cursor. Authenticated owners can see their own private prompts. |
| `GET` | `/api/prompts/:id` | Published detail or owner-only private detail; view increment. |
| `POST` | `/api/prompts` | Authenticated, size/field validated prompt and sections written in a D1 batch. |
| `PATCH` / `DELETE` | `/api/prompts/:id` | Owner/admin only. Update can replace sections atomically; delete cascades. |
| `POST` | `/api/prompts/:id/like` and `/likes` | Authenticated, unique like toggle with affected-row checks for retry/concurrency safety. |
| `GET` / `POST` | `/api/prompts/:id/comments` | Public reads for public prompts; authenticated, length-limited writes. |
| `DELETE` | `/api/prompts/:id/comments/:commentId` | Comment owner/admin only. |
| `GET` / `PATCH` | `/api/me`, `/api/me/settings` | Profile, stats, preferences; allow-listed fields only. |
| `GET` | `/api/me/prompts`, `/api/me/export` | Authenticated private library/data export. |
| `GET` | `/api/services` | Supported provider metadata plus configured/connected state; no keys. |
| `POST` / `DELETE` | `/api/services/:service/connect` | Authenticated; only configured Worker providers can be enabled. |
| `POST` | `/api/provider-runs` | Authenticated, per-user rate-limited, prompt access checked, timeout and safe provider errors. |
| `GET` | `/api/leaderboard` | Public aggregate points view. |
| `GET` | `/api/admin/health` | Admin-only database, email, rate-limit, and provider configuration check. |

All responses include a request ID header. Error bodies expose stable codes and sanitized messages; raw provider errors, stack traces, passwords, session tokens, and prompt content are not logged.

## Authentication and authorization

- Passwords are PBKDF2-SHA-256 derived with a per-password random salt and high iteration count. D1 stores no plaintext password.
- Sessions store only a SHA-256 hash of a random token, have an expiry, a revocation timestamp, and a last-seen timestamp. The browser receives an HttpOnly, SameSite cookie; bearer tokens are also accepted for controlled API clients.
- The browser route guard is UX only. The Worker validates the session on each protected handler and checks ownership/role again.
- CORS is origin allow-listed through `APP_ORIGIN`; mutating requests with an Origin header are rejected when that origin is not configured. Provider/email secrets are bindings, never client variables or D1 fields.
- Email verification and password reset are deliberately configuration-dependent. Without `RESEND_API_KEY` and `EMAIL_FROM`, the Worker returns `EMAIL_NOT_CONFIGURED` rather than claiming delivery.

## Data model and consistency

The initial migration uses foreign keys and normalized records for users, sessions, prompts, prompt sections, likes, comments, service connections, points, badges, reset/verification tokens, and audit events. It adds indexes for public feeds, owner feeds, section ordering, likes, comments, service rows, and audit lookups.

Prompt + section creation and replacement use D1 batches. Prompt creation accepts an `Idempotency-Key`; a deterministic per-user prompt ID lets safe retries replay the existing record rather than create duplicates. Like updates use unique `(user_id, prompt_id)` rows and affected-row checks before changing the denormalized counter. D1 remains the source of truth; KV is only a short-lived rate-limit counter and can never replace relational authorization or content.

`workers/api/seed/development.sql` is an explicit local/staging fixture, not a migration and not a production seed. Do not blindly rewrite legacy Supabase migrations: the old sample history has invalid/unsafe assumptions and must be audited separately if a real Supabase database contains user data.

## Provider execution

Supported adapters are OpenAI Chat Completions, Anthropic Messages, and Google Gemini. Each adapter:

1. checks that the provider secret exists in the Worker environment;
2. validates the authenticated user's prompt access and request size;
3. applies the KV-backed per-user request limit when the binding is configured;
4. sends a bounded request through an abort timeout;
5. extracts text from the provider response and maps failures to safe status codes.

No user-supplied provider key is accepted. Adding encrypted user-owned keys would require a separate secret-management design and rotation/audit plan.

## Rate limiting and observability

`RATE_LIMIT` KV keys are short-lived by route/IP for auth and by user for provider calls. KV's eventual consistency is acceptable for an abuse-control layer, not for authorization. A future high-value billing/quota requirement should use a stronger coordination primitive rather than pretending KV is transactional.

Every request gets or preserves `X-Request-ID`. Structured success/error logs include request ID, method, path, status, and safe error code. D1 `audit_events` record significant account/content mutations without storing prompt content. A daily Worker Cron removes expired sessions/tokens and old audit records. Production should connect Worker logs and status checks to the team's alerting/retention policy.

## Deployment sequence

1. Create separate Cloudflare accounts/namespaces or environments for staging and production.
2. Copy `workers/api/wrangler.toml.example` to the ignored `workers/api/wrangler.toml`; set the D1 database ID, KV namespace ID, exact origins, and URLs.
3. Apply migrations to staging; run explicit seed only in local/staging if desired.
4. Set email/provider secrets with `wrangler secret put`; verify `/api/admin/health` as an admin.
5. Configure the Vercel build with `VITE_API_BASE_URL` and `VITE_SITE_URL`; if using same-origin `/api`, add the Worker rewrite before the SPA fallback.
6. Execute staging smoke, auth expiry/reset, ownership, validation, retry/like, provider failure, rate-limit, export, and migration checks.
7. Apply the exact migration history to production, deploy the Worker, deploy Vercel, then run public/private smoke checks.

Remaining environment-dependent work is intentionally limited to Cloudflare/Vercel provisioning, domain/route setup, migration execution, and secret/key values. The code path is not presented as live provider or email behavior until those values exist.
