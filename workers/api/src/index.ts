/**
 * Prompt-Gineer API
 *
 * The browser talks to this Worker through /api. Provider credentials, password
 * hashes, and session material never leave the Worker. D1 migrations are kept
 * beside this entry point so local and remote databases use the same schema.
 */

type ServiceId = "openai" | "anthropic" | "google";
type PromptMode = "structured" | "conversational" | "meta";
type SectionType = "role" | "objective" | "context" | "guidelines" | "constraints" | "output" | "examples" | "custom";

type Env = {
  DB: D1Database;
  RATE_LIMIT?: KVNamespace;
  APP_ORIGIN?: string;
  APP_URL?: string;
  API_URL?: string;
  REQUIRE_EMAIL_VERIFICATION?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  GOOGLE_AI_API_KEY?: string;
  GOOGLE_MODEL?: string;
  SESSION_DAYS?: string;
};

type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: "user" | "admin";
  email_verified: number;
  allow_learning: number;
  email_digest: number;
  show_public_profile: number;
  reduced_motion: number;
  theme: "light" | "dark";
  is_premium: number;
  created_at: string;
  updated_at: string;
  session_id: string;
};

type SectionInput = Partial<Record<SectionType, unknown>> | Array<{ type?: unknown; section_type?: unknown; content?: unknown }>;

type NormalizedSection = {
  type: SectionType;
  content: string;
  order: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_COOKIE = "pg_session";
const MAX_BODY_BYTES = 128 * 1024;
const MAX_PROMPT_BYTES = 40 * 1024;
const VALID_MODES = new Set<PromptMode>(["structured", "conversational", "meta"]);
const VALID_SECTION_TYPES = new Set<SectionType>([
  "role",
  "objective",
  "context",
  "guidelines",
  "constraints",
  "output",
  "examples",
  "custom",
]);
const SECTION_LABELS: Record<SectionType, string> = {
  role: "ROLE",
  objective: "OBJECTIVE",
  context: "CONTEXT",
  guidelines: "GUIDELINES",
  constraints: "CONSTRAINTS",
  output: "OUTPUT FORMAT",
  examples: "EXAMPLES",
  custom: "CUSTOM",
};
const SERVICES: Array<{ id: ServiceId; name: string; description: string; authUrl: string; modelEnv: string }> = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Use OpenAI models through a server-side workspace connection.",
    authUrl: "https://platform.openai.com/api-keys",
    modelEnv: "OPENAI_MODEL",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Use Claude models through a server-side workspace connection.",
    authUrl: "https://console.anthropic.com/settings/keys",
    modelEnv: "ANTHROPIC_MODEL",
  },
  {
    id: "google",
    name: "Google AI",
    description: "Use Gemini models through a server-side workspace connection.",
    authUrl: "https://aistudio.google.com/app/apikey",
    modelEnv: "GOOGLE_MODEL",
  },
];

class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function byteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

function base64UrlEncode(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encodeCursor(value: unknown): string {
  return base64UrlEncode(encoder.encode(JSON.stringify(value)));
}

function decodeCursor(value: string | null): string[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decoder.decode(base64UrlDecode(value))) as unknown;
    if (Array.isArray(parsed) && (parsed.length === 2 || parsed.length === 3) && parsed.every((item) => typeof item === "string")) {
      return parsed as string[];
    }
  } catch {
    // Invalid cursors are client errors rather than a reason to fall back to page one.
  }
  throw new AppError(400, "INVALID_CURSOR", "The pagination cursor is invalid.");
}

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", status >= 400 ? "no-store" : "no-cache");
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function errorResponse(error: unknown, requestId: string): Response {
  const appError = error instanceof AppError ? error : null;
  const status = appError?.status ?? 500;
  const code = appError?.code ?? "INTERNAL_ERROR";
  const message = appError ? appError.message : "Something went wrong while handling this request.";
  const body: Record<string, unknown> = { error: { code, message }, requestId };
  if (appError?.details && status < 500) body.error = { code, message, details: appError.details };
  return jsonResponse(body, status);
}

function headerOrigin(request: Request, env: Env): string | null {
  const requestOrigin = request.headers.get("Origin");
  const configured = (env.APP_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!requestOrigin) return null;
  if (configured.length === 0) return requestOrigin;
  return configured.includes(requestOrigin) ? requestOrigin : null;
}

function withRequestHeaders(response: Response, request: Request, env: Env, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Vary", "Origin");
  const origin = headerOrigin(request, env);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Expose-Headers", "X-Request-ID");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function enforceRequestOrigin(request: Request, env: Env): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return;
  const origin = request.headers.get("Origin");
  const configured = (env.APP_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (origin && configured.length > 0 && !configured.includes(origin)) {
    throw new AppError(403, "ORIGIN_NOT_ALLOWED", "This request origin is not allowed.");
  }
}

function optionsResponse(request: Request, env: Env, requestId: string): Response {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
    "Access-Control-Max-Age": "86400",
  });
  const origin = headerOrigin(request, env);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("X-Request-ID", requestId);
  return new Response(null, { status: 204, headers });
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const piece of cookieHeader.split(";")) {
    const separator = piece.indexOf("=");
    if (separator < 0) continue;
    if (piece.slice(0, separator).trim() === name) return decodeURIComponent(piece.slice(separator + 1).trim());
  }
  return null;
}

function getSessionToken(request: Request): string | null {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim() || null;
  return getCookie(request, SESSION_COOKIE);
}

function cookieAttributes(request: Request, env: Env): { secure: boolean; sameSite: "Lax" | "None" } {
  const secure = new URL(request.url).protocol === "https:" || Boolean(env.APP_URL?.startsWith("https://"));
  const requestOrigin = request.headers.get("Origin");
  const crossOrigin = Boolean(requestOrigin && requestOrigin !== new URL(request.url).origin);
  return { secure, sameSite: secure && crossOrigin ? "None" : "Lax" };
}

