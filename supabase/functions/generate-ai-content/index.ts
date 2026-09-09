import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const allowedServices = new Set(["openai", "anthropic", "perplexity"]);
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";

function headers(origin = "") {
  const requestOrigin = allowedOrigin && origin === allowedOrigin ? origin : allowedOrigin;
  return {
    ...(requestOrigin ? { "Access-Control-Allow-Origin": requestOrigin, Vary: "Origin" } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(body: Record<string, unknown>, status: number, origin = "") {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

async function requireUser(req: Request) {
  const authorization = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!authorization || !url || !key) return null;
  const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

serve(async (req) => {
  const origin = req.headers.get("Origin") ?? "";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401, origin);

    const rawBody = await req.text();
    if (rawBody.length > 40_000) return json({ error: "Prompt is too large" }, 413, origin);
    const body = JSON.parse(rawBody) as { service?: unknown; prompt?: unknown; model?: unknown };
    const service = typeof body.service === "string" ? body.service : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body.model === "string" && body.model.length < 120 ? body.model : undefined;

    if (!allowedServices.has(service)) return json({ error: "Unsupported provider" }, 400, origin);
    if (prompt.length < 1 || prompt.length > 30_000) return json({ error: "Prompt must be between 1 and 30,000 characters" }, 400, origin);

    if (service === "openai") return await handleOpenAI(prompt, model, origin);
    if (service === "anthropic") return await handleAnthropic(prompt, model, origin);
    return await handlePerplexity(prompt, model, origin);
  } catch (error) {
    console.error("generate-ai-content failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Unable to generate content right now" }, 500, origin);
  }
});

async function providerFetch(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function handleOpenAI(prompt: string, model: string | undefined, origin: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "Provider is not configured" }, 503, origin);
  const response = await providerFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: model || "gpt-4o-mini", messages: [{ role: "system", content: "You create high-quality prompts. Be concrete, honest about uncertainty, and preserve the user's intent." }, { role: "user", content: prompt }], temperature: 0.7 }),
  });
  if (!response.ok) return json({ error: "Provider request failed" }, response.status === 429 ? 429 : 502, origin);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? json({ content }, 200, origin) : json({ error: "Provider returned an invalid response" }, 502, origin);
}

async function handleAnthropic(prompt: string, model: string | undefined, origin: string) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "Provider is not configured" }, 503, origin);
  const response = await providerFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: model || "claude-3-5-haiku-latest", max_tokens: 1200, system: "You create high-quality prompts. Be concrete, honest about uncertainty, and preserve the user's intent.", messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) return json({ error: "Provider request failed" }, response.status === 429 ? 429 : 502, origin);
  const data = await response.json() as { content?: Array<{ text?: string }> };
  const content = data.content?.[0]?.text;
  return typeof content === "string" ? json({ content }, 200, origin) : json({ error: "Provider returned an invalid response" }, 502, origin);
}

async function handlePerplexity(prompt: string, model: string | undefined, origin: string) {
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!apiKey) return json({ error: "Provider is not configured" }, 503, origin);
  const response = await providerFetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: model || "sonar", messages: [{ role: "system", content: "You create high-quality prompts. Be concrete, honest about uncertainty, and preserve the user's intent." }, { role: "user", content: prompt }], temperature: 0.7, max_tokens: 1200, return_images: false, return_related_questions: false }),
  });
  if (!response.ok) return json({ error: "Provider request failed" }, response.status === 429 ? 429 : 502, origin);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? json({ content }, 200, origin) : json({ error: "Provider returned an invalid response" }, 502, origin);
}
