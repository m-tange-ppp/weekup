# 実装サマリー: 作成時日付指定

## 変更ファイル

| ファイル                      | 変更内容                                                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/WeekSelector.tsx` | **新規作成**。◀ 前週 / 翌週 ▶ ボタン + DateTimePicker による週選択コンポーネント                                                                         |
| `components/DateSelector.tsx` | **新規作成**。タップで DateTimePicker を開く日付選択コンポーネント                                                                                       |
| `app/goals/new.tsx`           | `WeekSelector` を追加。URL パラメーターの `weekStartDate` を初期値として `selectedWeekStart` state で管理し、任意の週の目標を作成可能にした              |
| `app/records/daily/new.tsx`   | `DateSelector` を追加。選択日から週を動的に算出し、対応する週目標を取得。同日重複時は Alert で確認ダイアログを表示。週目標がない週はインライン警告を表示 |
| `app/records/kpt/new.tsx`     | `WeekSelector` を追加。週変更時に `selectedGoalId` をリセット。週目標がない週はインライン警告を表示                                                      |

## 元々実装済みだったもの（変更不要と判明）

| ファイル                                               | 理由                                                                |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `domain/models/index.ts`                               | `DailyRecord.date` フィールドは既に存在していた                     |
| `infrastructure/database/schema.ts`                    | `daily_records.date` カラムは既に定義済みだった                     |
| `infrastructure/repositories/DailyRecordRepository.ts` | `date` フィールドの INSERT/SELECT は既に対応済みだった              |
| `infrastructure/repositories/WeeklyGoalRepository.ts`  | `findWeeklyGoalsByWeek` が既に `week_start_date` 検索を提供していた |

## 実装上の判断・注意点

### 選択状態は UI の `useState` で管理

フック内部で選択状態を持つと複雑になるため、UI コンポーネントが `selectedDate` / `selectedWeekStart` を `useState` で管理し、保存時に既存の `create` 関数へ引数として渡す設計を採用。フックは CRUD に専念（単一責任原則）。

### 週目標が存在しない週への対応

- 日記・KPT 作成画面で選択した日付/週に週目標がない場合、インライン警告テキストを表示する
- 日記の場合は `goals[0]?.id` が存在しなければ保存をブロックし、エラーメッセージを表示する

### 同日重複チェック（日記）

日記作成画面では保存ボタン押下時に `findDailyRecordsByDate` で重複確認し、既存レコードがある場合は Alert で編集画面への移動を促す。

### 週目標の重複チェック

`useWeeklyGoals` フックの `create` 関数内で `countWeeklyGoalsByWeek` が `MAX_GOALS_PER_WEEK = 1` の制限を既に実装しているため、フロント側での追加実装は不要だった。
