/**
 * DailyRecord（日記）のリポジトリ。
 */

import { DailyRecord } from "@/domain/models";
import { SQLiteDatabase } from "expo-sqlite";

interface DailyRecordRow {
  id: number;
  weekly_goal_id: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

function rowToModel(row: DailyRecordRow): DailyRecord {
  return {
    id: row.id,
    weeklyGoalId: row.weekly_goal_id,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 特定の週目標に紐づく日記を取得 */
export async function findDailyRecordsByGoalId(
  db: SQLiteDatabase,
  weeklyGoalId: number,
): Promise<DailyRecord[]> {
  const rows = await db.getAllAsync<DailyRecordRow>(
    "SELECT * FROM daily_records WHERE weekly_goal_id = ? ORDER BY date DESC",
    [weeklyGoalId],
  );
  return rows.map(rowToModel);
}

/** 指定日の日記を取得 */
export async function findDailyRecordsByDate(
  db: SQLiteDatabase,
  date: string,
): Promise<DailyRecord[]> {
  const rows = await db.getAllAsync<DailyRecordRow>(
    "SELECT * FROM daily_records WHERE date = ? ORDER BY created_at ASC",
    [date],
  );
  return rows.map(rowToModel);
}

/** 指定週（weekStartDate〜weekEndDate）の日記をすべて取得 */
export async function findDailyRecordsByWeek(
  db: SQLiteDatabase,
  weekStartDate: string,
  weekEndDate: string,
): Promise<DailyRecord[]> {
  const rows = await db.getAllAsync<DailyRecordRow>(
    "SELECT * FROM daily_records WHERE date >= ? AND date <= ? ORDER BY date ASC",
    [weekStartDate, weekEndDate],
  );
  return rows.map(rowToModel);
}

/** IDで日記を取得 */
export async function findDailyRecordById(
  db: SQLiteDatabase,
  id: number,
): Promise<DailyRecord | null> {
  const row = await db.getFirstAsync<DailyRecordRow>(
    "SELECT * FROM daily_records WHERE id = ?",
    [id],
  );
  return row ? rowToModel(row) : null;
}

/** 日記を作成する */
export async function createDailyRecord(
  db: SQLiteDatabase,
  params: { weeklyGoalId: number; description: string; date: string },
): Promise<DailyRecord> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO daily_records (weekly_goal_id, description, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [params.weeklyGoalId, params.description, params.date, now, now],
  );
  const created = await findDailyRecordById(db, result.lastInsertRowId);
  if (!created) throw new Error("日記の作成に失敗しました");
  return created;
}

/** 日記を更新する */
export async function updateDailyRecord(
  db: SQLiteDatabase,
  id: number,
  params: { description?: string },
): Promise<DailyRecord> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE daily_records SET description = COALESCE(?, description), updated_at = ? WHERE id = ?`,
    [params.description ?? null, now, id],
  );
  const updated = await findDailyRecordById(db, id);
  if (!updated) throw new Error("日記の更新に失敗しました");
  return updated;
}

/** 日記を削除する */
export async function deleteDailyRecord(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync("DELETE FROM daily_records WHERE id = ?", [id]);
}

/** 記録がある日付の一覧を取得（カレンダーのマーキング用） */
export async function findDatesWithRecords(
  db: SQLiteDatabase,
  fromDate: string,
  toDate: string,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ date: string }>(
    "SELECT DISTINCT date FROM daily_records WHERE date >= ? AND date <= ? ORDER BY date ASC",
    [fromDate, toDate],
  );
  return rows.map((r) => r.date);
}
