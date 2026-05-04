/**
 * Project（プロジェクト）のリポジトリ。
 */

import { Project } from "@/domain/models";
import { SQLiteDatabase } from "expo-sqlite";

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  progress: number;
  target_date: string | null;
  is_completed: number;
  created_at: string;
  updated_at: string;
}

function rowToModel(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    progress: row.progress,
    targetDate: row.target_date ?? null,
    isCompleted: row.is_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** すべてのプロジェクトを取得 */
export async function findAllProjects(db: SQLiteDatabase): Promise<Project[]> {
  const rows = await db.getAllAsync<ProjectRow>(
    "SELECT * FROM projects ORDER BY created_at DESC",
  );
  return rows.map(rowToModel);
}

/** IDでプロジェクトを取得 */
export async function findProjectById(
  db: SQLiteDatabase,
  id: number,
): Promise<Project | null> {
  const row = await db.getFirstAsync<ProjectRow>(
    "SELECT * FROM projects WHERE id = ?",
    [id],
  );
  return row ? rowToModel(row) : null;
}

/** プロジェクトを作成する */
export async function createProject(
  db: SQLiteDatabase,
  params: {
    name: string;
    description?: string;
    progress?: number;
    targetDate?: string | null;
  },
): Promise<Project> {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO projects (name, description, progress, target_date, is_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?)`,
    [
      params.name,
      params.description ?? null,
      params.progress ?? 0,
      params.targetDate ?? null,
      now,
      now,
    ],
  );
  const created = await findProjectById(db, result.lastInsertRowId);
  if (!created) throw new Error("プロジェクトの作成に失敗しました");
  return created;
}

/** プロジェクトを更新する */
export async function updateProject(
  db: SQLiteDatabase,
  id: number,
  params: {
    name?: string;
    description?: string | null;
    progress?: number;
    targetDate?: string | null;
    isCompleted?: boolean;
  },
): Promise<Project> {
  const now = new Date().toISOString();
  // 既存データを取得して null-safe に上書き
  const current = await findProjectById(db, id);
  if (!current) throw new Error("プロジェクトが見つかりませんでした");
  const name = params.name !== undefined ? params.name : current.name;
  const description =
    params.description !== undefined ? params.description : current.description;
  const progress =
    params.progress !== undefined ? params.progress : current.progress;
  const targetDate =
    params.targetDate !== undefined ? params.targetDate : current.targetDate;
  const isCompleted =
    params.isCompleted !== undefined
      ? params.isCompleted
        ? 1
        : 0
      : current.isCompleted
        ? 1
        : 0;
  await db.runAsync(
    `UPDATE projects
     SET name = ?, description = ?, progress = ?, target_date = ?, is_completed = ?, updated_at = ?
     WHERE id = ?`,
    [name, description, progress, targetDate, isCompleted, now, id],
  );
  const updated = await findProjectById(db, id);
  if (!updated) throw new Error("プロジェクトの更新に失敗しました");
  return updated;
}

/** プロジェクトを削除する */
export async function deleteProject(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync("DELETE FROM projects WHERE id = ?", [id]);
}
