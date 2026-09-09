import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const cors = (origin = "") => ({
  ...(allowedOrigin && origin === allowedOrigin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
});

function json(body: Record<string, unknown>, status: number, origin = "") {
  return new Response(JSON.stringify(body), { status, headers: cors(origin) });
}

serve(async (req) => {
  const origin = req.headers.get("Origin") ?? "";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  try {
    const authorization = req.headers.get("Authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authorization || !url || !key) return json({ error: "Unauthorized" }, 401, origin);
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
    const { data: authData } = await client.auth.getUser();
    if (!authData.user) return json({ error: "Unauthorized" }, 401, origin);

    const body = await req.json() as { settings?: unknown };
    if (!body.settings || typeof body.settings !== "object") return json({ error: "Invalid settings payload" }, 400, origin);
    const input = body.settings as Record<string, unknown>;
    const settings = {
      user_id: authData.user.id,
      ...(typeof input.allow_learning === "boolean" ? { allow_learning: input.allow_learning } : {}),
      ...(input.theme === "light" || input.theme === "dark" ? { theme: input.theme } : {}),
    };
    if (Object.keys(settings).length === 1) return json({ error: "No editable settings supplied" }, 400, origin);

    const { data, error } = await client.from("user_settings").upsert(settings, { onConflict: "user_id" }).select("user_id, allow_learning, theme, updated_at").single();
    if (error) {
      console.error("settings update failed", error.message);
      return json({ error: "Unable to update settings" }, 500, origin);
    }
    return json({ data }, 200, origin);
  } catch (error) {
    console.error("update-user-settings failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Unable to update settings" }, 500, origin);
  }
});
