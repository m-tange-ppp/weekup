# 設計書: 作成時日付指定

## アーキテクチャ上の変更方針

### ドメイン層

- `DailyRecord` モデルに `date` フィールドを追加（`YYYY-MM-DD` 形式の ISO 日付文字列）
- `WeeklyGoal` / `KPTRecord` は既存の `weekStartDate` / `weekEndDate` を流用するためモデル変更なし
- `CreateDailyRecordInput` を `date` フィールドを持つよう拡張

### インフラ層

- `schema.ts`: `daily_records` テーブルに `date TEXT NOT NULL` カラムを追加しマイグレーションを追加
- `DailyRecordRepository`: `create()` の入力型・INSERT 文に `date` を追加
- `WeeklyGoalRepository`: 指定した `weekStartDate` で目標を検索する `findByWeekStart(weekStartDate: string)` を追加

### フック層

- `use-weekly-goals.ts`: `createGoal` に省略可能な `weekStartDate` パラメーターを追加（省略時=今週の開始日）
- `use-daily-records.ts`: `createRecord` に省略可能な `date` パラメーターを追加（省略時=今日）。指定日付の週に対応する `weeklyGoalId` を動的に検索するロジックを実装
- `use-kpt-records.ts`: `createRecord` に省略可能な `weekStartDate` パラメーターを追加（省略時=今週の開始日）

### UI層

- `components/WeekSelector.tsx`: 週選択コンポーネント（新規）。`@react-native-community/datetimepicker` を用いた DatePicker と、前週・翌週ナビゲーションを提供
- `components/DateSelector.tsx`: 日付選択コンポーネント（新規）。`@react-native-community/datetimepicker` を内包
- `app/goals/new.tsx`: `WeekSelector` を追加。選択した週の開始日を `createGoal` に渡す
- `app/records/daily/new.tsx`: `DateSelector` を追加。選択した日付を `createRecord` に渡す
- `app/records/kpt/new.tsx`: `WeekSelector` を追加。選択した週の開始日を `createRecord` に渡す

---

## ファイル別変更計画

### 新規作成

| ファイルパス                  | 役割                       | 主要な型・関数                      |
| ----------------------------- | -------------------------- | ----------------------------------- |
| `components/WeekSelector.tsx` | 週選択 UI コンポーネント   | `WeekSelectorProps`, `WeekSelector` |
| `components/DateSelector.tsx` | 日付選択 UI コンポーネント | `DateSelectorProps`, `DateSelector` |

### 変更

| ファイルパス                                           | 変更箇所                                         | 変更内容                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `domain/models/index.ts`                               | `DailyRecord` 型, `CreateDailyRecordInput` 型    | `date: string` フィールドを追加                                                                                                                  |
| `infrastructure/database/schema.ts`                    | `createDailyRecordsTable` SQL, `runMigrations`   | `date TEXT NOT NULL DEFAULT ''` カラム追加、マイグレーションで既存行に `DATE(created_at)` をバックフィル                                         |
| `infrastructure/repositories/DailyRecordRepository.ts` | `create()`, `findAll()` / `findByWeeklyGoalId()` | INSERT に `date` を追加、SELECT に `date` を追加                                                                                                 |
| `infrastructure/repositories/WeeklyGoalRepository.ts`  | 新規メソッド追加                                 | `findByWeekStart(weekStartDate: string): Promise<WeeklyGoal \| null>` を追加                                                                     |
| `hooks/use-weekly-goals.ts`                            | `createGoal` シグネチャ                          | `weekStartDate?: string` パラメーター追加。省略時は `WeekService.getWeekStartDate(new Date(), weekStartDay)` で算出                              |
| `hooks/use-daily-records.ts`                           | `createRecord` シグネチャ、内部ロジック          | `date?: string` パラメーター追加。省略時は今日。週目標を `WeeklyGoalRepository.findByWeekStart` で動的検索。目標が見つからない場合はエラーを返す |
| `hooks/use-kpt-records.ts`                             | `createRecord` シグネチャ                        | `weekStartDate?: string` パラメーター追加。省略時は `WeekService.getWeekStartDate(new Date(), weekStartDay)`                                     |
| `app/goals/new.tsx`                                    | フォーム UI                                      | `WeekSelector` を追加。`selectedWeekStart` ローカル state で管理し `createGoal` に渡す                                                           |
| `app/records/daily/new.tsx`                            | フォーム UI                                      | `DateSelector` を追加。`selectedDate` ローカル state で管理し `createRecord` に渡す                                                              |
| `app/records/kpt/new.tsx`                              | フォーム UI                                      | `WeekSelector` を追加。`selectedWeekStart` ローカル state で管理し `createRecord` に渡す                                                         |

