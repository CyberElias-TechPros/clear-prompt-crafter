export type ApiUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  emailVerified: boolean;
  allowLearning: boolean;
  theme: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiSection = {
  id: string;
  prompt_id?: string;
  promptId?: string;
  section_type?: string;
  sectionType?: string;
  content: string;
  order_index?: number;
  orderIndex?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

export type ApiPrompt = {
  id: string;
  userId: string | null;
  title: string;
  description: string;
  mode: "structured" | "conversational" | "meta";
  category: string;
  tags: string[];
  content: string;
  isPublic: boolean;
  likes: number;
  views: number;
  likedByMe?: boolean;
  author: { id: string | null; name: string; initials: string; avatarUrl: string | null } | null;
  sections?: ApiSection[];
  createdAt: string;
  updatedAt: string;
};

export type ApiErrorShape = { code: string; message: string; details?: unknown };

export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, requestId?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
/** A missing value intentionally means local demo mode; it is not an implicit production fallback. */
export const isApiConfigured = Boolean(configuredBaseUrl && !/(^your-|https?:\/\/your-|\.example(?:\.|\/|:|$)|example\.workers\.dev)/i.test(configuredBaseUrl));
const baseUrl = (configuredBaseUrl || "/api").replace(/\/$/, "");

function joinPath(path: string): string {
  return `${baseUrl}/${path.replace(/^\//, "")}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(joinPath(path), { ...init, headers, credentials: "include" });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload ? (payload as { error?: ApiErrorShape }).error : undefined;
    const requestId = response.headers.get("X-Request-ID") ?? (payload && typeof payload === "object" && "requestId" in payload ? String((payload as { requestId?: unknown }).requestId ?? "") : undefined);
    throw new ApiError(error?.message || `Request failed with status ${response.status}.`, response.status, error?.code || "HTTP_ERROR", requestId, error?.details);
  }
  return payload as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}

export type PromptListResponse = { prompts: ApiPrompt[]; nextCursor: string | null; hasMore: boolean };
export type MeResponse = {
  user: ApiUser;
  settings: { userId: string; allowLearning: boolean; emailDigest: boolean; showPublicProfile: boolean; reducedMotion: boolean; theme: string; isPremium: boolean; updatedAt: string };
  stats: { prompts: number; publicPrompts: number; points: number };
  services: Array<{ id: string; serviceName: string; isActive: boolean; createdAt: string; updatedAt: string }>;
};

export function toDemoCompatibleUser(user: ApiUser) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: { full_name: user.fullName, avatar_url: user.avatarUrl ?? "" },
    app_metadata: { role: user.role },
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export function apiPromptToRecord(prompt: ApiPrompt) {
  const sections = { role: "", objective: "", context: "", guidelines: "", constraints: "", output: "" };
  for (const section of prompt.sections ?? []) {
    const type = section.sectionType ?? section.section_type;
    if (type === "role" || type === "objective" || type === "context" || type === "guidelines" || type === "constraints" || type === "output") {
      sections[type] = section.content || "";
    }
  }
  return {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description,
    mode: prompt.mode,
    sections,
    content: prompt.content,
    category: prompt.category,
    tags: prompt.tags,
    author: prompt.author?.name ?? "Prompt user",
    authorInitials: prompt.author?.initials ?? "PU",
    isPublic: prompt.isPublic,
    likes: prompt.likes,
    views: prompt.views,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  };
}
