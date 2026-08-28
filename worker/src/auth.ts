// Password hashing (PBKDF2 via WebCrypto) and bearer-token sessions.

import { Env, HttpError, fromB64, nowIso, sha256Hex, timingSafeEqual, toB64, uuid } from "./util";

const PBKDF2_ITERATIONS = 150_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_REFRESH_MS = 15 * 24 * 60 * 60 * 1000; // extend once under 15 days left

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_premium: number;
  allow_learning: number;
  theme: string;
  created_at: string;
  updated_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const iterations = parseInt(iterStr, 10);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: fromB64(saltB64), iterations },
      keyMaterial,
      256,
    );
    return timingSafeEqual(toB64(bits), hashB64);
  } catch {
    return false;
  }
}

export async function createSession(db: D1Database, userId: string): Promise<string> {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toB64(tokenBytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const tokenHash = await sha256Hex(token);
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, nowIso(), new Date(Date.now() + SESSION_TTL_MS).toISOString())
    .run();
  return token;
}

export function deleteSession(db: D1Database, token: string) {
  return sha256Hex(token).then((h) => db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(h).run());
}

/** Resolves the bearer token to a user row, or throws 401. */
export async function requireUser(req: Request, env: Env): Promise<UserRow> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Authentication required");

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT u.*, s.expires_at AS session_expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`,
  )
    .bind(tokenHash)
    .first<UserRow & { session_expires_at: string }>();

  if (!row) throw new HttpError(401, "Session not found. Please sign in again.");
  if (row.session_expires_at <= nowIso()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
    throw new HttpError(401, "Session expired. Please sign in again.");
  }

  // Sliding refresh: extend when less than half the TTL remains.
  if (new Date(row.session_expires_at).getTime() - Date.now() < SESSION_REFRESH_MS) {
    await env.DB.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?")
      .bind(new Date(Date.now() + SESSION_TTL_MS).toISOString(), tokenHash)
      .run();
  }

  return row;
}

/** Returns the user if a valid token is present, otherwise null (optional auth). */
export async function optionalUser(req: Request, env: Env): Promise<UserRow | null> {
  try {
    return await requireUser(req, env);
  } catch {
    return null;
  }
}

export function requireAdmin(user: UserRow): void {
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
}

export { uuid };
