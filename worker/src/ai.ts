// AI provider gateway.
//
// The platform default is NVIDIA NIM (https://build.nvidia.com) which offers
// zero-cost "free endpoint" models through an OpenAI-compatible API — perfect
// for a free tier. Users may also Bring Their Own Key (BYOK) for any of the
// providers below; their keys are stored AES-GCM encrypted in D1 and are only
// ever used server-side.

import { HttpError } from "./util";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderDef {
  id: string;
  label: string;
  kind: "openai-compatible" | "anthropic";
  endpoint: string; // full chat completions URL
  defaultModel: string;
  keyHint: string; // prefix/format hint for validation
  docsUrl: string;
}

export const PROVIDERS: Record<string, ProviderDef> = {
  nvidia: {
    id: "nvidia",
    label: "NVIDIA NIM",
    kind: "openai-compatible",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    defaultModel: "meta/llama-3.1-8b-instruct",
    keyHint: "nvapi-",
    docsUrl: "https://build.nvidia.com/settings/api-keys",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    kind: "openai-compatible",
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    keyHint: "sk-",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    kind: "anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-3-5-haiku-latest",
    keyHint: "sk-ant-",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    kind: "openai-compatible",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-2.0-flash",
    keyHint: "AIza",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  mistral: {
    id: "mistral",
    label: "Mistral AI",
    kind: "openai-compatible",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-small-latest",
    keyHint: "",
    docsUrl: "https://console.mistral.ai/api-keys/",
  },
  cohere: {
    id: "cohere",
    label: "Cohere",
    kind: "openai-compatible",
    endpoint: "https://api.cohere.com/v1/chat/completions",
    defaultModel: "command-r",
    keyHint: "",
    docsUrl: "https://dashboard.cohere.ai/api-keys",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai-compatible",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    defaultModel: "deepseek-chat",
    keyHint: "sk-",
    docsUrl: "https://platform.deepseek.com/api-keys",
  },
  groq: {
    id: "groq",
    label: "Groq",
    kind: "openai-compatible",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    keyHint: "gsk_",
    docsUrl: "https://console.groq.com/keys",
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity",
    kind: "openai-compatible",
    endpoint: "https://api.perplexity.ai/chat/completions",
    defaultModel: "sonar",
    keyHint: "pplx-",
    docsUrl: "https://www.perplexity.ai/settings/api",
  },
  llama: {
    id: "llama",
    label: "Llama (Meta)",
    kind: "openai-compatible",
    endpoint: "https://api.llama.com/v1/chat/completions",
    defaultModel: "Llama-4-Scout-17B-16E-Instruct",
    keyHint: "LLAMA-",
    docsUrl: "https://llama.meta.com/",
  },
  custom: {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    kind: "openai-compatible",
    endpoint: "", // user-provided base URL
    defaultModel: "",
    keyHint: "",
    docsUrl: "",
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS).filter((p) => p.id !== "custom");

export interface GenerateParams {
  apiKey: string;
  provider: ProviderDef;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  baseUrlOverride?: string; // for the "custom" provider
}

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new HttpError(400, "messages must be a non-empty array");
  }
  const out: ChatMessage[] = [];
  let total = 0;
  for (const m of messages.slice(-24)) {
    const role = (m as any)?.role;
    const content = (m as any)?.content;
    if (!["system", "user", "assistant"].includes(role) || typeof content !== "string") continue;
    const trimmed = content.slice(0, 12_000);
    total += trimmed.length;
    if (total > 24_000) break;
    out.push({ role, content: trimmed });
  }
  if (out.length === 0) throw new HttpError(400, "No valid messages provided");
  return out;
}

function extractErrorMessage(data: any, fallback: string): string {
  const err = data?.error;
  if (!err) return fallback;
  if (typeof err === "string") return err;
  return err.message || err.detail || JSON.stringify(err).slice(0, 300);
}

async function callOpenAICompatible(params: GenerateParams, endpoint: string): Promise<string> {
  const body = {
    model: params.model || params.provider.defaultModel,
    messages: sanitizeMessages(params.messages),
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 1024,
    stream: false,
  };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiCallError(res.status, extractErrorMessage(data, `Provider returned ${res.status}`));
  }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new AiCallError(502, "Provider returned an empty response");
  }
  return content;
}

async function callAnthropic(params: GenerateParams): Promise<string> {
  const messages = sanitizeMessages(params.messages);
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const rest = messages.filter((m) => m.role !== "system");
  if (rest.length === 0) rest.push({ role: "user", content: "Please proceed." });

  const res = await fetch(params.provider.endpoint, {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: params.model || params.provider.defaultModel,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.7,
      system: systemParts.join("\n\n") || undefined,
      messages: rest,
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AiCallError(res.status, extractErrorMessage(data, `Provider returned ${res.status}`));
  }
  const content = Array.isArray(data?.content)
    ? data.content.map((b: any) => b?.text ?? "").join("")
    : "";
  if (!content) throw new AiCallError(502, "Provider returned an empty response");
  return content;
}

export class AiCallError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function generateChat(params: GenerateParams): Promise<{ content: string; model: string }> {
  const model = params.model || params.provider.defaultModel;
  if (params.provider.kind === "anthropic") {
    const content = await callAnthropic(params);
    return { content, model };
  }
  const endpoint =
    params.provider.id === "custom"
      ? normalizeCustomEndpoint(params.baseUrlOverride)
      : params.provider.endpoint;
  const content = await callOpenAICompatible(params, endpoint);
  return { content, model };
}

function normalizeCustomEndpoint(baseUrl?: string): string {
  if (!baseUrl) throw new HttpError(400, "Custom provider requires a base_url");
  let url = baseUrl.trim().replace(/\/+$/, "");
  if (!/^https:\/\//.test(url)) throw new HttpError(400, "Custom base_url must use https://");
  if (!url.endsWith("/chat/completions")) url += "/chat/completions";
  return url;
}

/**
 * Calls the platform NVIDIA NIM key, walking the configured model fallback
 * chain so that model catalog changes don't break generation.
 */
export async function generateWithPlatformKey(
  apiKey: string,
  baseUrl: string,
  models: string[],
  messages: ChatMessage[],
  options: { model?: string; temperature?: number; maxTokens?: number },
): Promise<{ content: string; model: string }> {
  const provider: ProviderDef = {
    id: "nvidia",
    label: "NVIDIA NIM",
    kind: "openai-compatible",
    endpoint: `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
    defaultModel: models[0],
    keyHint: "nvapi-",
    docsUrl: "",
  };

  // If the caller asked for a specific model, try it first.
  const chain = options.model ? [options.model, ...models.filter((m) => m !== options.model)] : [...models];

  let lastError: AiCallError | Error | null = null;
  for (const model of chain) {
    try {
      return await generateChat({
        apiKey,
        provider,
        model,
        messages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });
    } catch (err: any) {
      lastError = err;
      // Auth-level failures won't improve with a different model.
      if (err?.status === 401 || err?.status === 403) throw err;
    }
  }
  throw new AiCallError(
    502,
    `All platform models failed. Last error: ${lastError instanceof Error ? lastError.message : "unknown"}`,
  );
}

export const SYSTEM_PROMPT =
  "You are Prompt-Gineer's expert assistant. You specialize in prompt engineering: helping users craft, refine, analyze and improve prompts for any AI model using clear, structured, actionable guidance (the CLEAR framework: Concise, Logical, Explicit, Adaptive, Reflective). Be direct and practical, and format answers in clean Markdown.";
