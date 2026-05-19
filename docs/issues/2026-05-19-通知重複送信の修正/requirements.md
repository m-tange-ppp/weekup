# 要件定義: 通知重複送信の修正

## 背景・目的

`scheduleAllNotifications` は「全キャンセル → 再スケジュール」という2段階の非同期処理で構成されている。
この設計は本質的に非冪等であり、以下のシナリオで重複登録が発生しうる。

### 重複が発生しうるシナリオ（ユーザー操作なしでも発生）

| シナリオ                               | 説明                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **アプリ復帰時の再マウント**           | バックグラウンド→フォアグラウンド復帰時に `_layout.tsx` が再マウントされると、`loading: true→false` の変化が再び起き `scheduleAllNotifications` が再呼び出しされる |
| **開発環境の Strict Mode**             | React 18 の Strict Mode により開発環境で `useEffect` が意図的に二重実行される                                                                                      |
| **Android の identifier 上書き未保証** | `scheduleNotificationAsync` に同一 identifier を渡しても、Android では追加登録になる場合がある                                                                     |

### 競合のメカニズム

```
Call A: cancelAll → (非同期待機中)
Call B:             cancelAll (A のスケジュール前に割り込み) → scheduleB1, scheduleB2, scheduleB3
Call A (再開):                                                  scheduleA1, scheduleA2, scheduleA3
結果: 各通知が2件ずつ登録される
```

### 根本的な問題

`cancelAllScheduledNotificationsAsync` を使う設計が問題。
expo-notifications の `scheduleNotificationAsync` は **identifier をキーとした upsert** として機能する（iOS: UNNotificationRequest、Android: identifier ベースの AlarmManager）。
そのため `cancelAll` は不要であり、**直接 `scheduleNotificationAsync` を呼ぶだけで自然に冪等になる**。

## 対象ファイル（影響範囲）

- `services/NotificationService.ts`: `cancelAllScheduledNotificationsAsync` を廃止し identifier upsert に変更

## 機能要件

- [ ] `scheduleAllNotifications` を何度呼んでもスケジュール済み通知が最大3件になること
- [ ] `notificationsEnabled=false` のときは通知が0件になること（現状動作を維持）
- [ ] 通知識別子（`WEEK_START_REMINDER_ID` / `MORNING_REMINDER_ID` / `EVENING_REMINDER_ID`）ベースの upsert を使い、`cancelAllScheduledNotificationsAsync` を廃止すること

## 非機能要件

- `scheduleAllNotifications` を冪等（何度呼んでも結果が同じ）な実装にする
  - `cancelAllScheduledNotificationsAsync` を削除し、`scheduleNotificationAsync` の identifier upsert 動作に委ねる
  - `notificationsEnabled=false` の場合は `cancelScheduledNotificationAsync(id)` で3件を個別にキャンセルする
- `hooks/use-settings.ts` と `app/_layout.tsx` の呼び出し側は変更不要
- DDD規約：通知のドメインロジックは `services/NotificationService.ts` に閉じ込める

## 受け入れ条件

- [ ] `scheduleAllNotifications` を連続して複数回呼び出しても、スケジュール済み通知が3件以下であること
- [ ] 通知をOFFに設定した後、スケジュール済み通知が0件であること
- [ ] 通知をONに設定した後、スケジュール済み通知が3件（週始めリマインド・朝・夜）であること
- [ ] TypeScript / ESLint エラーなし

## 除外スコープ

- 通知の内容（タイトル・本文）の変更
- 端末再起動後の通知復元ロジック（既に `_layout.tsx` で対応済み・CLOSE）
- Android通知チャンネルの追加設定
- プッシュ通知（リモート通知）への対応

---

## ⚠️ testing エージェントへの引き継ぎ事項

**完了ログの保存先を必ず守ること**:

- **正**: `docs/dev-log/2026-05-19-通知重複送信の修正.md`
- **誤（前回の失敗例）**: `docs/issues/2026-05-19-デバッグ機能削除/dev-log.md`

`copilot-instructions.md` の規約:

> 完了ログは `docs/dev-log/YYYY-MM-DD-<課題名>.md` に保存する（`testing` が生成）
