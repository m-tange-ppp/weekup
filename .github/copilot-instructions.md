# プロジェクトガイドライン

## 概要

**WeekUp** — 週次KPTサイクルを習慣化するモバイルアプリ。週目標の設定・日々の日記記録・KPT振り返りを一体化し、続けやすいシンプルなUXを提供する。

対象ユーザー: 目標を立てても続かない人、振り返りの習慣を持ちたいビジネスパーソン・学生。

## アーキテクチャ

ドメイン駆動設計（DDD）を適用する。以下の4つのドメインモデルを中心に実装する。

| ドメイン      | 説明                                   | 制約                               |
| ------------- | -------------------------------------- | ---------------------------------- |
| `WeeklyGoal`  | 週目標                                 | 1週間につき1個、Projectに紐づけ可  |
| `DailyRecord` | 日記（今日やったこと・気づき）         | 1日につき1件、WeeklyGoalと紐づく   |
| `KPTRecord`   | Keep / Problem / Try の振り返り        | 1週間につき1件、WeeklyGoalと紐づく |
| `Project`     | 大きな目標・プロジェクト（進捗率あり） |                                    |

週の1日目は月曜日（ユーザー変更可能）。データはすべてローカルストレージに保存し、オフライン動作を保証する。

### テーブル構造

- `weekly_goals`: id, project_id(nullable), description, week_start_date, week_end_date, created_at, updated_at
- `daily_records`: id, weekly_goal_id, description, created_at, updated_at
- `kpt_records`: id, weekly_goal_id, keep, problem, try, created_at, updated_at
- `projects`: id, name, description, progress(0-100), target_date(nullable), is_completed(0/1), created_at, updated_at

## 機能要件

- **週初め**: 週目標を**1個だけ**作成する
  - 後から追加・修正も可能
  - 作成時に先週のKPT記録を参照できる
  - 週始め前日に作成リマインドを送る（時刻設定可能）
- **毎日**: 日記（今日やったこと・気づき）を一言〜数行で記録する
  - 後から修正も可能
  - 記録時に週目標を参照できる
  - 毎朝週目標の確認と夜の振り返りリマインドを送る（時刻設定可能）
- **週末**: Keep / Problem / Try をガイドに沿って入力する
  - 後から修正も可能
  - KPT記録時に週目標と日記を参照できる
- **カレンダー**: 週目標とKPT記録を俯瞰できる
  - 日付タップで週目標・日記・KPT記録をまとめて確認・編集できる
  - カレンダーと独立して各レコードを追加するボタンを設置する
- **プロジェクト管理**: 大きな目標・プロジェクトを週目標とは独立して管理する
  - 進捗率（0〜100）を入力できる
  - 達成予定日（任意）と完了済みフラグを持つ
  - 一覧画面（`projects.tsx`）・詳細画面（`projects/[id].tsx`）・編集モーダル（`projects/edit/[id].tsx`）に分離

## 非機能要件

- オフラインでも利用できる（ローカルストレージにデータを保存）
- シンプルで直感的なUI、落ち着いた配色（`constants/theme.ts` を参照）

## ビルド・テスト

```bash
npx expo start        # 開発サーバー起動
npx expo run:android  # Android実機・エミュレーター
```

## 規約

- **SOLID原則**を守る
- **DDD**に従い、ドメインロジックはドメイン層に閉じ込める
- 週の区切り・リマインド時刻はユーザー設定で変更可能にする
- チャットの回答、ソース中のコメントは日本語で行う

## 開発フロー（NOTES.md OPEN → 実装 → テスト）

NOTES.md の `### OPEN` セクションを起点とした開発フローは、以下の4つの専用エージェントをこの順番で使う。各エージェントは前フェーズの出力を入力として受け取り、次フェーズへ引き継ぐ責務を持つ。

```
NOTES.md OPEN
     ↓
@requirements  ─── 課題の分析・受け入れ条件の定義
     ↓
@design        ─── DDD設計・変更ファイル計画の策定
     ↓
@implementation ── コードの修正・追加・NOTES.md更新
     ↓
@testing       ─── 静的解析・コードレビュー・受け入れ確認
     ↓
    完了（次の課題へ）
```

### エージェント一覧

| エージェント     | 呼び出し例       | 役割                    |
| ---------------- | ---------------- | ----------------------- |
| `requirements`   | 「要件定義して」 | OPEN課題 → 受け入れ条件 |
| `design`         | 「設計して」     | 要件定義 → 設計書       |
| `implementation` | 「実装して」     | 設計書 → コード変更     |
| `testing`        | 「テストして」   | コード変更 → 検証・完了 |

### スキル

- `parse-open-issues`: `requirements` エージェントが内部で使用。NOTES.md の OPEN を分類・優先度付けする

### ルール

- 各フェーズの成果物は `docs/issues/<YYYY-MM-DD-課題名>/` に保存する（`requirements.md` → `design.md` → `implementation.md` の順に蓄積）
- 完了ログは `docs/dev-log/YYYY-MM-DD-<課題名>.md` に保存する（`testing` が生成）
- 各エージェントは前フェーズのアウトプットを必ず確認してから作業を開始する
- フェーズをスキップしない（特別な指示がある場合を除く）
- 差し戻しが発生した場合は `implementation` → `testing` のサイクルを繰り返す
- 課題対応が完了したら NOTES.md の `### OPEN` から `### CLOSE` へ移動する

## エージェントの後処理ルール

実装作業（planモード後のstart implementation含む）が完了し、以下のいずれかに該当する場合は `update-customization-docs` スキルを実行する:

- 新しいフック・コンポーネント・パターンをファイルに追加した
- 既存のアーキテクチャ慣習が変更・拡張された
- 新しいディレクトリ構造・ファイル種別が導入された
- 今後の実装で再利用すべきパターンが確立された
