/**
 * データベーススキーマ定義。
 * テーブル構造はアーキテクチャ仕様書に従う。
 */

/** テーブル作成SQL（存在しない場合のみ作成） */
export const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    progress INTEGER NOT NULL DEFAULT 0,
    target_date TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS weekly_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    week_start_date TEXT NOT NULL,
    week_end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS daily_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekly_goal_id INTEGER NOT NULL REFERENCES weekly_goals(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS kpt_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekly_goal_id INTEGER NOT NULL REFERENCES weekly_goals(id) ON DELETE CASCADE,
    keep TEXT NOT NULL DEFAULT '',
    problem TEXT NOT NULL DEFAULT '',
    try TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];
