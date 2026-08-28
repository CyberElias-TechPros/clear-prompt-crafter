// AES-GCM encryption for user-supplied (BYOK) API keys stored in D1.

import { Env, HttpError, fromB64, toB64 } from "./util";

async function deriveKey(env: Env): Promise<CryptoKey> {
  const secret =
    env.KEY_ENCRYPTION_SECRET ||
    (env.NVIDIA_API_KEY ? `pg-fallback::${env.NVIDIA_API_KEY}` : "");
  if (!secret) {
    throw new HttpError(500, "KEY_ENCRYPTION_SECRET is not configured on the backend");
  }
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptSecret(env: Env, plaintext: string): Promise<string> {
  const key = await deriveKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `${toB64(iv)}.${toB64(ct)}`;
}

export async function decryptSecret(env: Env, payload: string): Promise<string> {
  const [ivB64, ctB64] = payload.split(".");
  if (!ivB64 || !ctB64) throw new HttpError(500, "Stored key is malformed");
  const key = await deriveKey(env);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) },
    key,
    fromB64(ctB64),
  );
  return new TextDecoder().decode(pt);
}