function sessionCookie(token: string, request: Request, env: Env): string {
  const attributes = cookieAttributes(request, env);
  const days = Math.min(30, Math.max(1, Number(env.SESSION_DAYS ?? "14") || 14));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${days * 86400}; HttpOnly; SameSite=${attributes.sameSite}${attributes.secure ? "; Secure" : ""}`;
}

function expiredSessionCookie(request: Request, env: Env): string {
  const attributes = cookieAttributes(request, env);
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=${attributes.sameSite}${attributes.secure ? "; Secure" : ""}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

async function passwordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$120000$${base64UrlEncode(salt)}$${base64UrlEncode(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 500_000) return false;
  try {
    const salt = base64UrlDecode(parts[2]);
    const expected = base64UrlDecode(parts[3]);
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, expected.byteLength * 8);
    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
    return difference === 0;
  } catch {
    return false;
  }
}

function stringValue(value: unknown, field: string, min = 0, max = 10_000): string {
  if (typeof value !== "string") throw new AppError(400, "INVALID_INPUT", `${field} must be a string.`);
  const result = value.trim();
  if (result.length < min || result.length > max) {
    throw new AppError(400, "INVALID_INPUT", `${field} must be between ${min} and ${max} characters.`);
  }
  return result;
}

function optionalString(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return stringValue(value, field, 0, max);
}

function boolValue(value: unknown, field: string, fallback?: boolean): boolean {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "boolean") throw new AppError(400, "INVALID_INPUT", `${field} must be a boolean.`);
  return value;
}

function emailValue(value: unknown): string {
  const email = stringValue(value, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, "INVALID_EMAIL", "Enter a valid email address.");
  return email;
}

function passwordValue(value: unknown): string {
  const password = stringValue(value, "password", 12, 128);
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError(400, "WEAK_PASSWORD", "Password must contain at least one letter and one number.");
  }
  return password;
}

async function requestJson(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (byteLength(raw) > MAX_BODY_BYTES) throw new AppError(413, "BODY_TOO_LARGE", "This request is too large.");
  if (!raw.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new AppError(400, "INVALID_JSON", "Request body must be a JSON object.");
  return parsed as Record<string, unknown>;
}

async function optionalUser(env: Env, request: Request): Promise<AuthUser | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const user = await env.DB.prepare(
    `SELECT u.id, u.email, u.full_name, u.avatar_url, u.role, u.email_verified, u.allow_learning, u.email_digest, u.show_public_profile, u.reduced_motion, u.theme, u.is_premium, u.created_at, u.updated_at, s.id AS session_id
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? LIMIT 1`,
  ).bind(tokenHash, now()).first<AuthUser>();
  if (!user) return null;
  await env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").bind(now(), user.session_id).run();
  return user;
}

async function requireUser(env: Env, request: Request): Promise<AuthUser> {
  const user = await optionalUser(env, request);
  if (!user) throw new AppError(401, "UNAUTHENTICATED", "Sign in to continue.");
  return user;
}

function userPayload(user: AuthUser): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    emailVerified: Boolean(user.email_verified),
    allowLearning: Boolean(user.allow_learning),
    emailDigest: Boolean(user.email_digest),
    showPublicProfile: Boolean(user.show_public_profile),
    reducedMotion: Boolean(user.reduced_motion),
    theme: user.theme,
    isPremium: Boolean(user.is_premium),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

async function createSession(env: Env, userId: string, request: Request): Promise<{ token: string; cookie: string }> {
  const token = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const createdAt = now();
  const days = Math.min(30, Math.max(1, Number(env.SESSION_DAYS ?? "14") || 14));
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(id("session"), userId, tokenHash, expiresAt, createdAt, createdAt).run();
  return { token, cookie: sessionCookie(token, request, env) };
}

async function audit(env: Env, actorId: string | null, action: string, resourceType: string, resourceId: string | null, metadata: unknown = {}): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO audit_events (id, actor_id, action, resource_type, resource_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).bind(id("audit"), actorId, action, resourceType, resourceId, JSON.stringify(metadata), now()).run();
}

async function enforceRateLimit(env: Env, request: Request, bucket: string, limit: number, windowSeconds = 60): Promise<void> {
  if (!env.RATE_LIMIT) return;
  const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown";
  const key = `rate:${bucket}:${ip}`;
  const current = Number(await env.RATE_LIMIT.get(key) ?? "0");
  if (current >= limit) throw new AppError(429, "RATE_LIMITED", "Too many requests. Please try again shortly.");
  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: windowSeconds });
}

function requirePromptMode(value: unknown): PromptMode {
  const mode = stringValue(value ?? "structured", "mode", 1, 30) as PromptMode;
  if (!VALID_MODES.has(mode)) throw new AppError(400, "INVALID_MODE", "Choose a supported prompt mode.");
  return mode;
}

function normalizeSections(input: unknown): NormalizedSection[] {
  if (input === undefined || input === null) return [];
  const result: NormalizedSection[] = [];
  if (Array.isArray(input)) {
    input.forEach((item, index) => {
      if (!item || typeof item !== "object") throw new AppError(400, "INVALID_SECTIONS", "Each section must be an object.");
      const record = item as Record<string, unknown>;
      const type = String(record.type ?? record.section_type ?? "custom") as SectionType;
      const content = stringValue(record.content ?? "", `sections[${index}].content`, 0, MAX_PROMPT_BYTES);
      if (!VALID_SECTION_TYPES.has(type)) throw new AppError(400, "INVALID_SECTIONS", `Unsupported section type: ${type}.`);
      if (content) result.push({ type, content, order: index });
    });
    return result.slice(0, 20);
  }
  if (typeof input !== "object") throw new AppError(400, "INVALID_SECTIONS", "sections must be an object or array.");
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const type = key as SectionType;
    if (!VALID_SECTION_TYPES.has(type)) continue;
    const content = stringValue(value ?? "", `sections.${key}`, 0, MAX_PROMPT_BYTES);
    if (content) result.push({ type, content, order: result.length });
  }
  return result.slice(0, 20);
}

function composeContent(sections: NormalizedSection[]): string {
  return sections.map((section) => `${SECTION_LABELS[section.type]}\n${section.content}`).join("\n\n");
}

function tagsValue(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 8) throw new AppError(400, "INVALID_TAGS", "tags must be an array of up to eight values.");
  return value.map((tag, index) => stringValue(tag, `tags[${index}]`, 1, 32).toLowerCase()).filter((tag, index, list) => list.indexOf(tag) === index);
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function initials(name: string | null): string {
  return (name ?? "Prompt user").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "PU";
}

type PromptRow = {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  mode: PromptMode;
  category: string;
  tags_json: string;
  content: string;
  is_public: number;
  likes: number;
  views: number;
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
  author_public?: number;
  liked_by_me?: number;
};

function promptPayload(row: PromptRow, sections?: Array<Record<string, unknown>>): Record<string, unknown> {
  const visibleAuthorName = row.author_name ? (row.author_public === 0 ? "Community member" : row.author_name) : null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    mode: row.mode,
    category: row.category,
    tags: parseTags(row.tags_json),
    content: row.content,
    isPublic: Boolean(row.is_public),
    likes: row.likes,
    views: row.views,
    likedByMe: Boolean(row.liked_by_me),
    author: visibleAuthorName ? { id: row.user_id, name: visibleAuthorName, initials: initials(visibleAuthorName), avatarUrl: row.author_public === 0 ? null : row.author_avatar_url } : null,
    sections,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicPromptPredicate(user: AuthUser | null): { sql: string; values: unknown[] } {
  if (!user) return { sql: "p.is_public = 1", values: [] };
  return { sql: "(p.is_public = 1 OR p.user_id = ?)", values: [user.id] };
}

async function promptRow(env: Env, promptId: string, user: AuthUser | null): Promise<PromptRow> {
  const predicate = publicPromptPredicate(user);
  const row = await env.DB.prepare(
    `SELECT p.id, p.user_id, p.title, p.description, p.mode, p.category, p.tags_json, p.content, p.is_public, p.likes, p.views, p.created_at, p.updated_at,
       u.full_name AS author_name, u.avatar_url AS author_avatar_url, u.show_public_profile AS author_public,
       CASE WHEN ? IS NOT NULL THEN EXISTS(SELECT 1 FROM likes l WHERE l.prompt_id = p.id AND l.user_id = ?) ELSE 0 END AS liked_by_me
     FROM prompts p LEFT JOIN users u ON u.id = p.user_id
     WHERE p.id = ? AND ${predicate.sql} LIMIT 1`,
  ).bind(user?.id ?? null, user?.id ?? null, promptId, ...predicate.values).first<PromptRow>();
  if (!row) throw new AppError(404, "PROMPT_NOT_FOUND", "That prompt is unavailable.");
  return row;
}

async function sectionsForPrompt(env: Env, promptId: string): Promise<Array<Record<string, unknown>>> {
  const result = await env.DB.prepare(
    "SELECT id, prompt_id, section_type, content, order_index, created_at, updated_at FROM prompt_sections WHERE prompt_id = ? ORDER BY order_index ASC, id ASC",
  ).bind(promptId).all<Record<string, unknown>>();
  return result.results;
}

function publicSort(value: string | null): string {
  if (value === "popular") return "p.likes DESC, p.created_at DESC, p.id DESC";
  if (value === "viewed") return "p.views DESC, p.created_at DESC, p.id DESC";
  return "p.created_at DESC, p.id DESC";
}

async function listPrompts(env: Env, request: Request, user: AuthUser | null, ownOnly = false): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "24") || 24));
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  const search = (url.searchParams.get("q") ?? url.searchParams.get("search") ?? "").trim().slice(0, 120);
  const category = (url.searchParams.get("category") ?? "").trim().slice(0, 80);
  const mode = (url.searchParams.get("mode") ?? "").trim();
  const sort = publicSort(url.searchParams.get("sort"));
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (ownOnly) {
    if (!user) throw new AppError(401, "UNAUTHENTICATED", "Sign in to view your prompts.");
    conditions.push("p.user_id = ?");
    values.push(user.id);
  } else {
    // The public library never mixes in a caller's private drafts; /me/prompts is the private feed.
    conditions.push("p.is_public = 1");
  }
  if (search) {
    conditions.push("(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.content) LIKE ?)");
    const needle = `%${search.toLowerCase().replace(/[\\%_]/g, "\\$&")}%`;
    values.push(needle, needle, needle);
  }
  if (category) {
    conditions.push("p.category = ?");
    values.push(category);
  }
  if (VALID_MODES.has(mode as PromptMode)) {
    conditions.push("p.mode = ?");
    values.push(mode);
  }
  if (cursor) {
    if (sort === "p.created_at DESC, p.id DESC" && cursor.length === 2) {
      conditions.push("(p.created_at < ? OR (p.created_at = ? AND p.id < ?))");
      values.push(cursor[0], cursor[0], cursor[1]);
    } else if (cursor.length === 3 && (sort === "p.likes DESC, p.created_at DESC, p.id DESC" || sort === "p.views DESC, p.created_at DESC, p.id DESC")) {
      const metric = sort.startsWith("p.likes") ? "p.likes" : "p.views";
      const metricValue = Number(cursor[0]);
      if (!Number.isSafeInteger(metricValue) || metricValue < 0) throw new AppError(400, "INVALID_CURSOR", "The pagination cursor is invalid.");
      conditions.push(`(${metric} < ? OR (${metric} = ? AND (p.created_at < ? OR (p.created_at = ? AND p.id < ?))))`);
      values.push(metricValue, metricValue, cursor[1], cursor[1], cursor[2]);
    } else {
      throw new AppError(400, "INVALID_CURSOR", "The pagination cursor does not match this sort order.");
    }
  }
  const likeUser = user?.id ?? null;
  const query = `SELECT p.id, p.user_id, p.title, p.description, p.mode, p.category, p.tags_json, p.content, p.is_public, p.likes, p.views, p.created_at, p.updated_at,
      u.full_name AS author_name, u.avatar_url AS author_avatar_url, u.show_public_profile AS author_public,
      CASE WHEN ? IS NOT NULL THEN EXISTS(SELECT 1 FROM likes l WHERE l.prompt_id = p.id AND l.user_id = ?) ELSE 0 END AS liked_by_me
    FROM prompts p LEFT JOIN users u ON u.id = p.user_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY ${sort} LIMIT ?`;
  const result = await env.DB.prepare(query).bind(likeUser, likeUser, ...values, limit + 1).all<PromptRow>();
  const hasMore = result.results.length > limit;
  const rows = hasMore ? result.results.slice(0, limit) : result.results;
  const lastRow = rows[rows.length - 1];
  const nextCursor = hasMore && lastRow
    ? encodeCursor(sort === "p.created_at DESC, p.id DESC" ? [lastRow.created_at, lastRow.id] : [String(sort.startsWith("p.likes") ? lastRow.likes : lastRow.views), lastRow.created_at, lastRow.id])
    : null;
  return jsonResponse({ prompts: rows.map((row) => promptPayload(row)), nextCursor, hasMore });
}

async function createPrompt(env: Env, request: Request, user: AuthUser): Promise<Response> {
  const body = await requestJson(request);
  const title = stringValue(body.title, "title", 3, 120);
  const description = stringValue(body.description ?? "", "description", 0, 600);
  const mode = requirePromptMode(body.mode);
  const category = stringValue(body.category ?? "Software & product", "category", 1, 80);
  const tags = tagsValue(body.tags);
  const sections = normalizeSections(body.sections);
  const suppliedContent = body.content === undefined ? "" : stringValue(body.content, "content", 0, MAX_PROMPT_BYTES);
  const content = composeContent(sections) || suppliedContent;
  if (!content.trim()) throw new AppError(400, "EMPTY_PROMPT", "Add at least one prompt section before saving.");
  if (byteLength(content) > MAX_PROMPT_BYTES) throw new AppError(413, "PROMPT_TOO_LARGE", "Prompt content is too large.");
  const isPublic = boolValue(body.isPublic, "isPublic", false);
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() || null;
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 120)) throw new AppError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be between 8 and 120 characters.");
  const promptId = idempotencyKey ? `prompt_${(await sha256(`${user.id}:${idempotencyKey}`)).slice(0, 48)}` : id("prompt");
  const createdAt = now();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO prompts (id, user_id, title, description, mode, category, tags_json, content, is_public, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(promptId, user.id, title, description, mode, category, JSON.stringify(tags), content, isPublic ? 1 : 0, createdAt, createdAt),
  ];
  sections.forEach((section) => {
    statements.push(env.DB.prepare(
      "INSERT INTO prompt_sections (id, prompt_id, section_type, content, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(id("section"), promptId, section.type, section.content, section.order, createdAt, createdAt));
  });
  try {
    await env.DB.batch(statements);
  } catch (error) {
    if (!idempotencyKey) throw error;
    const existing = await promptRow(env, promptId, user);
    return jsonResponse({ prompt: promptPayload(existing, await sectionsForPrompt(env, promptId)) }, 200, { "Idempotent-Replay": "true" });
  }
  await audit(env, user.id, "prompt.created", "prompt", promptId, { isPublic, mode });
  const row = await promptRow(env, promptId, user);
  return jsonResponse({ prompt: promptPayload(row, await sectionsForPrompt(env, promptId)) }, 201);
}

async function updatePrompt(env: Env, request: Request, user: AuthUser, promptId: string): Promise<Response> {
  const existing = await promptRow(env, promptId, user);
  if (existing.user_id !== user.id) throw new AppError(403, "FORBIDDEN", "You can only edit your own prompts.");
  const body = await requestJson(request);
  const title = body.title === undefined ? existing.title : stringValue(body.title, "title", 3, 120);
  const description = body.description === undefined ? existing.description : stringValue(body.description, "description", 0, 600);
  const mode = body.mode === undefined ? existing.mode : requirePromptMode(body.mode);
  const category = body.category === undefined ? existing.category : stringValue(body.category, "category", 1, 80);
  const tags = body.tags === undefined ? parseTags(existing.tags_json) : tagsValue(body.tags);
  const isPublic = body.isPublic === undefined ? Boolean(existing.is_public) : boolValue(body.isPublic, "isPublic");
  const sections = body.sections === undefined ? null : normalizeSections(body.sections);
  const suppliedContent = body.content === undefined ? existing.content : stringValue(body.content, "content", 0, MAX_PROMPT_BYTES);
  const content = sections ? composeContent(sections) || suppliedContent : suppliedContent;
  if (!content.trim()) throw new AppError(400, "EMPTY_PROMPT", "Add at least one prompt section before saving.");
  if (byteLength(content) > MAX_PROMPT_BYTES) throw new AppError(413, "PROMPT_TOO_LARGE", "Prompt content is too large.");
  const updatedAt = now();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      "UPDATE prompts SET title = ?, description = ?, mode = ?, category = ?, tags_json = ?, content = ?, is_public = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    ).bind(title, description, mode, category, JSON.stringify(tags), content, isPublic ? 1 : 0, updatedAt, promptId, user.id),
  ];
  if (sections) {
    statements.push(env.DB.prepare("DELETE FROM prompt_sections WHERE prompt_id = ?").bind(promptId));
    sections.forEach((section) => statements.push(env.DB.prepare(
      "INSERT INTO prompt_sections (id, prompt_id, section_type, content, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(id("section"), promptId, section.type, section.content, section.order, updatedAt, updatedAt)));
  }
  await env.DB.batch(statements);
  await audit(env, user.id, "prompt.updated", "prompt", promptId, { isPublic });
  const row = await promptRow(env, promptId, user);
  return jsonResponse({ prompt: promptPayload(row, await sectionsForPrompt(env, promptId)) });
}

async function deletePrompt(env: Env, user: AuthUser, promptId: string): Promise<Response> {
  const existing = await promptRow(env, promptId, user);
  if (existing.user_id !== user.id && user.role !== "admin") throw new AppError(403, "FORBIDDEN", "You can only delete your own prompts.");
  await env.DB.prepare("DELETE FROM prompts WHERE id = ?").bind(promptId).run();
  await audit(env, user.id, "prompt.deleted", "prompt", promptId);
  return jsonResponse({ deleted: true, id: promptId });
}

async function getPromptDetail(env: Env, request: Request, user: AuthUser | null, promptId: string): Promise<Response> {
  const row = await promptRow(env, promptId, user);
  if (!user || user.id !== row.user_id) await env.DB.prepare("UPDATE prompts SET views = views + 1 WHERE id = ?").bind(promptId).run();
  const refreshed = await promptRow(env, promptId, user);
  return jsonResponse({ prompt: promptPayload(refreshed, await sectionsForPrompt(env, promptId)) });
}

async function toggleLike(env: Env, request: Request, user: AuthUser, promptId: string): Promise<Response> {
  const row = await promptRow(env, promptId, user);
  if (!row.is_public && row.user_id !== user.id) throw new AppError(404, "PROMPT_NOT_FOUND", "That prompt is unavailable.");
  const existing = await env.DB.prepare("SELECT 1 AS liked FROM likes WHERE user_id = ? AND prompt_id = ?").bind(user.id, promptId).first<{ liked: number }>();
  const timestamp = now();
  let liked: boolean;
  if (existing) {
    const deleted = await env.DB.prepare("DELETE FROM likes WHERE user_id = ? AND prompt_id = ?").bind(user.id, promptId).run();
    if (deleted.meta.changes > 0) await env.DB.prepare("UPDATE prompts SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE id = ?").bind(promptId).run();
    liked = false;
  } else {
    const inserted = await env.DB.prepare("INSERT OR IGNORE INTO likes (user_id, prompt_id, created_at) VALUES (?, ?, ?)").bind(user.id, promptId, timestamp).run();
    if (inserted.meta.changes > 0) await env.DB.prepare("UPDATE prompts SET likes = likes + 1 WHERE id = ?").bind(promptId).run();
    liked = inserted.meta.changes > 0;
  }
  const updated = await env.DB.prepare("SELECT likes FROM prompts WHERE id = ?").bind(promptId).first<{ likes: number }>();
  return jsonResponse({ liked, likes: updated?.likes ?? 0 });
}

async function comments(env: Env, request: Request, user: AuthUser | null, promptId: string): Promise<Response> {
  const row = await promptRow(env, promptId, user);
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50));
  const result = await env.DB.prepare(
    `SELECT c.id, c.user_id, c.prompt_id, c.content, c.created_at, c.updated_at,
       CASE WHEN u.show_public_profile = 1 THEN u.full_name ELSE 'Community member' END AS full_name,
       CASE WHEN u.show_public_profile = 1 THEN u.avatar_url ELSE NULL END AS avatar_url
     FROM comments c JOIN users u ON u.id = c.user_id WHERE c.prompt_id = ? ORDER BY c.created_at DESC LIMIT ?`,
  ).bind(promptId, limit).all<Record<string, unknown>>();
  if (!row.is_public && row.user_id !== user?.id) throw new AppError(404, "PROMPT_NOT_FOUND", "That prompt is unavailable.");
  return jsonResponse({ comments: result.results.map((comment) => ({
    id: comment.id,
    userId: comment.user_id,
    promptId: comment.prompt_id,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    user: { id: comment.user_id, fullName: comment.full_name, avatarUrl: comment.avatar_url, initials: initials(comment.full_name as string | null) },
  })) });
}

async function addComment(env: Env, request: Request, user: AuthUser, promptId: string): Promise<Response> {
  const row = await promptRow(env, promptId, user);
  if (!row.is_public && row.user_id !== user.id) throw new AppError(404, "PROMPT_NOT_FOUND", "That prompt is unavailable.");
  const body = await requestJson(request);
  const content = stringValue(body.content, "content", 1, 2_000);
  const commentId = id("comment");
  const timestamp = now();
  await env.DB.prepare(
    "INSERT INTO comments (id, user_id, prompt_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(commentId, user.id, promptId, content, timestamp, timestamp).run();
  await audit(env, user.id, "comment.created", "prompt", promptId);
  return jsonResponse({ comment: { id: commentId, userId: user.id, promptId, content, createdAt: timestamp, updatedAt: timestamp, user: { id: user.id, fullName: user.full_name, avatarUrl: user.avatar_url, initials: initials(user.full_name) } } }, 201);
}

async function deleteComment(env: Env, user: AuthUser, promptId: string, commentId: string): Promise<Response> {
  const comment = await env.DB.prepare("SELECT user_id FROM comments WHERE id = ? AND prompt_id = ?").bind(commentId, promptId).first<{ user_id: string }>();
  if (!comment) throw new AppError(404, "COMMENT_NOT_FOUND", "That comment is unavailable.");
  if (comment.user_id !== user.id && user.role !== "admin") throw new AppError(403, "FORBIDDEN", "You can only delete your own comments.");
  await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();
  return jsonResponse({ deleted: true, id: commentId });
}

function requiresEmailVerification(env: Env): boolean {
  return env.REQUIRE_EMAIL_VERIFICATION !== "false";
}

function appUrl(env: Env, request: Request): string {
  return (env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}

function apiUrl(env: Env, request: Request): string {
  return (env.API_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}

async function sendEmail(env: Env, to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Email delivery is not configured on this deployment.");
  const from = env.EMAIL_FROM;
  if (!from) throw new AppError(503, "EMAIL_NOT_CONFIGURED", "EMAIL_FROM is not configured on this deployment.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new AppError(502, "EMAIL_DELIVERY_FAILED", "Email delivery is temporarily unavailable.");
}

async function register(env: Env, request: Request): Promise<Response> {
  await enforceRateLimit(env, request, "register", 5, 300);
  const body = await requestJson(request);
  const email = emailValue(body.email);
  const password = passwordValue(body.password);
  const fullName = stringValue(body.fullName ?? body.full_name ?? "", "fullName", 0, 80);
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: string }>();
  if (existing) throw new AppError(409, "EMAIL_IN_USE", "An account with that email already exists.");
  const needsVerification = requiresEmailVerification(env);
  if (needsVerification && (!env.RESEND_API_KEY || !env.EMAIL_FROM)) {
    throw new AppError(503, "EMAIL_NOT_CONFIGURED", "This deployment requires email verification, but email delivery is not configured.");
  }
  const timestamp = now();
  const userId = id("user");
  const hash = await passwordHash(password);
  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(userId, email, hash, fullName, needsVerification ? 0 : 1, timestamp, timestamp).run();
  if (needsVerification) {
    const token = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare(
      "INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    ).bind(await sha256(token), userId, new Date(Date.now() + 86_400_000).toISOString(), timestamp).run();
    const verificationUrl = `${apiUrl(env, request)}/api/auth/verify?token=${encodeURIComponent(token)}`;
    try {
      await sendEmail(env, email, "Verify your Prompt-Gineer account", `<p>Verify your Prompt-Gineer account:</p><p><a href="${verificationUrl}">Verify email address</a></p><p>This link expires in 24 hours.</p>`);
    } catch (error) {
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
      throw error;
    }
    return jsonResponse({ user: { id: userId, email, fullName }, requiresEmailVerification: true, session: null }, 201);
  }
  const createdUser = await env.DB.prepare("SELECT id, email, full_name, avatar_url, role, email_verified, allow_learning, email_digest, show_public_profile, reduced_motion, theme, is_premium, created_at, updated_at, '' AS session_id FROM users WHERE id = ?").bind(userId).first<AuthUser>();
  if (!createdUser) throw new AppError(500, "REGISTRATION_FAILED", "Account creation failed.");
  const session = await createSession(env, userId, request);
  const response = jsonResponse({ user: userPayload(createdUser), requiresEmailVerification: false }, 201, { "Set-Cookie": session.cookie });
  return response;
}

async function login(env: Env, request: Request): Promise<Response> {
  await enforceRateLimit(env, request, "login", 10, 60);
  const body = await requestJson(request);
  const email = emailValue(body.email);
  const password = stringValue(body.password, "password", 1, 128);
  const user = await env.DB.prepare(
    "SELECT id, email, password_hash, full_name, avatar_url, role, email_verified, allow_learning, email_digest, show_public_profile, reduced_motion, theme, is_premium, created_at, updated_at, '' AS session_id FROM users WHERE email = ? LIMIT 1",
  ).bind(email).first<AuthUser & { password_hash: string }>();
  if (!user || !(await verifyPassword(password, user.password_hash))) throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  if (requiresEmailVerification(env) && !user.email_verified) throw new AppError(403, "EMAIL_NOT_VERIFIED", "Verify your email address before signing in.");
  const session = await createSession(env, user.id, request);
  await audit(env, user.id, "auth.login", "session", null);
  const { password_hash: _passwordHash, ...safeUser } = user;
  return jsonResponse({ user: userPayload(safeUser), session: { expiresAt: new Date(Date.now() + (Number(env.SESSION_DAYS ?? "14") || 14) * 86_400_000).toISOString() } }, 200, { "Set-Cookie": session.cookie });
}

async function logout(env: Env, request: Request): Promise<Response> {
  const token = getSessionToken(request);
  if (token) await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?").bind(now(), await sha256(token)).run();
  return jsonResponse({ signedOut: true }, 200, { "Set-Cookie": expiredSessionCookie(request, env) });
}

async function verifyEmail(env: Env, request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token.length < 20) throw new AppError(400, "INVALID_TOKEN", "Verification token is invalid.");
  const tokenHash = await sha256(token);
  const record = await env.DB.prepare(
    "SELECT user_id FROM email_verification_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? LIMIT 1",
  ).bind(tokenHash, now()).first<{ user_id: string }>();
  if (!record) throw new AppError(400, "INVALID_TOKEN", "Verification token is invalid or expired.");
  const timestamp = now();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?").bind(timestamp, record.user_id),
    env.DB.prepare("UPDATE email_verification_tokens SET used_at = ? WHERE token_hash = ?").bind(timestamp, tokenHash),
  ]);
  const acceptsHtml = request.headers.get("Accept")?.includes("text/html");
  if (acceptsHtml) return new Response("Email verified. You can return to Prompt-Gineer and sign in.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return jsonResponse({ verified: true });
}

async function requestPasswordReset(env: Env, request: Request): Promise<Response> {
  await enforceRateLimit(env, request, "password-reset", 5, 300);
  const body = await requestJson(request);
  const email = emailValue(body.email);
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new AppError(503, "EMAIL_NOT_CONFIGURED", "Email delivery is not configured on this deployment.");
  const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: string }>();
  if (!user) return jsonResponse({ accepted: true });
  const token = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const timestamp = now();
  await env.DB.prepare(
    "INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).bind(await sha256(token), user.id, new Date(Date.now() + 3_600_000).toISOString(), timestamp).run();
  const resetUrl = `${appUrl(env, request)}/auth?reset=1&token=${encodeURIComponent(token)}`;
  await sendEmail(env, email, "Reset your Prompt-Gineer password", `<p>Reset your Prompt-Gineer password:</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in one hour.</p>`);
  return jsonResponse({ accepted: true });
}

async function resetPassword(env: Env, request: Request): Promise<Response> {
  const body = await requestJson(request);
  const token = stringValue(body.token, "token", 20, 300);
  const password = passwordValue(body.password);
  const tokenHash = await sha256(token);
  const record = await env.DB.prepare(
    "SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? LIMIT 1",
  ).bind(tokenHash, now()).first<{ user_id: string }>();
  if (!record) throw new AppError(400, "INVALID_TOKEN", "Reset token is invalid or expired.");
  const timestamp = now();
  const hash = await passwordHash(password);
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(hash, timestamp, record.user_id),
    env.DB.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?").bind(timestamp, tokenHash),
    env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").bind(timestamp, record.user_id),
  ]);
  return jsonResponse({ reset: true });
}

async function me(env: Env, request: Request, user: AuthUser): Promise<Response> {
  const result = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) AS public_count FROM prompts WHERE user_id = ?").bind(user.id),
    env.DB.prepare("SELECT COALESCE(SUM(points), 0) AS points FROM user_points WHERE user_id = ?").bind(user.id),
    env.DB.prepare("SELECT id, service_name, is_active, created_at, updated_at FROM service_connections WHERE user_id = ? AND is_active = 1 ORDER BY service_name").bind(user.id),
  ]);
  const stats = result[0].results[0] as { total: number; public_count: number } | undefined;
  const points = result[1].results[0] as { points: number } | undefined;
  return jsonResponse({
    user: userPayload(user),
    settings: { userId: user.id, allowLearning: Boolean(user.allow_learning), emailDigest: Boolean(user.email_digest), showPublicProfile: Boolean(user.show_public_profile), reducedMotion: Boolean(user.reduced_motion), theme: user.theme, isPremium: Boolean(user.is_premium), updatedAt: user.updated_at },
    stats: { prompts: Number(stats?.total ?? 0), publicPrompts: Number(stats?.public_count ?? 0), points: Number(points?.points ?? 0) },
    services: (result[2].results as Array<Record<string, unknown>>).map((service) => ({ id: service.id, serviceName: service.service_name, isActive: Boolean(service.is_active), createdAt: service.created_at, updatedAt: service.updated_at })),
  });
}

async function updateMe(env: Env, request: Request, user: AuthUser): Promise<Response> {
  const body = await requestJson(request);
  const fullName = body.fullName === undefined ? user.full_name : stringValue(body.fullName, "fullName", 0, 80);
  const avatarUrl = body.avatarUrl === undefined ? user.avatar_url : optionalString(body.avatarUrl, "avatarUrl", 500);
  if (avatarUrl && !/^https:\/\//i.test(avatarUrl)) throw new AppError(400, "INVALID_AVATAR_URL", "avatarUrl must use HTTPS.");
  const timestamp = now();
  await env.DB.prepare("UPDATE users SET full_name = ?, avatar_url = ?, updated_at = ? WHERE id = ?").bind(fullName, avatarUrl, timestamp, user.id).run();
  const updated = await env.DB.prepare("SELECT id, email, full_name, avatar_url, role, email_verified, allow_learning, email_digest, show_public_profile, reduced_motion, theme, is_premium, created_at, updated_at, '' AS session_id FROM users WHERE id = ?").bind(user.id).first<AuthUser>();
  if (!updated) throw new AppError(500, "PROFILE_UPDATE_FAILED", "Profile update failed.");
  return jsonResponse({ user: userPayload(updated) });
}

async function settings(env: Env, request: Request, user: AuthUser): Promise<Response> {
  if (request.method === "GET") {
    return jsonResponse({ settings: { userId: user.id, allowLearning: Boolean(user.allow_learning), emailDigest: Boolean(user.email_digest), showPublicProfile: Boolean(user.show_public_profile), reducedMotion: Boolean(user.reduced_motion), theme: user.theme, isPremium: Boolean(user.is_premium), updatedAt: user.updated_at } });
  }
  const body = await requestJson(request);
  const allowLearning = body.allowLearning === undefined ? Boolean(user.allow_learning) : boolValue(body.allowLearning, "allowLearning");
  const emailDigest = body.emailDigest === undefined ? Boolean(user.email_digest) : boolValue(body.emailDigest, "emailDigest");
  const showPublicProfile = body.showPublicProfile === undefined ? Boolean(user.show_public_profile) : boolValue(body.showPublicProfile, "showPublicProfile");
  const reducedMotion = body.reducedMotion === undefined ? Boolean(user.reduced_motion) : boolValue(body.reducedMotion, "reducedMotion");
  const theme = body.theme === undefined ? user.theme : stringValue(body.theme, "theme", 1, 10);
  if (theme !== "light" && theme !== "dark") throw new AppError(400, "INVALID_THEME", "theme must be light or dark.");
  const timestamp = now();
  await env.DB.prepare("UPDATE users SET allow_learning = ?, email_digest = ?, show_public_profile = ?, reduced_motion = ?, theme = ?, updated_at = ? WHERE id = ?").bind(allowLearning ? 1 : 0, emailDigest ? 1 : 0, showPublicProfile ? 1 : 0, reducedMotion ? 1 : 0, theme, timestamp, user.id).run();
  return jsonResponse({ settings: { userId: user.id, allowLearning, emailDigest, showPublicProfile, reducedMotion, theme, isPremium: Boolean(user.is_premium), updatedAt: timestamp } });
}

async function exportData(env: Env, user: AuthUser): Promise<Response> {
  const [prompts, comments, services] = await Promise.all([
    env.DB.prepare("SELECT id, title, description, mode, category, tags_json, content, is_public, likes, views, created_at, updated_at FROM prompts WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all<Record<string, unknown>>(),
    env.DB.prepare("SELECT id, prompt_id, content, created_at, updated_at FROM comments WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all<Record<string, unknown>>(),
    env.DB.prepare("SELECT service_name, is_active, created_at, updated_at FROM service_connections WHERE user_id = ?").bind(user.id).all<Record<string, unknown>>(),
  ]);
  return jsonResponse({ exportedAt: now(), user: userPayload(user), prompts: prompts.results, comments: comments.results, services: services.results });
}

async function serviceMetadata(env: Env, user: AuthUser): Promise<Response> {
  const connected = await env.DB.prepare("SELECT service_name FROM service_connections WHERE user_id = ? AND is_active = 1").bind(user.id).all<{ service_name: string }>();
  const connectedSet = new Set(connected.results.map((row) => row.service_name));
  return jsonResponse({ services: SERVICES.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    authUrl: service.authUrl,
    connected: connectedSet.has(service.id),
    configured: providerConfigured(env, service.id),
  })) });
}

function serviceId(value: string): ServiceId {
  if (!SERVICES.some((service) => service.id === value)) throw new AppError(404, "SERVICE_NOT_FOUND", "That AI service is not supported.");
  return value as ServiceId;
}

function providerConfigured(env: Env, service: ServiceId): boolean {
  if (service === "openai") return Boolean(env.OPENAI_API_KEY);
  if (service === "anthropic") return Boolean(env.ANTHROPIC_API_KEY);
  return Boolean(env.GOOGLE_AI_API_KEY);
}

async function connectService(env: Env, request: Request, user: AuthUser, service: ServiceId, connect: boolean): Promise<Response> {
  if (connect && !providerConfigured(env, service)) throw new AppError(503, "PROVIDER_NOT_CONFIGURED", "This provider is not configured on the server yet.");
  const timestamp = now();
  if (connect) {
    await env.DB.prepare(
      `INSERT INTO service_connections (id, user_id, service_name, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)
       ON CONFLICT(user_id, service_name) DO UPDATE SET is_active = 1, updated_at = excluded.updated_at`,
    ).bind(id("service"), user.id, service, timestamp, timestamp).run();
  } else {
    await env.DB.prepare("UPDATE service_connections SET is_active = 0, updated_at = ? WHERE user_id = ? AND service_name = ?").bind(timestamp, user.id, service).run();
  }
  return jsonResponse({ service: serviceId(service), connected: connect });
}

function providerText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => providerText(item)).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return providerText(record.text ?? record.content ?? record.output ?? record.value ?? "");
  }
  return "";
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 45_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new AppError(504, "PROVIDER_TIMEOUT", "The provider took too long to respond.");
    throw new AppError(502, "PROVIDER_UNAVAILABLE", "The provider could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

async function runProvider(env: Env, request: Request, user: AuthUser): Promise<Response> {
  await enforceRateLimit(env, request, `provider:${user.id}`, 20, 60);
  const body = await requestJson(request);
  const service = serviceId(stringValue(body.serviceId ?? body.service ?? "", "serviceId", 1, 30));
  const promptId = body.promptId === undefined ? null : stringValue(body.promptId, "promptId", 1, 120);
  let prompt = body.prompt === undefined ? "" : stringValue(body.prompt, "prompt", 1, MAX_PROMPT_BYTES);
  if (promptId) {
    const row = await promptRow(env, promptId, user);
    if (!row.is_public && row.user_id !== user.id) throw new AppError(404, "PROMPT_NOT_FOUND", "That prompt is unavailable.");
    prompt = row.content;
  }
  const input = body.input === undefined ? "" : stringValue(body.input, "input", 0, 12_000);
  const source = `${prompt}${input ? `\n\nUSER INPUT\n${input}` : ""}`.trim();
  if (!source) throw new AppError(400, "EMPTY_PROMPT", "Provide a prompt or promptId to run.");
  if (!providerConfigured(env, service)) throw new AppError(503, "PROVIDER_NOT_CONFIGURED", "This provider is not configured on the server yet.");
  const startedAt = Date.now();
  let output = "";
  let model = "";
  if (service === "openai") {
    model = env.OPENAI_MODEL ?? "gpt-4o-mini";
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: source }], temperature: 0.2 }),
    });
    if (!response.ok) throw new AppError(response.status === 429 ? 429 : 502, response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_ERROR", "The provider rejected the request.");
    const data = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    output = providerText(data.choices?.[0]?.message?.content);
  } else if (service === "anthropic") {
    model = env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 2_048, messages: [{ role: "user", content: source }] }),
    });
    if (!response.ok) throw new AppError(response.status === 429 ? 429 : 502, response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_ERROR", "The provider rejected the request.");
    const data = await response.json() as { content?: unknown };
    output = providerText(data.content);
  } else {
    model = env.GOOGLE_MODEL ?? "gemini-2.0-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_AI_API_KEY ?? "")}`;
    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: source }] }] }),
    });
    if (!response.ok) throw new AppError(response.status === 429 ? 429 : 502, response.status === 429 ? "PROVIDER_RATE_LIMITED" : "PROVIDER_ERROR", "The provider rejected the request.");
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: unknown } }> };
    output = providerText(data.candidates?.[0]?.content?.parts);
  }
  if (!output.trim()) throw new AppError(502, "PROVIDER_EMPTY_RESPONSE", "The provider returned no usable output.");
  return jsonResponse({ run: { serviceId: service, model, output, durationMs: Date.now() - startedAt, createdAt: now() } });
}