---

## インターフェース定義

```typescript
// ---- domain/models/index.ts ----

export interface DailyRecord {
  id: number;
  weeklyGoalId: number;
  date: string;           // 追加: YYYY-MM-DD 形式
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyRecordInput {
  weeklyGoalId: number;
  date: string;           // 追加: YYYY-MM-DD 形式
  description: string;
}

// ---- infrastructure/repositories/WeeklyGoalRepository.ts ----

// 新規追加メソッド
findByWeekStart(weekStartDate: string): Promise<WeeklyGoal | null>;

// ---- hooks/use-weekly-goals.ts ----

createGoal(
  description: string,
  projectId?: number | null,
  weekStartDate?: string   // 追加: 省略時は今週の開始日
): Promise<void>;

// ---- hooks/use-daily-records.ts ----

createRecord(
  description: string,
  date?: string            // 追加: 省略時は今日 (YYYY-MM-DD)
): Promise<{ success: boolean; error?: 'NO_GOAL_FOR_WEEK' | 'DUPLICATE_DATE' }>;

// ---- hooks/use-kpt-records.ts ----

createRecord(
  keep: string,
  problem: string,
  tryContent: string,
  weekStartDate?: string   // 追加: 省略時は今週の開始日
): Promise<void>;

// ---- components/WeekSelector.tsx ----

export interface WeekSelectorProps {
  weekStart: Date;
  weekStartDay: number;   // 0=日曜, 1=月曜 (設定値)
  onChange: (weekStart: Date) => void;
}
export function WeekSelector(props: WeekSelectorProps): JSX.Element;

// ---- components/DateSelector.tsx ----

export interface DateSelectorProps {
  date: Date;
  onChange: (date: Date) => void;
}
export function DateSelector(props: DateSelectorProps): JSX.Element;
```

---

## データフロー

### 週目標作成（週指定あり）

```
[goals/new.tsx]
  ユーザーが WeekSelector で週を選択
  → selectedWeekStart (Date) を更新
  → 保存ボタン押下
  → createGoal(description, projectId, toISODateString(selectedWeekStart))
      ↓
[use-weekly-goals.ts]
  weekStartDate が渡された場合はそのまま使用、なければ WeekService で今週を算出
  weekEndDate = WeekService.getWeekEndDate(weekStartDate)
  → WeeklyGoalRepository.create({ description, weekStartDate, weekEndDate, projectId })
      ↓
[WeeklyGoalRepository]
  INSERT INTO weekly_goals ...
```

### 日記作成（日付指定あり）

```
[records/daily/new.tsx]
  ユーザーが DateSelector で日付を選択
  → selectedDate (Date) を更新
  → 保存ボタン押下
  → createRecord(description, toISODateString(selectedDate))
      ↓
[use-daily-records.ts]
  date が渡された場合はそのまま使用、なければ今日
  weekStart = WeekService.getWeekStartDate(new Date(date), weekStartDay)
  goal = await WeeklyGoalRepository.findByWeekStart(weekStart)
  goal が null → { success: false, error: 'NO_GOAL_FOR_WEEK' } を返す
  goal が存在 → DailyRecordRepository.create({ weeklyGoalId: goal.id, date, description })
      ↓
[DailyRecordRepository]
  INSERT INTO daily_records (weekly_goal_id, date, description, created_at, updated_at) ...
```

