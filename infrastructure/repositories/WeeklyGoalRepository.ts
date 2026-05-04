/**
 * WeeklyGoal（週目標）のリポジトリ。
 * CRUD操作とクエリを提供する。
 */

import { WeeklyGoal } from "@/domain/models";
import { SQLiteDatabase } from "expo-sqlite";

interface WeeklyGoalRow {
  id: number;
  project_id: number | null;
  description: string;
  week_start_date: string;
  week_end_date: string;
  created_at: string;
  updated_at: string;
}

function rowToModel(row: WeeklyGoalRow): WeeklyGoal {
  return {
    id: row.id,
    projectId: row.project_id,
    description: row.description,
    weekStartDate: row.week_start_date,
    weekEndDate: row.week_end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 指定週の週目標をすべて取得（weekStartDate で絞り込み） */
export async function findWeeklyGoalsByWeek(
  db: SQLiteDatabase,
  weekStartDate: string,
): Promise<WeeklyGoal[]> {
  const rows = await db.getAllAsync<WeeklyGoalRow>(
    "SELECT * FROM weekly_goals WHERE week_start_date = ? ORDER BY created_at ASC",
    [weekStartDate],
  );
  return rows.map(rowToModel);
}

/** すべての週目標を取得 */
export async function findAllWeeklyGoals(
  db: SQLiteDatabase,
): Promise<WeeklyGoal[]> {
  const rows = await db.getAllAsync<WeeklyGoalRow>(
    "SELECT * FROM weekly_goals ORDER BY week_start_date DESC, created_at ASC",
  );
  return rows.map(rowToModel);
}

/** IDで週目標を取得 */
export async function findWeeklyGoalById(
  db: SQLiteDatabase,
  id: number,
): Promise<WeeklyGoal | null> {
  const row = await db.getFirstAsync<WeeklyGoalRow>(
    "SELECT * FROM weekly_goals WHERE id = ?",
    [id],
  );
  return row ? rowToModel(row) : null;
}

/** 指定プロジェクトに紐づく週目標を取得 */
export async function findWeeklyGoalsByProject(
  db: SQLiteDatabase,
  projectId: number,
): Promise<WeeklyGoal[]> {
  const rows = await db.getAllAsync<WeeklyGoalRow>(
    "SELECT * FROM weekly_goals WHERE project_id = ? ORDER BY week_start_date DESC",
    [projectId],
  );
  return rows.map(rowToModel);
}

/** 週目標を作成する（1週間に最大3件） */
export async function createWeeklyGoal(
  db: SQLiteDatabase,
  params: {
    projectId?: number;
    description: string;
    weekStartDate: string;
    weekEndDate: string;
  },
): Promise<WeeklyGoal> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO weekly_goals (project_id, description, week_start_date, week_end_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      params.projectId ?? null,
      params.description,
      params.weekStartDate,
      params.weekEndDate,
      now,
      now,
    ],
  );
  const created = await findWeeklyGoalById(db, result.lastInsertRowId);
  if (!created) throw new Error("週目標の作成に失敗しました");
  return created;
}

/** 週目標を更新する */
export async function updateWeeklyGoal(
  db: SQLiteDatabase,
  id: number,
  params: { projectId?: number | null; description?: string },
): Promise<WeeklyGoal> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE weekly_goals
     SET project_id = COALESCE(?, project_id),
         description = COALESCE(?, description),
         updated_at = ?
     WHERE id = ?`,
    [
      params.projectId !== undefined ? params.projectId : null,
      params.description ?? null,
      now,
      id,
    ],
  );
  const updated = await findWeeklyGoalById(db, id);
  if (!updated) throw new Error("週目標の更新に失敗しました");
  return updated;
}

/** 週目標を削除する */
export async function deleteWeeklyGoal(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync("DELETE FROM weekly_goals WHERE id = ?", [id]);
}

/** 指定週の週目標件数を取得 */
export async function countWeeklyGoalsByWeek(
  db: SQLiteDatabase,
  weekStartDate: string,
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM weekly_goals WHERE week_start_date = ?",
    [weekStartDate],
  );
  return row?.count ?? 0;
}