async function leaderboard(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT u.id AS user_id, CASE WHEN u.show_public_profile = 1 THEN u.full_name ELSE 'Community member' END AS full_name, CASE WHEN u.show_public_profile = 1 THEN u.avatar_url ELSE NULL END AS avatar_url, COALESCE(SUM(p.points), 0) AS total_points,
      (SELECT COUNT(*) FROM user_badges b WHERE b.user_id = u.id) AS badge_count,
      (SELECT COUNT(*) FROM prompts pr WHERE pr.user_id = u.id AND pr.is_public = 1) AS prompt_count
     FROM users u LEFT JOIN user_points p ON p.user_id = u.id
     GROUP BY u.id ORDER BY total_points DESC, u.created_at ASC LIMIT 100`,
  ).all<Record<string, unknown>>();
  return jsonResponse({ users: result.results.map((row) => ({ userId: row.user_id, fullName: row.full_name, avatarUrl: row.avatar_url, totalPoints: Number(row.total_points), badgeCount: Number(row.badge_count), promptCount: Number(row.prompt_count) })) });
}

async function adminHealth(env: Env, user: AuthUser): Promise<Response> {
  if (user.role !== "admin") throw new AppError(403, "FORBIDDEN", "Administrator access is required.");
  const checks: Record<string, unknown> = { database: false, rateLimit: Boolean(env.RATE_LIMIT), email: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM), providers: { openai: Boolean(env.OPENAI_API_KEY), anthropic: Boolean(env.ANTHROPIC_API_KEY), google: Boolean(env.GOOGLE_AI_API_KEY) } };
  try {
    await env.DB.prepare("SELECT 1 AS ok").first();
    checks.database = true;
  } catch {
    checks.database = false;
  }
  return jsonResponse({ status: checks.database ? "ok" : "degraded", checks, checkedAt: now() }, checks.database ? 200 : 503);
}

async function router(request: Request, env: Env, requestId: string): Promise<Response> {
  const url = new URL(request.url);
  const path = (url.pathname.replace(/^\/api(?=\/|$)/, "") || "/").replace(/\/$/, "") || "/";
  const method = request.method.toUpperCase();

  if (method === "GET" && path === "/health") {
    try {
      await env.DB.prepare("SELECT 1 AS ok").first();
      return jsonResponse({ status: "ok", service: "prompt-gineer-api", requestId, checkedAt: now() });
    } catch {
      return jsonResponse({ status: "degraded", service: "prompt-gineer-api", requestId }, 503);
    }
  }

  if (method === "GET" && path === "/leaderboard") return leaderboard(env);
  if (method === "POST" && path === "/auth/register") return register(env, request);
  if (method === "POST" && path === "/auth/login") return login(env, request);
  if (method === "POST" && path === "/auth/logout") return logout(env, request);
  if (method === "GET" && path === "/auth/verify") return verifyEmail(env, request);
  if (method === "POST" && path === "/auth/forgot-password") return requestPasswordReset(env, request);
  if (method === "POST" && path === "/auth/reset-password") return resetPassword(env, request);

  const currentUser = await optionalUser(env, request);

  if (method === "GET" && path === "/prompts") return listPrompts(env, request, currentUser);
  if (method === "POST" && path === "/prompts") return createPrompt(env, request, await requireUser(env, request));
  if (method === "GET" && path === "/me/prompts") return listPrompts(env, request, await requireUser(env, request), true);
  if (method === "GET" && path === "/me") return me(env, request, await requireUser(env, request));
  if (method === "PATCH" && path === "/me") return updateMe(env, request, await requireUser(env, request));
  if ((method === "GET" || method === "PATCH") && path === "/me/settings") return settings(env, request, await requireUser(env, request));
  if (method === "GET" && path === "/me/export") return exportData(env, await requireUser(env, request));
  if (method === "GET" && path === "/services") return serviceMetadata(env, await requireUser(env, request));
  if (method === "POST" && /^\/services\/(openai|anthropic|google)\/connect$/.test(path)) return connectService(env, request, await requireUser(env, request), serviceId(path.split("/")[2]), true);
  if (method === "DELETE" && /^\/services\/(openai|anthropic|google)\/connect$/.test(path)) return connectService(env, request, await requireUser(env, request), serviceId(path.split("/")[2]), false);
  if (method === "POST" && path === "/provider-runs") return runProvider(env, request, await requireUser(env, request));
  if (method === "GET" && path === "/admin/health") return adminHealth(env, await requireUser(env, request));

  const promptMatch = path.match(/^\/prompts\/([^/]+)$/);
  const commentMatch = path.match(/^\/prompts\/([^/]+)\/comments$/);
  const commentDeleteMatch = path.match(/^\/prompts\/([^/]+)\/comments\/([^/]+)$/);
  const likeMatch = path.match(/^\/prompts\/([^/]+)\/(?:like|likes)$/);
  if (commentDeleteMatch && method === "DELETE") return deleteComment(env, await requireUser(env, request), decodeURIComponent(commentDeleteMatch[1]), decodeURIComponent(commentDeleteMatch[2]));
  if (likeMatch && method === "POST") return toggleLike(env, request, await requireUser(env, request), decodeURIComponent(likeMatch[1]));
  if (commentMatch && method === "GET") return comments(env, request, currentUser, decodeURIComponent(commentMatch[1]));
  if (commentMatch && method === "POST") return addComment(env, request, await requireUser(env, request), decodeURIComponent(commentMatch[1]));
  if (promptMatch && method === "GET") return getPromptDetail(env, request, currentUser, decodeURIComponent(promptMatch[1]));
  if (promptMatch && method === "PATCH") return updatePrompt(env, request, await requireUser(env, request), decodeURIComponent(promptMatch[1]));
  if (promptMatch && method === "DELETE") return deletePrompt(env, await requireUser(env, request), decodeURIComponent(promptMatch[1]));

  throw new AppError(404, "NOT_FOUND", "The requested API route does not exist.");
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const timestamp = now();
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const oneHundredEightyDaysAgo = new Date(Date.now() - 180 * 86_400_000).toISOString();
    ctx.waitUntil(Promise.all([
      env.DB.prepare("DELETE FROM sessions WHERE expires_at < ? OR revoked_at < ?").bind(timestamp, thirtyDaysAgo).run(),
      env.DB.prepare("DELETE FROM password_reset_tokens WHERE expires_at < ? OR used_at < ?").bind(timestamp, twoDaysAgo).run(),
      env.DB.prepare("DELETE FROM email_verification_tokens WHERE expires_at < ? OR used_at < ?").bind(timestamp, twoDaysAgo).run(),
      env.DB.prepare("DELETE FROM audit_events WHERE created_at < ?").bind(oneHundredEightyDaysAgo).run(),
    ]));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = request.headers.get("X-Request-ID")?.slice(0, 100) || crypto.randomUUID();
    if (request.method === "OPTIONS") return optionsResponse(request, env, requestId);
    try {
      enforceRequestOrigin(request, env);
      const response = await router(request, env, requestId);
      console.log(JSON.stringify({ event: "request", requestId, method: request.method, path: new URL(request.url).pathname, status: response.status }));
      return withRequestHeaders(response, request, env, requestId);
    } catch (error) {
      const appError = error instanceof AppError ? error : null;
      console.error(JSON.stringify({ event: "request_error", requestId, method: request.method, path: new URL(request.url).pathname, code: appError?.code ?? "INTERNAL_ERROR", status: appError?.status ?? 500 }));
      return withRequestHeaders(errorResponse(error, requestId), request, env, requestId);
    }
  },
};
