// All HTTP route handlers for the Prompt-Gineer API.

import {
  Env,
  HttpError,
  clampInt,
  isNonEmptyString,
  json,
  nowIso,
  publicUser,
  uuid,
} from "./util";
import {
  UserRow,
  createSession,
  deleteSession,
  hashPassword,
  optionalUser,
  requireAdmin,
  requireUser,
  verifyPassword,
} from "./auth";
import { decryptSecret, encryptSecret } from "./crypto";
import {
  AiCallError,
  ChatMessage,
  PROVIDERS,
  PROVIDER_LIST,
  SYSTEM_PROMPT,
  generateChat,
  generateWithPlatformKey,
} from "./ai";
import { awardPoints, ensureBadge, recordHistory } from "./gamification";

export interface Ctx {
  env: Env;
  req: Request;
  params: Record<string, string>;
  query: URLSearchParams;
  body: any;
}

type Handler = (ctx: Ctx) => Promise<Response>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function adminEmails(env: Env): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const signup: Handler = async ({ env, body }) => {
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const fullName = typeof body?.full_name === "string" ? body.full_name.trim().slice(0, 120) : null;

  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please provide a valid email address");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const id = uuid();
  const role = adminEmails(env).includes(email) ? "admin" : "user";
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, email, await hashPassword(password), fullName || null, role, now, now)
    .run();

  await env.DB.prepare(
    `INSERT INTO user_history (id, user_id, action_type, data, created_at) VALUES (?, ?, 'signup', NULL, ?)`,
  )
    .bind(uuid(), id, now)
    .run();

  const token = await createSession(env.DB, id);
  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<Record<string, any>>();
  return json({ token, user: publicUser(user!) }, 201);
};

export const login: Handler = async ({ env, body }) => {
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) throw new HttpError(400, "Email and password are required");

  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  const token = await createSession(env.DB, user.id);
  return json({ token, user: publicUser(user as any) });
};

export const logout: Handler = async ({ env, req }) => {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token) await deleteSession(env.DB, token);
  return json({ success: true });
};

export const me: Handler = async ({ env, req }) => {
  const user = await requireUser(req, env);
  return json({ user: publicUser(user as any) });
};

