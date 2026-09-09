# Production-readiness ledger

Updated: 2026-09-09

## Completed in the frontend reconstruction

- Replaced the Lovable starter landing page with a distinct Prompt-Gineer product experience.
- Built a responsive workspace shell with keyboard-visible controls, mobile navigation, dark-mode support, and reduced-motion CSS.
- Replaced the original prompt screens with one coherent studio supporting structured, conversational, and draft-refinement modes.
- Added deterministic local save/copy/reset behavior and explicit demo-mode language.
- Rebuilt the public library with search, topic filters, sorting, likes, copy actions, and detail pages.
- Added profile, settings, AI-service, leaderboard, contact, and auth surfaces that do not pretend unavailable backends succeeded.
- Removed hard-coded client Supabase credentials from the integration source and untracked `.env`; added `.env.example`.
- Added page-level metadata, structured data, robots rules, and a sitemap placeholder.
- Removed the external GPT Engineer script from the document shell.
- Added architecture and deployment documentation with a Cloudflare Worker/D1 target and a migration sequence.

## Verified locally

- `npm install` completed.
- `npm run build` completed successfully with Vite.
- `npx tsc -b --pretty false` completed successfully.
- `npm run lint` completed with zero errors and six existing/non-blocking Fast Refresh warnings in shadcn helper exports.
- Vite dev server started on `0.0.0.0:8080` and returned 200 for `/`, `/robots.txt`, and `/sitemap.xml`.

## High-priority gates before real users

| Area | Status | Required next step |
| --- | --- | --- |
| Remote auth | Optional, not exercised in this environment | Configure Supabase or Worker auth in staging and test verification, expiry, reset, logout, and multi-device behavior. |
| Remote CRUD | Not connected by the reconstructed UI | Implement and test Worker endpoints with D1 transactions and ownership checks. |
| Provider execution | Not enabled | Build server-side Worker provider adapters with secrets, timeouts, quotas, and safe error mapping. |
| API-key storage | Legacy Supabase function is not safe | Replace the placeholder encryption function; never persist raw keys in browser storage or unencrypted database fields. |
| Billing | Not implemented | Decide whether pricing is marketing-only or add a provider and entitlement model. |
| E2E tests | Not present | Add Playwright coverage for landing → demo → builder → save → profile, auth, public library, and unauthorized API attempts. |
| Deployment | Local/Vite verified only | Configure Vercel SPA rewrites, Worker routes, D1 migrations, secrets, preview/prod environments, and smoke checks. |
| Domain metadata | Placeholder host in robots/sitemap | Replace `prompt-gineer.example` and set `VITE_SITE_URL` before indexing. |
| Seed data | Local demo only | Keep seed fixtures out of production or load them explicitly as development fixtures. |

## Threat model to exercise in staging

- direct access to another user's prompt ID;
- changing `user_id`, visibility, role, or provider ID in a request body;
- duplicate likes and prompt creation on retries;
- expired sessions and simultaneous tabs;
- oversized prompt content and pagination abuse;
- malicious URLs or HTML in prompt text, comments, image metadata, and provider responses;
- provider timeouts, rate limits, malformed responses, and secret rotation;
- migration rollback and orphaned sections;
- no-JavaScript/crawler rendering of public content;
- keyboard-only navigation and `prefers-reduced-motion`.