### KPT記録作成（週指定あり）

```
[records/kpt/new.tsx]
  ユーザーが WeekSelector で週を選択
  → selectedWeekStart (Date) を更新
  → 保存ボタン押下
  → createRecord(keep, problem, tryContent, toISODateString(selectedWeekStart))
      ↓
[use-kpt-records.ts]
  weekStartDate が渡された場合はそのまま使用、なければ WeekService で今週を算出
  goal = await WeeklyGoalRepository.findByWeekStart(weekStartDate)
  goal が null → エラー処理（目標が存在する週しか選択不可）
  → KPTRecordRepository.create({ weeklyGoalId: goal.id, keep, problem, try: tryContent })
      ↓
[KPTRecordRepository]
  INSERT INTO kpt_records ...
```

---

## スキーマ変更とマイグレーション

```sql
-- テーブル定義に date カラムを追加
CREATE TABLE IF NOT EXISTS daily_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekly_goal_id INTEGER NOT NULL,
  date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  FOREIGN KEY (weekly_goal_id) REFERENCES weekly_goals(id) ON DELETE CASCADE
);

-- マイグレーション: 既存テーブルへのカラム追加
ALTER TABLE daily_records ADD COLUMN date TEXT NOT NULL DEFAULT '';
-- バックフィル: 既存レコードの date を created_at の日付部分で埋める
UPDATE daily_records SET date = DATE(created_at) WHERE date = '';
```

### マイグレーション実行タイミング

- DB 初期化時（アプリ起動時）に `runMigrations()` を呼び出す既存の仕組みに追加する
- `ALTER TABLE` は `PRAGMA table_info` でカラム存在確認後に実行する（べき等性を確保）

---

## 変更しないもの（除外理由）

| ファイル                                             | 理由                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `services/WeekService.ts`                            | `getWeekStartDate` / `getWeekEndDate` をそのまま利用するため変更不要  |
| `infrastructure/repositories/KPTRecordRepository.ts` | KPT 自体の構造変更なし。`weeklyGoalId` 取得ロジックはフック層で完結   |
| `hooks/use-settings.ts`                              | 設定値は変更なし。`weekStartDay` を `WeekSelector` に渡す読み取りのみ |

---

## 設計上のトレードオフ・注意点

### 1. `date` 状態の管理場所: UI ローカル state を選択

- フック内部で選択状態を持つと再レンダリングの影響範囲が広がり複雑になる
- UI コンポーネントが `selectedDate` / `selectedWeekStart` を `useState` で管理し、保存時にフックの `create` 関数へ引数として渡す

### 2. `DailyRecord.date` フィールドの必須化

- 既存レコードは `created_at` の日付部分でバックフィルするため整合性は保たれる
- 新規作成時はアプリ側で必ず `date` を付与するため NOT NULL 制約で問題なし

### 3. 週目標が存在しない週への対応

- 日記・KPT 作成時に対象週の週目標が存在しない場合、`createRecord` からエラーコードを返す
- UI 側でこのエラーを受け取りユーザーに通知する（Alert または インライン表示）
- 週目標なしに日記を作れる仕様にしないことで `weekly_goal_id NOT NULL` 制約を維持しデータ整合性を保つ

### 4. `WeekSelector` の内部実装

- iOS / Android ともに `@react-native-community/datetimepicker` の `mode="date"` でカレンダー選択後、`WeekService.getWeekStartDate` で週始めに丸める
- 前週・翌週ボタンも併設し、カレンダーを開かずに隣接する週へ移動できるようにする

### 5. `ALTER TABLE` のべき等実行

- SQLite は `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` をサポートしていない
- `PRAGMA table_info(daily_records)` でカラムリストを確認し、`date` が存在しない場合のみ `ALTER TABLE` を実行する