export const patchMe: Handler = async ({ env, req, body }) => {
  const user = await requireUser(req, env);
  const updates: string[] = [];
  const values: any[] = [];

  if (typeof body?.full_name === "string") {
    updates.push("full_name = ?");
    values.push(body.full_name.trim().slice(0, 120) || null);
  }
  if (typeof body?.avatar_url === "string") {
    const url = body.avatar_url.trim();
    if (url && !/^https:\/\/.+/i.test(url)) throw new HttpError(400, "avatar_url must be an https:// URL");
    updates.push("avatar_url = ?");
    values.push(url.slice(0, 2048) || null);
  }
  if (typeof body?.theme === "string") {
    if (!["light", "dark", "system"].includes(body.theme)) throw new HttpError(400, "Invalid theme");
    updates.push("theme = ?");
    values.push(body.theme);
  }
  if (typeof body?.allow_learning === "boolean") {
    updates.push("allow_learning = ?");
    values.push(body.allow_learning ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    values.push(nowIso(), user.id);
    await env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  }
  const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first<Record<string, any>>();
  return json({ user: publicUser(fresh!) });
};

export const changePassword: Handler = async ({ env, req, body }) => {
  const user = await requireUser(req, env);
  const current = String(body?.current_password ?? "");
  const next = String(body?.new_password ?? "");
  if (next.length < 6) throw new HttpError(400, "New password must be at least 6 characters");
  if (!(await verifyPassword(current, user.password_hash))) {
    throw new HttpError(401, "Current password is incorrect");
  }
  await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .bind(await hashPassword(next), nowIso(), user.id)
    .run();
  // Invalidate every session and start a fresh one.
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();
  const token = await createSession(env.DB, user.id);
  return json({ token, success: true });
};

export const deleteAccount: Handler = async ({ env, req }) => {
  const user = await requireUser(req, env);
  // Explicitly remove dependent rows (defense in depth on top of FK cascades).
  const stmts = [
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM prompt_sections WHERE prompt_id IN (SELECT id FROM prompts WHERE user_id = ?)").bind(user.id),
    env.DB.prepare("DELETE FROM template_sections WHERE template_id IN (SELECT id FROM prompt_templates WHERE user_id = ?)").bind(user.id),
    env.DB.prepare("DELETE FROM comments WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM likes WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM prompts WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM prompt_templates WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM user_points WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM user_badges WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM user_ai_services WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM user_history WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM usage_counters WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ];
  await env.DB.batch(stmts);
  return json({ success: true });
};

export const exportMyData: Handler = async ({ env, req }) => {
  const user = await requireUser(req, env);
  const [prompts, templates, comments, likes, points, badges, services, history] = await Promise.all([
    env.DB.prepare("SELECT * FROM prompts WHERE user_id = ?").bind(user.id).all(),
    env.DB.prepare("SELECT * FROM prompt_templates WHERE user_id = ?").bind(user.id).all(),
    env.DB.prepare("SELECT * FROM comments WHERE user_id = ?").bind(user.id).all(),
    env.DB.prepare("SELECT * FROM likes WHERE user_id = ?").bind(user.id).all(),
    env.DB.prepare("SELECT * FROM user_points WHERE user_id = ?").bind(user.id).all(),
    env.DB.prepare("SELECT * FROM user_badges WHERE user_id = ?").bind(user.id).all(),
    env.DB.prepare("SELECT service_name, is_active, base_url, model, created_at FROM user_ai_services WHERE user_id = ?").bind(user.id).all(),
    env.DB.prepare("SELECT * FROM user_history WHERE user_id = ?").bind(user.id).all(),
  ]);
  return json({
    exported_at: nowIso(),
    profile: publicUser(user as any),
    prompts: prompts.results,
    templates: templates.results,
    comments: comments.results,
    likes: likes.results,
    points: points.results,
    badges: badges.results,
    ai_services: services.results,
    history: history.results,
  });
};

// ---------------------------------------------------------------------------
// Prompts & templates (shared implementation)
// ---------------------------------------------------------------------------

interface KindConfig {
  kind: "prompt" | "template";
  table: string;
  sectionsTable: string;
  sectionFk: string;
  createPointsReason: string;
  firstBadge: string;
}

const PROMPT_KIND: KindConfig = {
  kind: "prompt",
  table: "prompts",
  sectionsTable: "prompt_sections",
  sectionFk: "prompt_id",
  createPointsReason: "Created a prompt",
  firstBadge: "first_prompt",
};

const TEMPLATE_KIND: KindConfig = {
  kind: "template",
  table: "prompt_templates",
  sectionsTable: "template_sections",
  sectionFk: "template_id",
  createPointsReason: "Created a template",
  firstBadge: "first_template",
};

export function listPublic(kind: KindConfig): Handler {
  return async ({ env, query }) => {
    const sort = query.get("sort") === "popular" ? "popular" : "recent";
    const q = (query.get("q") ?? "").trim();
    const limit = clampInt(query.get("limit"), 1, 60, 24);
    const offset = clampInt(query.get("offset"), 0, 10_000, 0);

    const where = [`t.is_public = 1`];
    const args: any[] = [];
    if (q) {
      where.push("(t.title LIKE ? OR t.description LIKE ?)");
      args.push(`%${q}%`, `%${q}%`);
    }
    const orderBy = sort === "popular" ? "t.likes DESC, t.created_at DESC" : "t.created_at DESC";

    const { results } = await env.DB.prepare(
      `SELECT t.id, t.title, t.description, t.created_at, t.updated_at, t.user_id,
              u.full_name AS user_name, u.avatar_url AS user_avatar, t.likes AS like_count
         FROM ${kind.table} t
         LEFT JOIN users u ON u.id = t.user_id
        WHERE ${where.join(" AND ")}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?`,
    )
      .bind(...args, limit, offset)
      .all();
    return json({ items: results });
  };
}

export function getOne(kind: KindConfig): Handler {
  return async ({ env, req, params }) => {
    const id = params.id;
    const user = await optionalUser(req, env);
    const row = await env.DB.prepare(
      `SELECT t.*, u.full_name AS user_name, u.avatar_url AS user_avatar
         FROM ${kind.table} t LEFT JOIN users u ON u.id = t.user_id
        WHERE t.id = ?`,
    )
      .bind(id)
      .first<any>();
    if (!row) throw new HttpError(404, `${kind.kind === "prompt" ? "Prompt" : "Template"} not found`);
    if (!row.is_public && (!user || user.id !== row.user_id)) {
      throw new HttpError(404, `${kind.kind === "prompt" ? "Prompt" : "Template"} not found`);
    }

    const { results: sections } = await env.DB.prepare(
      `SELECT id, section_type, content, order_index FROM ${kind.sectionsTable}
        WHERE ${kind.sectionFk} = ? ORDER BY order_index ASC`,
    )
      .bind(id)
      .all();

    let likedByMe = false;
    if (user) {
      const like = await env.DB.prepare(
        `SELECT id FROM likes WHERE user_id = ? AND ${kind.kind === "prompt" ? "prompt_id" : "template_id"} = ?`,
      )
        .bind(user.id, id)
        .first();
      likedByMe = !!like;
    }

    await env.DB.prepare(`UPDATE ${kind.table} SET views = views + 1 WHERE id = ?`).bind(id).run();

    return json({
      ...row,
      views: (row.views ?? 0) + 1,
      sections,
      liked_by_me: likedByMe,
    });
  };
}

function validateSections(input: unknown): { section_type: string; content: string }[] {
  if (!Array.isArray(input)) throw new HttpError(400, "sections must be an array");
  if (input.length > 40) throw new HttpError(400, "Too many sections (max 40)");
  return input.map((s: any) => {
    const type = String(s?.section_type ?? s?.type ?? "").trim().slice(0, 40);
    const content = String(s?.content ?? "");
    if (!type) throw new HttpError(400, "Each section needs a section_type");
    if (content.length > 20_000) throw new HttpError(400, "Section content is too long (max 20,000 chars)");
    return { section_type: type, content };
  });
}

export function create(kind: KindConfig): Handler {
  return async ({ env, req, body }) => {
    const user = await requireUser(req, env);
    const title = String(body?.title ?? "").trim();
    if (title.length < 3 || title.length > 200) throw new HttpError(400, "Title must be 3-200 characters");
    const description = typeof body?.description === "string" ? body.description.trim().slice(0, 2000) : null;
    const isPublic = body?.is_public ? 1 : kind.kind === "template" ? 1 : 0;
    const sections = validateSections(body?.sections);
    if (sections.length === 0) throw new HttpError(400, "At least one section is required");

    const id = uuid();
    const now = nowIso();
    const stmts: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO ${kind.table} (id, user_id, title, description, is_public, likes, views, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      ).bind(id, user.id, title, description, isPublic, now, now),
      ...sections.map((s, i) =>
        env.DB.prepare(
          `INSERT INTO ${kind.sectionsTable} (id, ${kind.sectionFk}, section_type, content, order_index)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(uuid(), id, s.section_type, s.content, i),
      ),
    ];
    await env.DB.batch(stmts);

    await awardPoints(env.DB, user.id, 10, kind.createPointsReason);
    await ensureBadge(env.DB, user.id, kind.firstBadge);
    await recordHistory(env.DB, user.id, `create_${kind.kind}`, { id, title });

    return json({ id }, 201);
  };
}

export function patchOne(kind: KindConfig): Handler {
  return async ({ env, req, params, body }) => {
    const user = await requireUser(req, env);
    const existing = await env.DB.prepare(`SELECT * FROM ${kind.table} WHERE id = ?`).bind(params.id).first<any>();
    if (!existing) throw new HttpError(404, "Not found");
    if (existing.user_id !== user.id) throw new HttpError(403, "You can only edit your own items");

    const updates: string[] = [];
    const values: any[] = [];
    if (typeof body?.title === "string") {
      const t = body.title.trim();
      if (t.length < 3 || t.length > 200) throw new HttpError(400, "Title must be 3-200 characters");
      updates.push("title = ?");
      values.push(t);
    }
    if (typeof body?.description === "string") {
      updates.push("description = ?");
      values.push(body.description.trim().slice(0, 2000) || null);
    }
    if (typeof body?.is_public === "boolean") {
      updates.push("is_public = ?");
      values.push(body.is_public ? 1 : 0);
    }
    if (updates.length > 0) {
      updates.push("updated_at = ?");
      values.push(nowIso(), params.id);
      await env.DB.prepare(`UPDATE ${kind.table} SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    }

    if (body?.sections !== undefined) {
      const sections = validateSections(body.sections);
      await env.DB.prepare(`DELETE FROM ${kind.sectionsTable} WHERE ${kind.sectionFk} = ?`).bind(params.id).run();
      if (sections.length > 0) {
        await env.DB.batch(
          sections.map((s, i) =>
            env.DB.prepare(
              `INSERT INTO ${kind.sectionsTable} (id, ${kind.sectionFk}, section_type, content, order_index)
               VALUES (?, ?, ?, ?, ?)`,
            ).bind(uuid(), params.id, s.section_type, s.content, i),
          ),
        );
      }
    }
    return json({ success: true });
  };
}

export function deleteOne(kind: KindConfig): Handler {
  return async ({ env, req, params }) => {
    const user = await requireUser(req, env);
    const existing = await env.DB.prepare(`SELECT * FROM ${kind.table} WHERE id = ?`).bind(params.id).first<any>();
    if (!existing) throw new HttpError(404, "Not found");
    if (existing.user_id !== user.id) throw new HttpError(403, "You can only delete your own items");
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM ${kind.sectionsTable} WHERE ${kind.sectionFk} = ?`).bind(params.id),
      env.DB.prepare(`DELETE FROM comments WHERE ${kind.kind === "prompt" ? "prompt_id" : "template_id"} = ?`).bind(params.id),
      env.DB.prepare(`DELETE FROM likes WHERE ${kind.kind === "prompt" ? "prompt_id" : "template_id"} = ?`).bind(params.id),
      env.DB.prepare(`DELETE FROM ${kind.table} WHERE id = ?`).bind(params.id),
    ]);
    return json({ success: true });
  };
}

export function listMine(kind: KindConfig): Handler {
  return async ({ env, req }) => {
    const user = await requireUser(req, env);
    const { results } = await env.DB.prepare(
      `SELECT id, title, description, is_public, likes, views, created_at, updated_at
         FROM ${kind.table} WHERE user_id = ? ORDER BY created_at DESC`,
    )
      .bind(user.id)
      .all();
    return json({ items: results });
  };
}

export function toggleLike(kind: KindConfig): Handler {
  return async ({ env, req, params }) => {
    const user = await requireUser(req, env);
    const fk = kind.kind === "prompt" ? "prompt_id" : "template_id";
    const target = await env.DB.prepare(`SELECT id, user_id, likes FROM ${kind.table} WHERE id = ?`)
      .bind(params.id)
      .first<any>();
    if (!target) throw new HttpError(404, "Not found");

    const existing = await env.DB.prepare(`SELECT id FROM likes WHERE user_id = ? AND ${fk} = ?`)
      .bind(user.id, params.id)
      .first<{ id: string }>();

    let liked: boolean;
    if (existing) {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM likes WHERE id = ?").bind(existing.id),
        env.DB.prepare(`UPDATE ${kind.table} SET likes = MAX(likes - 1, 0) WHERE id = ?`).bind(params.id),
      ]);
      liked = false;
    } else {
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO likes (id, user_id, ${fk}, created_at) VALUES (?, ?, ?, ?)`)
          .bind(uuid(), user.id, params.id, nowIso()),
        env.DB.prepare(`UPDATE ${kind.table} SET likes = likes + 1 WHERE id = ?`).bind(params.id),
      ]);
      liked = true;
      if (target.user_id && target.user_id !== user.id) {
        await awardPoints(env.DB, target.user_id, 2, "Received a like");
      }
    }
    const updated = await env.DB.prepare(`SELECT likes FROM ${kind.table} WHERE id = ?`).bind(params.id).first<any>();
    return json({ liked, likes: updated?.likes ?? 0 });
  };
}

