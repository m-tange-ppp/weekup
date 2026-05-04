/**
 * ドメインモデルの型定義。
 * テーブル構造はアーキテクチャ仕様書に従う。
 */

/** 週目標 */
export interface WeeklyGoal {
  id: number;
  /** 紐づくプロジェクトID（任意） */
  projectId: number | null;
  /** 目標の説明 */
  description: string;
  /** 週の開始日（YYYY-MM-DD） */
  weekStartDate: string;
  /** 週の終了日（YYYY-MM-DD） */
  weekEndDate: string;
  createdAt: string;
  updatedAt: string;
}

/** 日記レコード */
export interface DailyRecord {
  id: number;
  /** 紐づく週目標ID */
  weeklyGoalId: number;
  /** 今日やったこと・気づき */
  description: string;
  /** 記録日（YYYY-MM-DD） */
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** KPT振り返りレコード */
export interface KPTRecord {
  id: number;
  /** 紐づく週目標ID */
  weeklyGoalId: number;
  /** Keep: 継続すること */
  keep: string;
  /** Problem: 課題・問題点 */
  problem: string;
  /** Try: 次に試すこと */
  try: string;
  createdAt: string;
  updatedAt: string;
}

/** プロジェクト */
export interface Project {
  id: number;
  /** プロジェクト名 */
  name: string;
  /** 説明（任意） */
  description: string | null;
  /** 進捗率 0〜100 */
  progress: number;
  /** 達成予定日（YYYY-MM-DD, 任意） */
  targetDate: string | null;
  /** 完了済みフラグ */
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** アプリ設定 */
export interface AppSettings {
  /** 週の始まりの曜日 (0=日, 1=月, ... 6=土) */
  weekStartDay: number;
  /** 週始めリマインド時刻 HH:MM */
  weekStartReminderTime: string;
  /** 朝の確認リマインド時刻 HH:MM */
  morningReminderTime: string;
  /** 夜の振り返りリマインド時刻 HH:MM */
  eveningReminderTime: string;
  /** 通知を有効にするか */
  notificationsEnabled: boolean;
}

/** デフォルト設定値 */
export const DEFAULT_SETTINGS: AppSettings = {
  weekStartDay: 1, // 月曜始まり
  weekStartReminderTime: "20:00",
  morningReminderTime: "08:00",
  eveningReminderTime: "21:00",
  notificationsEnabled: true,
};
