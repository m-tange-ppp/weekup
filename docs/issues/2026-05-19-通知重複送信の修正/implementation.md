# 実装サマリー: 通知重複送信の修正

## 変更ファイル

| ファイル | 変更内容 |
| -------- | -------- |
| `services/NotificationService.ts` | `scheduleAllNotifications` の `cancelAllNotifications()` 呼び出しを削除し、`notificationsEnabled=false` 時は識別子ベースで3件を個別キャンセルに変更。`cancelAllNotifications` 関数自体を削除。 |

## 実装上の判断・注意点

- `cancelAllNotifications` が外部ファイル（`app/_layout.tsx`・`hooks/use-settings.ts`）から import されていないことを `grep` で事前確認済み
- `scheduleNotificationAsync` は identifier をキーとした upsert として機能するため、事前キャンセルなしで冪等性が確保できる
- `notificationsEnabled=false` 時は `cancelAllScheduledNotificationsAsync` ではなく `cancelScheduledNotificationAsync(id)` を3件呼ぶことで、他アプリの通知を誤消去するリスクを排除した
- `scheduleAllNotifications` のシグネチャは変更なしのため、呼び出し側（`_layout.tsx`・`use-settings.ts`）の修正は不要
