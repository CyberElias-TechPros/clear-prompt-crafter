import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
const cors = (origin = "") => ({
  ...(allowedOrigin && origin === allowedOrigin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
});

const json = (body: Record<string, unknown>, status: number, origin = "") => new Response(JSON.stringify(body), { status, headers: cors(origin) });

serve(async (req) => {
  const origin = req.headers.get("Origin") ?? "";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405, origin);

  try {
    const authorization = req.headers.get("Authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authorization || !url || !key) return json({ error: "Unauthorized" }, 401, origin);
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
    const { data: authData } = await client.auth.getUser();
    const user = authData.user;
    if (!user) return json({ error: "Unauthorized" }, 401, origin);

    const [profileResult, settingsResult, servicesResult] = await Promise.all([
      client.from("profiles").select("id, full_name, avatar_url, role, created_at, updated_at").eq("id", user.id).maybeSingle(),
      client.from("user_settings").select("user_id, allow_learning, theme, updated_at").eq("user_id", user.id).maybeSingle(),
      client.from("user_ai_services").select("id, service_name, is_active, created_at, updated_at").eq("user_id", user.id),
    ]);
    if (profileResult.error || settingsResult.error || servicesResult.error) {
      console.error("profile lookup failed", profileResult.error?.message || settingsResult.error?.message || servicesResult.error?.message);
      return json({ error: "Unable to load profile" }, 500, origin);
    }
    return json({ data: { profile: profileResult.data, settings: settingsResult.data, services: servicesResult.data ?? [] } }, 200, origin);
  } catch (error) {
    console.error("get-user-profile failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Unable to load profile" }, 500, origin);
  }
});
