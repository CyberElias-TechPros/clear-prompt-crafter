// Typed convenience wrappers around the Prompt-Gineer backend API.

import {
  Ad,
  AIServicesResponse,
  ApiUser,
  CommentItem,
  CommunityItem,
  GenerateRequest,
  GenerateResponse,
  ItemDetail,
  LeaderboardUser,
  api,
} from "./api";

// --- Auth -------------------------------------------------------------------

export const authApi = {
  signUp: (email: string, password: string, fullName?: string) =>
    api.post<{ token: string; user: ApiUser }>("/api/auth/signup", {
      email,
      password,
      full_name: fullName,
    }, { auth: false }),
  signIn: (email: string, password: string) =>
    api.post<{ token: string; user: ApiUser }>("/api/auth/login", { email, password }, { auth: false }),
  signOut: () => api.post<{ success: boolean }>("/api/auth/logout"),
  me: () => api.get<{ user: ApiUser }>("/api/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ token: string; success: boolean }>("/api/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  deleteAccount: () => api.del<{ success: boolean }>("/api/auth/account"),
  updateMe: (patch: Partial<Pick<ApiUser, "full_name" | "avatar_url" | "theme">> & { allow_learning?: boolean }) =>
    api.patch<{ user: ApiUser }>("/api/me", patch),
  exportData: () => api.get<Record<string, unknown>>("/api/me/data"),
};

// --- Community items (prompts & templates) ----------------------------------

export type ItemKind = "prompts" | "templates";

export const itemApi = {
  list: (kind: ItemKind, opts: { sort?: "recent" | "popular"; q?: string } = {}) =>
    api.get<{ items: CommunityItem[] }>(`/api/${kind}`, { auth: false, query: { sort: opts.sort, q: opts.q } }),
  mine: (kind: ItemKind) => api.get<{ items: any[] }>(`/api/${kind}/mine`),
  get: (kind: ItemKind, id: string) => api.get<ItemDetail>(`/api/${kind}/${id}`, { auth: false }),
  create: (kind: ItemKind, payload: {
    title: string;
    description?: string;
    is_public: boolean;
    sections: { section_type: string; content: string }[];
  }) => api.post<{ id: string }>(`/api/${kind}`, payload),
  update: (kind: ItemKind, id: string, payload: Record<string, unknown>) =>
    api.patch<{ success: boolean }>(`/api/${kind}/${id}`, payload),
  remove: (kind: ItemKind, id: string) => api.del<{ success: boolean }>(`/api/${kind}/${id}`),
  toggleLike: (kind: ItemKind, id: string) =>
    api.post<{ liked: boolean; likes: number }>(`/api/${kind}/${id}/like`),
  comments: (kind: ItemKind, id: string) =>
    api.get<{ items: CommentItem[] }>(`/api/${kind}/${id}/comments`, { auth: false }),
  addComment: (kind: ItemKind, id: string, content: string) =>
    api.post<CommentItem>(`/api/${kind}/${id}/comments`, { content }),
};

// --- Leaderboard --------------------------------------------------------------

export const leaderboardApi = {
  get: () => api.get<{ items: LeaderboardUser[] }>("/api/leaderboard", { auth: false }),
};

// --- Ads ----------------------------------------------------------------------

export const adsApi = {
  list: (size?: string, position?: string) =>
    api.get<{ items: Ad[] }>("/api/ads", { auth: false, query: { size, position } }),
  adminList: () => api.get<{ items: Ad[] }>("/api/admin/ads"),
  create: (ad: Omit<Ad, "id" | "created_at">) => api.post<{ id: string }>("/api/admin/ads", ad),
  update: (id: string, patch: Partial<Ad>) => api.patch<{ success: boolean }>(`/api/admin/ads/${id}`, patch),
  remove: (id: string) => api.del<{ success: boolean }>(`/api/admin/ads/${id}`),
};

// --- AI -------------------------------------------------------------------------

export const aiApi = {
  services: () => api.get<AIServicesResponse>("/api/ai/services"),
  models: () => api.get<{ default_service: string; platform_available: boolean; models: string[] }>("/api/ai/models"),
  connect: (serviceName: string, apiKey: string, extra?: { base_url?: string; model?: string }) =>
    api.post<{ success: boolean }>("/api/ai/services", { service_name: serviceName, api_key: apiKey, ...extra }),
  setActive: (serviceName: string, isActive: boolean) =>
    api.patch<{ success: boolean }>(`/api/ai/services/${serviceName}`, { is_active: isActive }),
  disconnect: (serviceName: string) => api.del<{ success: boolean }>(`/api/ai/services/${serviceName}`),
  test: (serviceName: string) => api.post<{ ok: boolean; model: string }>(`/api/ai/services/${serviceName}/test`),
  generate: (payload: GenerateRequest) => api.post<GenerateResponse>("/api/ai/generate", payload),
};

// --- Contact ---------------------------------------------------------------------

export const contactApi = {
  send: (payload: { name: string; email: string; subject: string; message: string }) =>
    api.post<{ success: boolean }>("/api/contact", payload, { auth: false }),
};
