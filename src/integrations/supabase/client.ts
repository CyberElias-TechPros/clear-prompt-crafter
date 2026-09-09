import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * The browser only receives the public Supabase key. Server-side provider keys
 * must never be placed in VITE_* variables; they belong in a Worker/Edge
 * Function secret and are accessed only after authorization.
 */
const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);
const SUPABASE_URL = configuredUrl || "https://placeholder.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = configuredKey || "public-anon-key";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
