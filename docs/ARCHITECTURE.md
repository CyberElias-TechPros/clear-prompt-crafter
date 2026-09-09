# Architecture and decision record

## Product reconstruction

**Category:** prompt engineering workspace with a community prompt library.

**Primary user:** an individual builder, developer, marketer, researcher, or operator who wants to turn a rough request into a repeatable AI instruction.

**Secondary users:** contributors who publish prompt systems and teams that need shared standards.

**Evidence:** existing routes and components covered structured/conversational/meta prompt modes, prompt sections, public prompts/templates, likes/comments, AI services, profiles/settings, points/badges, and Supabase Edge Functions. The product language repeatedly described the CLEAR framework and prompt engineering guidance. These are high-confidence requirements. Billing, real-time collaboration, and rich file uploads were not sufficiently evidenced and remain out of scope.

## Decision: preserve a local-first evaluation path

### Context
The original app assumed a deployed Supabase project and had a tracked environment file, but the repository did not include a reliable local backend or an end-to-end test suite.

### Choice
The frontend now has a clearly labelled demo mode with browser-local state. Remote Supabase auth remains optional and is only used when both public configuration values are present.

### Consequences
- The application can be evaluated and visually tested without credentials.
- Local persistence is not a security boundary and must not be used for real private data.
- Production remote writes remain an explicit deployment step rather than an accidental network dependency.

## Decision: Vercel + Cloudflare target

### Frontend
Vercel serves the Vite build. `/api/*` should be same-origin from the browser and proxied to the Worker; the browser should never call `localhost` or a hard-coded backend origin.

### Worker contract
The first Worker slice should own:

| Method | Route | Purpose | Authorization |
| --- | --- | --- | --- |
| `GET` | `/api/health` | deployment health | public, no sensitive data |
| `GET` | `/api/prompts` | public list with cursor/search/sort | public for published records |
| `GET` | `/api/prompts/:id` | public prompt detail | published or owner |
| `POST` | `/api/prompts` | create a prompt and its sections atomically | authenticated |
| `PATCH` | `/api/prompts/:id` | edit own prompt | owner |
| `DELETE` | `/api/prompts/:id` | delete own prompt | owner |
| `POST` | `/api/prompts/:id/likes` | idempotent like toggle | authenticated |
| `GET` | `/api/me` | profile, settings, connected service metadata | authenticated |
| `PATCH` | `/api/me/settings` | update an allow-listed settings payload | authenticated |
| `POST` | `/api/provider-runs` | run a provider through server-side secret | authenticated + rate limited |

Responses should use a stable envelope such as `{ data, error, requestId }`, with validation errors containing field-level details but no stack traces.

### D1
Use normalized tables for `users/profiles`, `prompts`, `prompt_sections`, `likes`, `comments`, `user_points`, and `user_badges`. Add indexes for `(is_public, created_at)`, `(is_public, likes)`, owner lookups, and section foreign keys. Use foreign keys, unique ownership constraints, and transactions for prompt + sections. Prefer cursor pagination with a deterministic `(created_at, id)` order over offset pagination.

### KV
Use only for short-lived cache/configuration or rate-limit counters where eventual consistency is acceptable. It is not a source of truth for prompts, likes, auth, or billing.

### R2
There is no current file requirement. If export files or prompt attachments are added, store binary objects in R2 and keep metadata/ownership in D1. Downloads must use authorized, short-lived signed URLs.

### Queues / Cron / Durable Objects
Not currently required. Add Queues for asynchronous notifications or expensive export processing, Cron for cleanup/maintenance, and Durable Objects only for genuinely coordinated real-time sessions.

## Authentication and authorization

The browser route guard is UX only. The Worker must validate the session on every protected handler, then check:

1. the caller is authenticated;
2. the caller owns the resource or has an explicit role;
3. the action is allowed for that resource's lifecycle state;
4. input is validated at runtime;
5. the operation is rate limited/idempotent where retries matter.

Do not expose provider keys, service-role credentials, or internal error details. Connected-service rows should contain provider metadata and a server-side secret reference only; never return the secret to the browser.

## Data migration sequence

1. Freeze new remote writes while the target schema is prepared.
2. Inventory the deployed Supabase database; do not assume the committed sample migrations reflect production.
3. Remove or quarantine demo sample rows and invalid foreign-key seed behavior in staging.
4. Export relational records with stable IDs and timestamps.
5. Transform into additive D1 migrations with ownership constraints.
6. Validate counts, orphan records, duplicate likes, and prompt-section ordering.
7. Dual-read or run a staged cutover if real users exist.
8. Keep an export/rollback procedure and only then enable the Worker API.

## Legacy Supabase risks

The original migrations include demo inserts using random UUIDs as `auth.users` references, repeated sample data, a placeholder `encrypt_api_key` function that returns an ID without encrypting or storing a key, broad RLS policies for some tables, and RPCs marked `SECURITY DEFINER`. These files are retained as historical evidence but must not be treated as a production migration set without a database audit. The current UI does not invoke the legacy provider-key function.

## Observability

Every Worker request should receive a request ID. Log method, route, status, duration, actor ID hash, and error code; never log passwords, raw tokens, provider keys, prompt content by default, or unnecessary personal data. Add `/api/health`, error-rate metrics, and deployment smoke checks.
