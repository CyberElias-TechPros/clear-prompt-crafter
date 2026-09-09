# Prompt-Gineer

Prompt-Gineer is a focused prompt engineering workspace for turning rough ideas into clear, reusable prompt systems. It combines a guided builder, a public library of examples, lightweight collaboration signals, and model-provider connection surfaces without making provider secrets part of the browser experience.

> The repository currently ships with a high-fidelity local demo mode so the product can be evaluated without external credentials. Remote Supabase authentication is optional. Model execution and production persistence require the deployment steps below.

## Product map

- **Prompt studio** — structured, conversational, and draft-refinement workflows built around the CLEAR framework: Concise, Logical, Explicit, Adaptive, Reflective.
- **Live preview** — a readable assembled prompt with copy and save actions.
- **Private library** — locally persisted drafts in demo mode, with profile and activity surfaces.
- **Community library** — searchable, filterable public prompt systems with detail pages, copy, and lightweight likes.
- **AI services** — provider directory and connection UX. Demo mode records connection status only; it never stores an API key in local storage.
- **Leaderboard** — a curated community signal surface that makes contribution visible without pretending it is a production ranking until the data service is connected.
- **SEO foundation** — semantic public pages, page-level metadata, structured data, robots rules, a sitemap placeholder, and intentional no-index guidance for private routes.

## Local development

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
cp .env.example .env.local # optional; demo mode works without it
npm run dev
```

The Vite server listens on `0.0.0.0:8080` in the sandbox and locally at <http://localhost:8080>.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Optional for demo | Supabase project URL for remote auth/persistence. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Optional for demo | Supabase publishable/anon key. Never put provider secrets here. |
| `VITE_API_BASE_URL` | Optional | Relative or absolute API base used by the future Worker integration. Prefer `/api` behind the Vercel proxy. |
| `VITE_SITE_URL` | Production | Canonical site origin used by the client-side SEO helper. |

`.env`, `.env.local`, and other environment files are ignored. Commit only `.env.example`.

## Quality checks

```bash
npm run lint       # ESLint; existing shadcn helper files emit non-blocking refresh warnings
npx tsc -b         # TypeScript project check
npm run build      # production Vite build
```

The current build is a client-side Vite application. There is no end-to-end test runner in the repository yet; the critical flows should be covered before enabling production writes or billing.

## Demo mode

Choose **Open the demo workspace** on `/auth`, or **Open studio** from the landing page. Demo mode:

- stores the demo session flag, draft prompts, settings, and connection statuses in browser `localStorage`;
- uses clearly labelled seed content rather than pretending it came from a live database;
- never sends draft content or provider keys to a model;
- can be cleared from Settings → Danger zone.

This is a product evaluation path, not an authentication or authorization boundary. Disable or remove it for a deployment that handles real private data.

## Architecture

### Current repository architecture

```text
Vercel/static host (Vite React SPA)
        │
        ├── local demo store (browser localStorage)
        └── optional Supabase client for remote auth/data
```

The current frontend does not call a local server, and it is safe to preview without a running backend. Supabase code and migrations are retained as an optional legacy integration because they are repository evidence, but the UI no longer falls back to fake API success responses.

### Production target

The intended production topology is:

```text
Vercel
  └── React/Vite frontend
        └── same-origin /api proxy
              └── Cloudflare Worker
                    ├── D1: prompts, sections, profiles, comments, likes
                    ├── R2: future attachments/export files only
                    ├── KV: short-lived cache/configuration only
                    └── Queues/Cron: future notifications and cleanup
```

Only use R2, KV, Queues, or Durable Objects when the feature actually needs them. Prompt text is relational data and belongs in D1, not object storage. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the boundary, API contracts, security rules, and migration sequence.

## Security posture

Implemented in this pass:

- removed the tracked local environment file from version control and moved configuration to `.env.example`;
- removed the third-party development script from `index.html`;
- added an explicit no-remote-config path so demo mode does not make placeholder network requests;
- kept provider connection state separate from credentials and never persists API keys in the browser;
- added private-by-default language and no-index guidance for workspace routes;
- fixed unsafe TypeScript `any` errors in the active lint path and added runtime-safe error messages in the admin surface.

Before production:

- move authentication, authorization, prompt CRUD, provider calls, and rate limiting behind the Cloudflare Worker;
- use D1 RLS-equivalent ownership checks in every handler and never trust client route guards;
- store provider secrets in Cloudflare secrets or a dedicated server-side secret store, not D1/KV/local storage;
- replace the legacy Supabase API-key Edge Function before enabling provider connections;
- add CSRF/origin checks for cookie-backed sessions, request IDs, structured logs, and abuse limits.

These items are intentionally documented as deployment gates rather than hidden behind a demo UI.

## SEO and accessibility

Public routes are designed as useful, indexable surfaces: `/`, `/community`, `/community/prompt/:id`, `/leaderboard`, and `/contact`. Workspace, auth, settings, profile, and admin routes are excluded in `public/robots.txt` and should also be returned as `noindex` in a server-rendered production shell.

The app uses semantic headings, labelled controls, keyboard-friendly buttons/links, visible focus rings from the component system, readable contrast, and a global `prefers-reduced-motion` fallback. Replace the placeholder host in `public/robots.txt` and `public/sitemap.xml` with the real domain before launch.

## Deployment

### Vercel frontend

1. Import the repository into Vercel.
2. Set the build command to `npm run build` and output directory to `dist`.
3. Add `VITE_SITE_URL` and, if enabled, the Supabase public variables.
4. Configure SPA fallback rewrites so `/community`, `/dashboard`, and nested routes serve `index.html`.
5. Replace the placeholder domain in the sitemap and robots files.
6. Validate the preview on desktop, mobile, keyboard navigation, and with reduced motion enabled.

### Cloudflare Worker / D1

The repository does not yet ship an active Worker deployment. Before enabling real accounts, implement the contract and migration sequence in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), then:

1. Create a Worker with `wrangler` and bind D1.
2. Apply additive D1 migrations in staging.
3. Add same-origin Vercel rewrites from `/api/*` to the Worker.
4. Configure Worker secrets and allowed origins per environment.
5. Run auth, ownership, rate-limit, CRUD, failure, and migration tests against staging.
6. Deploy the Worker before switching the frontend from demo mode to remote writes.

## Repository notes

The original repository was a Lovable-generated React/Supabase prototype with duplicated layouts, public Supabase calls, placeholder ads, mocked conversation behavior, and sample migrations that mixed demo data with relational records. The product has been reconstructed around the strongest evidence: a prompt builder, community library, AI provider integrations, profiles, settings, and contributor signals.

Detailed decisions, inferred requirements, migration risks, and remaining production gates are recorded in `docs/`.
