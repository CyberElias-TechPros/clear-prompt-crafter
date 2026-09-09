import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const cors = (origin = "") => ({
  ...(allowedOrigin && origin === allowedOrigin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
});

function response(body: Record<string, string>, status: number, origin = "") {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

async function isAuthenticated(req: Request) {
  const authorization = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authorization || !url || !key) return false;
  const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
  const { data } = await client.auth.getUser();
  return Boolean(data.user);
}

serve(async (req) => {
  const origin = req.headers.get("Origin") ?? "";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);
  if (!(await isAuthenticated(req))) return response({ error: "Unauthorized" }, 401, origin);

  // The previous implementation called a placeholder encrypt_api_key function
  // that returned an ID without storing or encrypting the secret. Refuse the
  // operation until a real vault/Worker secret implementation is configured.
  return response({ error: "Secure provider secret storage is not configured" }, 501, origin);
});