export function listComments(kind: KindConfig): Handler {
  return async ({ env, params }) => {
    const fk = kind.kind === "prompt" ? "prompt_id" : "template_id";
    const { results } = await env.DB.prepare(
      `SELECT c.id, c.content, c.created_at, c.user_id, u.full_name AS user_name, u.avatar_url AS user_avatar
         FROM comments c LEFT JOIN users u ON u.id = c.user_id
        WHERE c.${fk} = ?
        ORDER BY c.created_at ASC`,
    )
      .bind(params.id)
      .all();
    return json({ items: results });
  };
}

export function addComment(kind: KindConfig): Handler {
  return async ({ env, req, params, body }) => {
    const user = await requireUser(req, env);
    const fk = kind.kind === "prompt" ? "prompt_id" : "template_id";
    const target = await env.DB.prepare(`SELECT id FROM ${kind.table} WHERE id = ?`).bind(params.id).first();
    if (!target) throw new HttpError(404, "Not found");

    const content = String(body?.content ?? "").trim();
    if (!content) throw new HttpError(400, "Comment cannot be empty");
    if (content.length > 2000) throw new HttpError(400, "Comment is too long (max 2,000 chars)");

    const id = uuid();
    const now = nowIso();
    await env.DB.prepare(
      `INSERT INTO comments (id, user_id, ${fk}, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, user.id, params.id, content, now, now)
      .run();
    await awardPoints(env.DB, user.id, 2, "Posted a comment");
    await ensureBadge(env.DB, user.id, "first_comment");

    return json({ id, content, created_at: now, user_id: user.id, user_name: user.full_name }, 201);
  };
}

export const PROMPTS = PROMPT_KIND;
export const TEMPLATES = TEMPLATE_KIND;

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export const leaderboard: Handler = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT u.id AS user_id,
            COALESCE(u.full_name, u.email) AS full_name,
            u.avatar_url,
            COALESCE(SUM(p.points), 0) AS total_points,
            (SELECT COUNT(*) FROM user_badges b WHERE b.user_id = u.id) AS badge_count
       FROM users u
       LEFT JOIN user_points p ON p.user_id = u.id
      GROUP BY u.id
     HAVING total_points > 0 OR badge_count > 0
      ORDER BY total_points DESC, badge_count DESC
      LIMIT 100`,
  ).all();
  return json({ items: results });
};

// ---------------------------------------------------------------------------
// Ads
// ---------------------------------------------------------------------------

export const listAds: Handler = async ({ env, query }) => {
  const size = query.get("size");
  const position = query.get("position");
  const stmt = env.DB.prepare(
    `SELECT * FROM ads WHERE is_active = 1
      ${size ? "AND ad_size = ?" : ""} ${position ? "AND ad_position = ?" : ""} LIMIT 10`,
  );
  const args: any[] = [];
  if (size) args.push(size);
  if (position) args.push(position);
  const { results } = await (args.length ? stmt.bind(...args) : stmt).all();
  return json({
    items: results.map((a: any) => ({ ...a, is_active: !!a.is_active })),
  });
};

export const adminListAds: Handler = async ({ env, req }) => {
  requireAdmin(await requireUser(req, env));
  const { results } = await env.DB.prepare("SELECT * FROM ads ORDER BY created_at DESC").all();
  return json({ items: results.map((a: any) => ({ ...a, is_active: !!a.is_active })) });
};

export const adminCreateAd: Handler = async ({ env, req, body }) => {
  requireAdmin(await requireUser(req, env));
  const title = String(body?.title ?? "").trim();
  const content = String(body?.content ?? "").trim();
  const linkUrl = String(body?.link_url ?? "").trim();
  const adSize = String(body?.ad_size ?? "");
  const adPosition = String(body?.ad_position ?? "");
  if (!title || !content || !linkUrl) throw new HttpError(400, "title, content and link_url are required");
  if (!["small", "medium", "large"].includes(adSize)) throw new HttpError(400, "Invalid ad_size");
  if (!["top", "side", "inline", "bottom"].includes(adPosition)) throw new HttpError(400, "Invalid ad_position");
  const imageUrl = typeof body?.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;

  const id = uuid();
  await env.DB.prepare(
    `INSERT INTO ads (id, title, content, image_url, link_url, ad_size, ad_position, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, title, content, imageUrl, linkUrl, adSize, adPosition, body?.is_active === false ? 0 : 1, nowIso())
    .run();
  return json({ id }, 201);
};

export const adminPatchAd: Handler = async ({ env, req, params, body }) => {
  requireAdmin(await requireUser(req, env));
  const updates: string[] = [];
  const values: any[] = [];
  for (const field of ["title", "content", "image_url", "link_url", "ad_size", "ad_position"] as const) {
    if (typeof body?.[field] === "string") {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }
  if (typeof body?.is_active === "boolean") {
    updates.push("is_active = ?");
    values.push(body.is_active ? 1 : 0);
  }
  if (updates.length === 0) throw new HttpError(400, "Nothing to update");
  values.push(params.id);
  const res = await env.DB.prepare(`UPDATE ads SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  if (res.meta.changes === 0) throw new HttpError(404, "Ad not found");
  return json({ success: true });
};

export const adminDeleteAd: Handler = async ({ env, req, params }) => {
  requireAdmin(await requireUser(req, env));
  const res = await env.DB.prepare("DELETE FROM ads WHERE id = ?").bind(params.id).run();
  if (res.meta.changes === 0) throw new HttpError(404, "Ad not found");
  return json({ success: true });
};

// ---------------------------------------------------------------------------
// AI services (BYOK) + generation
// ---------------------------------------------------------------------------

const platformConfig = (env: Env) => ({
  apiKey: env.NVIDIA_API_KEY ?? "",
  baseUrl: env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
  models: (env.NVIDIA_MODELS ?? "meta/llama-3.1-8b-instruct").split(",").map((s) => s.trim()).filter(Boolean),
});

const today = () => new Date().toISOString().slice(0, 10);

async function platformQuota(env: Env, userId: string, isPremium: boolean) {
  const limit = clampInt(env.FREE_DAILY_LIMIT, 0, 10_000, 5);
  if (isPremium || limit === 0) return { limit, used: 0, remaining: Infinity as number };
  const row = await env.DB.prepare("SELECT generations FROM usage_counters WHERE user_id = ? AND day = ?")
    .bind(userId, today())
    .first<{ generations: number }>();
  const used = row?.generations ?? 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}

async function bumpQuota(env: Env, userId: string) {
  await env.DB.prepare(
    `INSERT INTO usage_counters (user_id, day, generations) VALUES (?, ?, 1)
     ON CONFLICT(user_id, day) DO UPDATE SET generations = generations + 1`,
  )
    .bind(userId, today())
    .run();
}

export const aiModels: Handler = async ({ env }) => {
  const cfg = platformConfig(env);
  return json({
    default_service: "nvidia",
    platform_available: !!cfg.apiKey,
    models: cfg.models,
  });
};

export const aiServices: Handler = async ({ env, req }) => {
  const user = await requireUser(req, env);
  const { results } = await env.DB.prepare(
    `SELECT service_name, is_active, base_url, model, created_at, updated_at
       FROM user_ai_services WHERE user_id = ? ORDER BY created_at ASC`,
  )
    .bind(user.id)
    .all();
  const cfg = platformConfig(env);
  const quota = await platformQuota(env, user.id, !!user.is_premium);
  return json({
    providers: PROVIDER_LIST.map((p) => ({
      id: p.id,
      label: p.label,
      default_model: p.defaultModel,
      docs_url: p.docsUrl,
    })),
    services: results.map((s: any) => ({ ...s, is_active: !!s.is_active })),
    platform: {
      service_name: "nvidia",
      available: !!cfg.apiKey,
      models: cfg.models,
      daily_limit: quota.limit === Infinity ? null : quota.limit,
      used_today: quota.used,
      remaining_today: quota.remaining === Infinity ? null : quota.remaining,
    },
  });
};

export const aiConnect: Handler = async ({ env, req, body }) => {
  const user = await requireUser(req, env);
  const serviceName = String(body?.service_name ?? "").trim().toLowerCase();
  const apiKey = String(body?.api_key ?? "").trim();
  const baseUrl = typeof body?.base_url === "string" ? body.base_url.trim() : null;
  const model = typeof body?.model === "string" ? body.model.trim() : null;

  const provider = PROVIDERS[serviceName];
  if (!provider) throw new HttpError(400, `Unsupported service "${serviceName}"`);
  if (apiKey.length < 8 || apiKey.length > 256) throw new HttpError(400, "API key looks invalid");
  if (provider.keyHint && !apiKey.startsWith(provider.keyHint)) {
    throw new HttpError(400, `A ${provider.label} key usually starts with "${provider.keyHint}"`);
  }
  if (serviceName === "custom") {
    if (!baseUrl) throw new HttpError(400, "Custom provider requires base_url");
    if (!model) throw new HttpError(400, "Custom provider requires a model name");
  }

  const encrypted = await encryptSecret(env, apiKey);
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO user_ai_services (id, user_id, service_name, api_key_encrypted, base_url, model, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
     ON CONFLICT(user_id, service_name) DO UPDATE SET
       api_key_encrypted = excluded.api_key_encrypted,
       base_url = excluded.base_url,
       model = excluded.model,
       is_active = 1,
       updated_at = excluded.updated_at`,
  )
    .bind(uuid(), user.id, serviceName, encrypted, baseUrl, model, now, now)
    .run();
  await ensureBadge(env.DB, user.id, "byok_connected");
  return json({ success: true });
};

export const aiPatchService: Handler = async ({ env, req, params, body }) => {
  const user = await requireUser(req, env);
  const serviceName = params.name.toLowerCase();
  if (typeof body?.is_active !== "boolean") throw new HttpError(400, "is_active is required");
  const res = await env.DB.prepare(
    "UPDATE user_ai_services SET is_active = ?, updated_at = ? WHERE user_id = ? AND service_name = ?",
  )
    .bind(body.is_active ? 1 : 0, nowIso(), user.id, serviceName)
    .run();
  if (res.meta.changes === 0) throw new HttpError(404, "Service not connected");
  return json({ success: true });
};

export const aiDisconnect: Handler = async ({ env, req, params }) => {
  const user = await requireUser(req, env);
  const res = await env.DB.prepare("DELETE FROM user_ai_services WHERE user_id = ? AND service_name = ?")
    .bind(user.id, params.name.toLowerCase())
    .run();
  if (res.meta.changes === 0) throw new HttpError(404, "Service not connected");
  return json({ success: true });
};

export const aiTestService: Handler = async ({ env, req, params }) => {
  const user = await requireUser(req, env);
  const serviceName = params.name.toLowerCase();
  const row = await env.DB.prepare(
    "SELECT * FROM user_ai_services WHERE user_id = ? AND service_name = ?",
  )
    .bind(user.id, serviceName)
    .first<any>();
  if (!row) throw new HttpError(404, "Service not connected");
  const provider = PROVIDERS[serviceName];
  if (!provider) throw new HttpError(400, "Unknown service");
  try {
    const apiKey = await decryptSecret(env, row.api_key_encrypted);
    const result = await generateChat({
      apiKey,
      provider,
      model: row.model || undefined,
      baseUrlOverride: row.base_url || undefined,
      messages: [{ role: "user", content: "Reply with the single word: ready" }],
      maxTokens: 8,
      temperature: 0,
    });
    return json({ ok: true, model: result.model });
  } catch (err: any) {
    throw new HttpError(err?.status ?? 502, `Connection test failed: ${err?.message ?? err}`);
  }
};

export const aiGenerate: Handler = async ({ env, req, body }) => {
  const user = await requireUser(req, env);

  // Input: either an explicit messages array or a single prompt string.
  let messages: ChatMessage[];
  if (Array.isArray(body?.messages) && body.messages.length > 0) {
    messages = body.messages;
  } else if (isNonEmptyString(body?.prompt)) {
    messages = [{ role: "user", content: body.prompt.slice(0, 12_000) }];
  } else {
    throw new HttpError(400, "Provide either 'prompt' or 'messages'");
  }
  // Always steer the model toward prompt-engineering assistance.
  if (!messages.some((m) => m.role === "system")) {
    messages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
  }

  const temperature = body?.temperature !== undefined ? clampInt(body.temperature, 0, 1.5, 0.7) : 0.7;
  const maxTokens = clampInt(body?.max_tokens, 16, 4096, 1024);
  const requestedService = typeof body?.service === "string" ? body.service.toLowerCase() : "";
  const requestedModel = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : undefined;

  let result: { content: string; model: string };
  let usedService: string;

  if (requestedService) {
    // BYOK path (a user's own nvidia key also goes through here).
    const row = await env.DB.prepare(
      "SELECT * FROM user_ai_services WHERE user_id = ? AND service_name = ? AND is_active = 1",
    )
      .bind(user.id, requestedService)
      .first<any>();
    if (!row) {
      throw new HttpError(404, `Service "${requestedService}" is not connected. Connect it in AI Services first.`);
    }
    const provider = PROVIDERS[requestedService];
    if (!provider) throw new HttpError(400, `Unsupported service "${requestedService}"`);
    const apiKey = await decryptSecret(env, row.api_key_encrypted);
    try {
      result = await generateChat({
        apiKey,
        provider,
        model: requestedModel || row.model || undefined,
        baseUrlOverride: row.base_url || undefined,
        messages,
        temperature,
        maxTokens,
      });
    } catch (err: any) {
      throw new HttpError(err instanceof AiCallError ? err.status : 502, err?.message ?? "Generation failed");
    }
    usedService = requestedService;
  } else {
    // Platform path: free NVIDIA NIM key with a fair daily quota.
    const cfg = platformConfig(env);
    if (!cfg.apiKey) throw new HttpError(503, "No AI backend is configured on the server");
    const quota = await platformQuota(env, user.id, !!user.is_premium);
    if (quota.remaining !== Infinity && quota.remaining <= 0) {
      throw new HttpError(
        429,
        `Daily free limit reached (${quota.limit} generations). Connect your own API key in AI Services for unlimited use, or try again tomorrow.`,
      );
    }
    try {
      result = await generateWithPlatformKey(cfg.apiKey, cfg.baseUrl, cfg.models, messages, {
        model: requestedModel,
        temperature,
        maxTokens: maxTokens,
      });
    } catch (err: any) {
      throw new HttpError(err instanceof AiCallError ? err.status : 502, err?.message ?? "Generation failed");
    }
    if (quota.remaining !== Infinity) await bumpQuota(env, user.id);
    usedService = "nvidia-platform";
  }

  await recordHistory(env.DB, user.id, "ai_generate", { service: usedService, model: result.model });
  return json({ content: result.content, model: result.model, service: usedService });
};

// ---------------------------------------------------------------------------
// Contact + misc
// ---------------------------------------------------------------------------

export const contact: Handler = async ({ env, req, body }) => {
  const user = await optionalUser(req, env);
  const name = String(body?.name ?? "").trim().slice(0, 120);
  const email = String(body?.email ?? "").trim().slice(0, 200);
  const subject = String(body?.subject ?? "").trim().slice(0, 200);
  const message = String(body?.message ?? "").trim().slice(0, 5000);
  if (!name || !subject || !message) throw new HttpError(400, "name, subject and message are required");
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please provide a valid email address");
  await env.DB.prepare(
    "INSERT INTO contact_messages (id, user_id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(uuid(), user?.id ?? null, name, email, subject, message, nowIso())
    .run();
  return json({ success: true }, 201);
};

export const health: Handler = async ({ env }) => {
  let dbOk = false;
  try {
    await env.DB.prepare("SELECT 1").run();
    dbOk = true;
  } catch {
    /* db down */
  }
  return json({
    ok: dbOk,
    database: dbOk,
    platform_ai: !!platformConfig(env).apiKey,
    time: nowIso(),
  });
};
