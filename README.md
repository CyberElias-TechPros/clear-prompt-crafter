# Prompt-Gineer — AI Prompt Engineering Platform

Create, analyze, and share structured prompts for AI projects. Ships with a **zero-cost
built-in AI tier** (NVIDIA NIM free models) plus **bring-your-own-key (BYOK)** support for
10+ providers.

## Architecture

| Layer    | Where it runs                        | Tech                                    |
| -------- | ------------------------------------ | --------------------------------------- |
| Frontend | **Vercel**                           | Vite + React + TypeScript + shadcn/ui   |
| Backend  | **Cloudflare Workers + D1 (SQLite)** | A single Worker (see [`worker/`](worker)) |
| AI       | NVIDIA NIM (free) + user BYOK keys   | OpenAI-compatible chat completions      |

The backend is fully self-contained: auth (email + password, PBKDF2), the database, the
encrypted BYOK key vault, gamification, ads, and the AI gateway all live in the Worker.
There is **no Supabase dependency**.

```
Browser (Vercel SPA)
   │  HTTPS (VITE_API_URL or same-origin /api)
   ▼
Cloudflare Worker  ──►  D1 (users, prompts, templates, likes, comments, points, ads…)
   │
   ├─► NVIDIA NIM API   (platform free key, zero-cost models, daily quota)
   └─► BYOK providers   (OpenAI, Anthropic, Gemini, Mistral, Cohere, DeepSeek,
                          Groq, Perplexity, Llama, NVIDIA, or any OpenAI-compatible URL)
```

### Why this was rebuilt

The original project targeted a Lovable-hosted Supabase project and Edge Functions that were
unreachable and had several broken flows (BYOK keys were "encrypted" by discarding them, AI
generation depended on unset `OPENAI_API_KEY` secrets, and Vite was reading `process.env`).
The app now runs end-to-end on Vercel + Cloudflare with a working free AI tier.

---

## Features

- **Prompt builders** — Structured, Conversational (now real AI chat), and Meta-Prompting
  (AI analysis with an offline heuristic fallback).
- **Community** — Public prompts and templates with search, sort, likes, view counts, and
  comments.
- **Free AI tier** — Every signed-in user gets free generations on zero-cost NVIDIA models,
  capped by a configurable daily quota (`FREE_DAILY_LIMIT`, default 5).
- **BYOK** — Connect your own key for 10+ providers. Keys are AES-256-GCM encrypted in D1 and
  only ever used server-side. BYOK use bypasses the free quota.
- **Gamification** — Points and badges for creating, liking, and commenting; live leaderboard.
- **Accounts** — Sign up/in, change password, export your data, delete your account.
- **Admin** — Ad management for users whose email is in `ADMIN_EMAILS`.

---

## Local development

Prereqs: **Node.js ≥ 18** and **npm**.

### 1. Backend (Cloudflare Worker)

```bash
cd worker
npm install
npm run db:init:local          # create + seed the local D1 database
npm run dev                    # wrangler dev on http://localhost:8787
```

### 2. Frontend (Vite)

In a second terminal:

```bash
# from the repo root
npm install
npm run dev                    # Vite on http://localhost:8080, proxies /api -> :8787
```

Open http://localhost:8080. The frontend uses relative `/api/...` requests in dev, and Vite
forwards them to the Worker, so **no `.env` is required locally**.

---

## Deploying

### Backend → Cloudflare

1. **Create the D1 database.** From `worker/`:
   ```bash
   npx wrangler d1 create prompt-gineer-db
   ```
   The command prints a `database_id`. Paste it into `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "prompt-gineer-db"
   database_id = "<paste-the-id-here>"
   ```

2. **Apply the schema + seed data to the remote database:**
   ```bash
   npm run db:init:remote
   ```

3. **Set secrets** (recommended over committing them as vars):
   ```bash
   npx wrangler secret put NVIDIA_API_KEY          # your nvapi-... key
   npx wrangler secret put KEY_ENCRYPTION_SECRET   # any long random string
   ```
   > A `NVIDIA_API_KEY` secret overrides the `vars` value in `wrangler.toml`.

4. **Deploy:**
   ```bash
   npm run deploy
   ```
   Note the Worker URL, e.g. `https://prompt-gineer-api.<your-subdomain>.workers.dev`.

**Configuration (`worker/wrangler.toml` `[vars]`):**

| Var                | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `ALLOWED_ORIGINS`  | Comma-separated CORS origins, or `*` for any (default `*`).    |
| `ADMIN_EMAILS`     | Comma-separated emails granted the admin role at sign-up.      |
| `FREE_DAILY_LIMIT` | Free-tier generations per user per day (default `5`).          |
| `NVIDIA_MODELS`    | Comma-separated zero-cost model fallback chain.                |
| `NVIDIA_BASE_URL`  | NVIDIA NIM base URL.                                           |
| `NVIDIA_API_KEY`   | Platform free key (prefer a secret in production).             |

To make yourself an admin, add your email to `ADMIN_EMAILS` **before** signing up (or run a
one-off D1 update: `UPDATE users SET role='admin' WHERE email='you@example.com'`).

### Frontend → Vercel

1. Import the repo into Vercel (framework preset: **Vite**; build `npm run build`, output `dist`).
2. Add the environment variable:
   ```
   VITE_API_URL = https://prompt-gineer-api.<your-subdomain>.workers.dev
   ```
3. Deploy. `vercel.json` already rewrites all routes to `index.html` for client-side routing.

> The Worker allows cross-origin requests via `ALLOWED_ORIGINS` (default `*`), so a Vercel
> frontend can call the `workers.dev` backend directly.

---

## API overview

All endpoints are prefixed with `/api`. Authenticated routes expect
`Authorization: Bearer <token>`.

| Area      | Endpoints                                                                 |
| --------- | ------------------------------------------------------------------------- |
| Auth      | `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`, `DELETE /auth/account` |
| Account   | `PATCH /me`, `GET /me/data`                                                |
| Prompts   | `GET/POST /prompts`, `GET /prompts/mine`, `GET/PATCH/DELETE /prompts/:id`, `POST /prompts/:id/like`, `GET/POST /prompts/:id/comments` |
| Templates | Same shape as prompts under `/templates`                                  |
| Community | `GET /leaderboard`                                                         |
| Ads       | `GET /ads`, admin: `GET/POST /admin/ads`, `PATCH/DELETE /admin/ads/:id`    |
| AI        | `GET /ai/models`, `GET /ai/services`, `POST /ai/services`, `PATCH/DELETE /ai/services/:name`, `POST /ai/services/:name/test`, `POST /ai/generate` |
| Misc      | `POST /contact`, `GET /health`                                             |

Example generation request (uses the free platform key when `service` is omitted):

```bash
curl -X POST "$API/api/ai/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a CLEAR-framework prompt for a login page"}'
```

To route through a connected BYOK key instead:

```bash
curl -X POST "$API/api/ai/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service":"openai","prompt":"Hello"}'
```

---

## Security notes

- Passwords are hashed with PBKDF2-SHA256 (150k iterations, per-user salt).
- Sessions are opaque bearer tokens stored as SHA-256 hashes, with a 30-day sliding expiry.
- BYOK keys are encrypted with AES-256-GCM (`KEY_ENCRYPTION_SECRET`) and never returned to the
  client.
- The platform NVIDIA key is only used server-side and is rate-limited per user per day.

## Scripts

**Root (frontend):** `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
**`worker/` (backend):** `npm run dev`, `npm run deploy`, `npm run db:init:local`,
`npm run db:init:remote`, `npm run db:create`.
