/**
 * expo-sqlite を使ったデータベース接続・初期化モジュール。
 * アプリ起動時に一度だけ呼び出す。
 */

import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

/** データベース接続を取得する（シングルトン） */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("weekup.db");
  }
  return db;
}

/** テーブルを初期化する（起動時に一度呼び出す） */
export async function initDatabase(): Promise<void> {
  const database = getDatabase();
  // 外部キー制約を有効化
  await database.execAsync("PRAGMA foreign_keys = ON;");
  for (const sql of CREATE_TABLES_SQL) {
    await database.execAsync(sql);
  }
  // マイグレーション: projects テーブルに target_date カラムを追加
  const projectsCols = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(projects)",
  );
  const colNames = projectsCols.map((c) => c.name);
  if (!colNames.includes("target_date")) {
    await database.execAsync(
      "ALTER TABLE projects ADD COLUMN target_date TEXT",
    );
  }
  if (!colNames.includes("is_completed")) {
    await database.execAsync(
      "ALTER TABLE projects ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0",
    );
  }
}
