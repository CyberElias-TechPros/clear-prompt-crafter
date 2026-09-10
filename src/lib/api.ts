// Frontend API client for the Prompt-Gineer Cloudflare Worker backend.
//
// The base URL is configured via VITE_API_URL:
//   - Leave it UNSET (default) to use same-origin/relative "/api/..." paths.
//     In local dev the Vite server proxies /api to the worker on :8787, and in
//     production you can put the app and API behind the same domain or set
//     VITE_API_URL to your Worker URL.
//   - Set VITE_API_URL to e.g. https://prompt-gineer-api.<you>.workers.dev to
//     call the Worker on its own origin directly.

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
export const API_BASE = RAW_BASE.replace(/\/+$/, "");

const TOKEN_KEY = "pg_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // default true
  query?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, query } = opts;

  const url = new URL(API_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && String(v) !== "") url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the API. Check that the backend is running and VITE_API_URL is set.");
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // A 401 means the stored token is stale — clear it so the UI can recover.
    if (res.status === 401) setToken(null);
    const message = data?.error || `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Shared domain types
// ---------------------------------------------------------------------------

export interface ApiUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  is_premium: boolean;
  allow_learning: boolean;
  theme: "light" | "dark" | "system";
  created_at: string;
}

export interface Section {
  id?: string;
  section_type: string;
  content: string;
  order_index?: number;
}

export interface CommunityItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  like_count: number;
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  is_public: number | boolean;
  likes: number;
  views: number;
  liked_by_me: boolean;
  sections: Section[];
}

export interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar?: string | null;
}

export interface Ad {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string;
  ad_size: "small" | "medium" | "large";
  ad_position: "top" | "side" | "inline" | "bottom";
  is_active: boolean;
  created_at: string;
}

export interface LeaderboardUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  badge_count: number;
}

export interface AIServiceRow {
  service_name: string;
  is_active: boolean;
  base_url: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIProviderInfo {
  id: string;
  label: string;
  default_model: string;
  docs_url: string;
}

export interface AIServicesResponse {
  providers: AIProviderInfo[];
  services: AIServiceRow[];
  platform: {
    service_name: string;
    available: boolean;
    models: string[];
    daily_limit: number | null;
    used_today: number;
    remaining_today: number | null;
  };
}

export interface GenerateRequest {
  prompt?: string;
  messages?: { role: "system" | "user" | "assistant"; content: string }[];
  service?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface GenerateResponse {
  content: string;
  model: string;
  service: string;
}
