// Gamification helpers: points and badges.

import { nowIso, uuid } from "./util";

export async function awardPoints(db: D1Database, userId: string, points: number, reason: string) {
  if (!userId || points <= 0) return;
  await db
    .prepare("INSERT INTO user_points (id, user_id, points, reason, earned_at) VALUES (?, ?, ?, ?, ?)")
    .bind(uuid(), userId, points, reason, nowIso())
    .run();
}

export async function ensureBadge(db: D1Database, userId: string, badgeType: string) {
  if (!userId) return;
  await db
    .prepare("INSERT OR IGNORE INTO user_badges (id, user_id, badge_type, earned_at) VALUES (?, ?, ?, ?)")
    .bind(uuid(), userId, badgeType, nowIso())
    .run();
}

export async function recordHistory(
  db: D1Database,
  userId: string | null,
  actionType: string,
  data?: unknown,
) {
  if (!userId) return;
  try {
    await db
      .prepare("INSERT INTO user_history (id, user_id, action_type, data, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(uuid(), userId, actionType, data ? JSON.stringify(data) : null, nowIso())
      .run();
  } catch {
    // History is best-effort; never fail the main operation because of it.
  }
}
