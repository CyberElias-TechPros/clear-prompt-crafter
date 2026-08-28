// Prompt-Gineer API — Cloudflare Worker entry point.

import { Env, HttpError, json } from "./util";
import * as R from "./routes";

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: R.Ctx["req"] extends never ? never : (ctx: R.Ctx) => Promise<Response>;
}

const P = R.PROMPTS;
const T = R.TEMPLATES;

const routes: Route[] = [
  // Health
  { method: "GET", pattern: /^\/api\/health\/?$/, paramNames: [], handler: R.health },

  // Auth & account
  { method: "POST", pattern: /^\/api\/auth\/signup\/?$/, paramNames: [], handler: R.signup },
  { method: "POST", pattern: /^\/api\/auth\/login\/?$/, paramNames: [], handler: R.login },
  { method: "POST", pattern: /^\/api\/auth\/logout\/?$/, paramNames: [], handler: R.logout },
  { method: "GET", pattern: /^\/api\/auth\/me\/?$/, paramNames: [], handler: R.me },
  { method: "POST", pattern: /^\/api\/auth\/change-password\/?$/, paramNames: [], handler: R.changePassword },
  { method: "DELETE", pattern: /^\/api\/auth\/account\/?$/, paramNames: [], handler: R.deleteAccount },
  { method: "PATCH", pattern: /^\/api\/me\/?$/, paramNames: [], handler: R.patchMe },
  { method: "GET", pattern: /^\/api\/me\/data\/?$/, paramNames: [], handler: R.exportMyData },

  // Prompts
  { method: "GET", pattern: /^\/api\/prompts\/?$/, paramNames: [], handler: R.listPublic(P) },
  { method: "GET", pattern: /^\/api\/prompts\/mine\/?$/, paramNames: [], handler: R.listMine(P) },
  { method: "POST", pattern: /^\/api\/prompts\/?$/, paramNames: [], handler: R.create(P) },
  { method: "GET", pattern: /^\/api\/prompts\/([^/]+)\/?$/, paramNames: ["id"], handler: R.getOne(P) },
  { method: "PATCH", pattern: /^\/api\/prompts\/([^/]+)\/?$/, paramNames: ["id"], handler: R.patchOne(P) },
  { method: "DELETE", pattern: /^\/api\/prompts\/([^/]+)\/?$/, paramNames: ["id"], handler: R.deleteOne(P) },
  { method: "POST", pattern: /^\/api\/prompts\/([^/]+)\/like\/?$/, paramNames: ["id"], handler: R.toggleLike(P) },
  { method: "GET", pattern: /^\/api\/prompts\/([^/]+)\/comments\/?$/, paramNames: ["id"], handler: R.listComments(P) },
  { method: "POST", pattern: /^\/api\/prompts\/([^/]+)\/comments\/?$/, paramNames: ["id"], handler: R.addComment(P) },

  // Templates
  { method: "GET", pattern: /^\/api\/templates\/?$/, paramNames: [], handler: R.listPublic(T) },
  { method: "GET", pattern: /^\/api\/templates\/mine\/?$/, paramNames: [], handler: R.listMine(T) },
  { method: "POST", pattern: /^\/api\/templates\/?$/, paramNames: [], handler: R.create(T) },
  { method: "GET", pattern: /^\/api\/templates\/([^/]+)\/?$/, paramNames: ["id"], handler: R.getOne(T) },
  { method: "PATCH", pattern: /^\/api\/templates\/([^/]+)\/?$/, paramNames: ["id"], handler: R.patchOne(T) },
  { method: "DELETE", pattern: /^\/api\/templates\/([^/]+)\/?$/, paramNames: ["id"], handler: R.deleteOne(T) },
  { method: "POST", pattern: /^\/api\/templates\/([^/]+)\/like\/?$/, paramNames: ["id"], handler: R.toggleLike(T) },
  { method: "GET", pattern: /^\/api\/templates\/([^/]+)\/comments\/?$/, paramNames: ["id"], handler: R.listComments(T) },
  { method: "POST", pattern: /^\/api\/templates\/([^/]+)\/comments\/?$/, paramNames: ["id"], handler: R.addComment(T) },

  // Leaderboard
  { method: "GET", pattern: /^\/api\/leaderboard\/?$/, paramNames: [], handler: R.leaderboard },

  // Ads (public read + admin management)
  { method: "GET", pattern: /^\/api\/ads\/?$/, paramNames: [], handler: R.listAds },
  { method: "GET", pattern: /^\/api\/admin\/ads\/?$/, paramNames: [], handler: R.adminListAds },
  { method: "POST", pattern: /^\/api\/admin\/ads\/?$/, paramNames: [], handler: R.adminCreateAd },
  { method: "PATCH", pattern: /^\/api\/admin\/ads\/([^/]+)\/?$/, paramNames: ["id"], handler: R.adminPatchAd },
  { method: "DELETE", pattern: /^\/api\/admin\/ads\/([^/]+)\/?$/, paramNames: ["id"], handler: R.adminDeleteAd },

  // AI (platform NVIDIA NIM + BYOK)
  { method: "GET", pattern: /^\/api\/ai\/models\/?$/, paramNames: [], handler: R.aiModels },
  { method: "GET", pattern: /^\/api\/ai\/services\/?$/, paramNames: [], handler: R.aiServices },
  { method: "POST", pattern: /^\/api\/ai\/services\/?$/, paramNames: [], handler: R.aiConnect },
  { method: "PATCH", pattern: /^\/api\/ai\/services\/([^/]+)\/?$/, paramNames: ["name"], handler: R.aiPatchService },
  { method: "DELETE", pattern: /^\/api\/ai\/services\/([^/]+)\/?$/, paramNames: ["name"], handler: R.aiDisconnect },
  { method: "POST", pattern: /^\/api\/ai\/services\/([^/]+)\/test\/?$/, paramNames: ["name"], handler: R.aiTestService },
  { method: "POST", pattern: /^\/api\/ai\/generate\/?$/, paramNames: [], handler: R.aiGenerate },

  // Contact
  { method: "POST", pattern: /^\/api\/contact\/?$/, paramNames: [], handler: R.contact },
];

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim()).filter(Boolean);
  const allowAny = allowed.includes("*");
  const allowOrigin = allowAny
    ? origin || "*"
    : allowed.includes(origin)
      ? origin
      : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return json(
        {
          name: "Prompt-Gineer API",
          status: "ok",
          docs: "See README.md in the repository root for endpoints and deployment.",
        },
        200,
        cors,
      );
    }

    try {
      for (const route of routes) {
        if (route.method !== req.method) continue;
        const match = url.pathname.match(route.pattern);
        if (!match) continue;

        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));

        let body: any = {};
        if (!["GET", "HEAD"].includes(req.method)) {
          const text = await req.text();
          if (text.trim().length > 0) {
            try {
              body = JSON.parse(text);
            } catch {
              throw new HttpError(400, "Request body must be valid JSON");
            }
          }
        }

        const res = await route.handler({ env, req, params, query: url.searchParams, body });
        // Re-wrap with CORS headers.
        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: { ...Object.fromEntries(res.headers.entries()), ...cors },
        });
      }
      return json({ error: "Not found" }, 404, cors);
    } catch (err: any) {
      const isKnown = err instanceof HttpError;
      const status = isKnown ? err.status : err?.status ?? 500;
      const message = isKnown || err?.status ? err.message : "Internal server error";
      // Only log genuinely unexpected errors; known HttpErrors (including 502s
      // from upstream AI providers) are part of normal operation.
      if (!isKnown && status >= 500) console.error("Unhandled error:", err);
      return json({ error: message }, status, cors);
    }
  },
};
