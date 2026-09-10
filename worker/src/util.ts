// Shared helpers for the Prompt-Gineer worker.

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  ADMIN_EMAILS?: string;
  FREE_DAILY_LIMIT?: string;
  NVIDIA_MODELS?: string;
  NVIDIA_BASE_URL?: string;
  NVIDIA_API_KEY?: string;
  KEY_ENCRYPTION_SECRET?: string;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });

export const nowIso = () => new Date().toISOString();

export const uuid = () => crypto.randomUUID();

export function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of u8) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  // crypto.subtle.timingSafeEqual is available in the Workers runtime.
  return (crypto.subtle as any).timingSafeEqual(enc.encode(a), enc.encode(b));
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Public (never sensitive) representation of a user row. */
export function publicUser(row: Record<string, any>) {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name ?? null,
    avatar_url: row.avatar_url ?? null,
    role: row.role ?? "user",
    is_premium: !!row.is_premium,
    allow_learning: !!row.allow_learning,
    theme: row.theme ?? "light",
    created_at: row.created_at,
  };
}
