/**
 * KPTRecord（KPT振り返り）のリポジトリ。
 */

import { KPTRecord } from "@/domain/models";
import { SQLiteDatabase } from "expo-sqlite";

interface KPTRecordRow {
  id: number;
  weekly_goal_id: number;
  keep: string;
  problem: string;
  try: string;
  created_at: string;
  updated_at: string;
}

function rowToModel(row: KPTRecordRow): KPTRecord {
  return {
    id: row.id,
    weeklyGoalId: row.weekly_goal_id,
    keep: row.keep,
    problem: row.problem,
    try: row.try,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 特定の週目標に紐づくKPTを取得 */
export async function findKPTRecordsByGoalId(
  db: SQLiteDatabase,
  weeklyGoalId: number,
): Promise<KPTRecord[]> {
  const rows = await db.getAllAsync<KPTRecordRow>(
    "SELECT * FROM kpt_records WHERE weekly_goal_id = ? ORDER BY created_at ASC",
    [weeklyGoalId],
  );
  return rows.map(rowToModel);
}

/** 指定週のKPTをすべて取得（週目標を経由して結合） */
export async function findKPTRecordsByWeek(
  db: SQLiteDatabase,
  weekStartDate: string,
): Promise<KPTRecord[]> {
  const rows = await db.getAllAsync<KPTRecordRow>(
    `SELECT k.* FROM kpt_records k
     INNER JOIN weekly_goals g ON k.weekly_goal_id = g.id
     WHERE g.week_start_date = ?
     ORDER BY k.created_at ASC`,
    [weekStartDate],
  );
  return rows.map(rowToModel);
}

/** IDでKPTを取得 */
export async function findKPTRecordById(
  db: SQLiteDatabase,
  id: number,
): Promise<KPTRecord | null> {
  const row = await db.getFirstAsync<KPTRecordRow>(
    "SELECT * FROM kpt_records WHERE id = ?",
    [id],
  );
  return row ? rowToModel(row) : null;
}

/** KPTを作成する */
export async function createKPTRecord(
  db: SQLiteDatabase,
  params: { weeklyGoalId: number; keep: string; problem: string; try: string },
): Promise<KPTRecord> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO kpt_records (weekly_goal_id, keep, problem, try, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [params.weeklyGoalId, params.keep, params.problem, params.try, now, now],
  );
  const created = await findKPTRecordById(db, result.lastInsertRowId);
  if (!created) throw new Error("KPTの作成に失敗しました");
  return created;
}

/** KPTを更新する */
export async function updateKPTRecord(
  db: SQLiteDatabase,
  id: number,
  params: { keep?: string; problem?: string; try?: string },
): Promise<KPTRecord> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE kpt_records
     SET keep = COALESCE(?, keep),
         problem = COALESCE(?, problem),
         try = COALESCE(?, try),
         updated_at = ?
     WHERE id = ?`,
    [params.keep ?? null, params.problem ?? null, params.try ?? null, now, id],
  );
  const updated = await findKPTRecordById(db, id);
  if (!updated) throw new Error("KPTの更新に失敗しました");
  return updated;
}

/** KPTを削除する */
export async function deleteKPTRecord(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync("DELETE FROM kpt_records WHERE id = ?", [id]);
}
