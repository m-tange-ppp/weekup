# 設計書: 通知重複送信の修正

## アーキテクチャ上の変更方針

### 変更レイヤー: サービス層のみ

| レイヤー                                       | 変更                           |
| ---------------------------------------------- | ------------------------------ |
| ドメイン層 (`domain/`)                         | **変更なし**                   |
| インフラ層 (`infrastructure/`)                 | **変更なし**                   |
| フック層 (`hooks/`)                            | **変更なし**                   |
| サービス層 (`services/NotificationService.ts`) | **変更あり（唯一の変更対象）** |
| UI層 (`app/`)                                  | **変更なし**                   |

`scheduleNotificationAsync` は **identifier をキーとした upsert** として機能する（iOS: `UNNotificationRequest`、Android: identifier ベースの AlarmManager）。
そのため `cancelAllScheduledNotificationsAsync` による「全削除 → 再登録」パターンを廃止し、**直接 `scheduleNotificationAsync` を呼ぶだけ**で自然に冪等になる設計に変更する。

---

## ファイル別変更計画

### 新規作成

なし

### 変更

| ファイルパス                      | 変更箇所                               | 変更内容                                                                                                         |
| --------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `services/NotificationService.ts` | `scheduleAllNotifications` (L48〜L109) | `cancelAllNotifications()` の呼び出しを削除し、`notificationsEnabled=false` 時は identifier 個別キャンセルに変更 |
| `services/NotificationService.ts` | `cancelAllNotifications` (L111〜L113)  | 関数ごと削除（`cancelAllScheduledNotificationsAsync` 廃止）                                                      |

### 変更しないもの（除外理由）

| ファイル                  | 理由                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `app/_layout.tsx`         | `scheduleAllNotifications` の呼び出し側。シグネチャに変更なし |
| `hooks/use-settings.ts`   | `scheduleAllNotifications` の呼び出し側。シグネチャに変更なし |
| `domain/models/index.ts`  | `AppSettings` 型に変更なし                                    |
| `services/WeekService.ts` | `getReminderDayBeforeWeekStart` の利用側。変更なし            |

---

## インターフェース定義

### 削除する関数

```typescript
// 削除
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

### 変更後のシグネチャ（変更なし）

```typescript
// シグネチャは変わらない。内部実装のみ変更。
export async function scheduleAllNotifications(
  settings: AppSettings,
): Promise<void>;
```

---

## 変更前後の差分

### `scheduleAllNotifications` 関数の変更

**変更前（L48〜L109）**

```typescript
/** 通知をすべてキャンセルして再スケジューリングする */
export async function scheduleAllNotifications(
  settings: AppSettings,
): Promise<void> {
  if (!settings.notificationsEnabled) {
    await cancelAllNotifications();  // ← 削除対象
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // 既存の通知をキャンセル
  await cancelAllNotifications();   // ← 削除対象

  // 週始め前日リマインド（週目標作成を促す）
  const reminderDay = getReminderDayBeforeWeekStart(settings.weekStartDay);
  const weekStartTime = parseTime(settings.weekStartReminderTime);
  await Notifications.scheduleNotificationAsync({
    identifier: WEEK_START_REMINDER_ID,
    ...
  });

  // 朝の確認リマインド（毎日）
  const morningTime = parseTime(settings.morningReminderTime);
  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_REMINDER_ID,
    ...
  });

  // 夜の振り返りリマインド（毎日）
  const eveningTime = parseTime(settings.eveningReminderTime);
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_REMINDER_ID,
    ...
  });
}

/** すべての通知をキャンセルする */
export async function cancelAllNotifications(): Promise<void> {   // ← 削除対象
  await Notifications.cancelAllScheduledNotificationsAsync();     // ← 削除対象
}                                                                 // ← 削除対象
```

**変更後**

```typescript
/** 通知をスケジューリングする（冪等: 何度呼んでも最大3件） */
export async function scheduleAllNotifications(
  settings: AppSettings,
): Promise<void> {
  if (!settings.notificationsEnabled) {
    // cancelAllScheduledNotificationsAsync は他のアプリの通知も消すため使わない。
    // 識別子ベースで WeekUp の通知のみを個別にキャンセルする。
    await Notifications.cancelScheduledNotificationAsync(
      WEEK_START_REMINDER_ID,
    );
    await Notifications.cancelScheduledNotificationAsync(MORNING_REMINDER_ID);
    await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID);
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // scheduleNotificationAsync は identifier をキーとした upsert として機能するため、
  // 事前キャンセルは不要。直接スケジューリングするだけで冪等になる。

  // 週始め前日リマインド（週目標作成を促す）
  const reminderDay = getReminderDayBeforeWeekStart(settings.weekStartDay);
  const weekStartTime = parseTime(settings.weekStartReminderTime);
  await Notifications.scheduleNotificationAsync({
    identifier: WEEK_START_REMINDER_ID,
    content: {
      title: "今週の目標を立てよう",
      body: "明日から新しい週が始まります。週目標を設定しましょう。",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: reminderDay + 1,
      hour: weekStartTime.hour,
      minute: weekStartTime.minute,
    },
  });

  // 朝の確認リマインド（毎日）
  const morningTime = parseTime(settings.morningReminderTime);
  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_REMINDER_ID,
    content: {
      title: "今日も一歩前へ",
      body: "今週の目標を確認して、今日のアクションを決めましょう。",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: morningTime.hour,
      minute: morningTime.minute,
    },
  });

  // 夜の振り返りリマインド（毎日）
  const eveningTime = parseTime(settings.eveningReminderTime);
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_REMINDER_ID,
    content: {
      title: "今日の振り返りを記録しよう",
      body: "今日やったこと・気づきを日記に残しましょう。",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: eveningTime.hour,
      minute: eveningTime.minute,
    },
  });
}

// cancelAllNotifications は削除（cancelAllScheduledNotificationsAsync 廃止のため）
```

---

## 変更箇所の行番号（目安）

現在の `services/NotificationService.ts`（全113行）における対象行:

| 行番号     | 内容                                                            | 操作                                           |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------- |
| L48        | `/** 通知をすべてキャンセルして再スケジューリングする */`       | JSDocコメント変更                              |
| L52        | `await cancelAllNotifications();`                               | → `cancelScheduledNotificationAsync` 3件に置換 |
| L59〜L60   | `// 既存の通知をキャンセル` + `await cancelAllNotifications();` | 削除（2行）                                    |
| L111〜L113 | `cancelAllNotifications` 関数定義全体                           | 削除                                           |

---

## 設計上のトレードオフ・注意点

### `cancelScheduledNotificationAsync` の挙動（スケジュール済みでない場合）

`cancelScheduledNotificationAsync(id)` はスケジュール済みでない identifier を渡しても **エラーを throw しない**（expo-notifications のドキュメントおよびソースより）。
そのため `notificationsEnabled=false` の初回呼び出しでも安全に動作する。

### `cancelAllScheduledNotificationsAsync` を廃止する理由

- `cancelAllScheduledNotificationsAsync` はアプリが登録した通知以外（他アプリ・システム通知）も消去する可能性がある
- 加えて、非同期の競合（Call A と Call B の割り込み）を引き起こす根本原因である
- identifier ベースの upsert で代替できるため廃止が最適解

### `cancelAllNotifications` のエクスポート廃止

現在 `export` されているが、`_layout.tsx` および `use-settings.ts` いずれも `cancelAllNotifications` を import していない（`scheduleAllNotifications` のみ使用）。
外部から呼ばれていないため、関数ごと削除しても破壊的変更にはならない。

### JSDocコメントの更新

`/** 通知をすべてキャンセルして再スケジューリングする */` → 「全キャンセル」の記述が実態と乖離するため、冪等性を説明するコメントに更新する。

---

## 実装時の注意事項

1. **`cancelAllNotifications` の削除前に**、`grep` で外部参照がないことを再確認すること（現時点では `NotificationService.ts` 内部のみ）
2. JSDoc コメント（L48）を「通知をすべてキャンセルして再スケジューリングする」→「通知をスケジューリングする（冪等: 何度呼んでも最大3件）」に更新すること
3. `cancelAllScheduledNotificationsAsync` の import は `expo-notifications` の名前空間 `Notifications.*` 経由のため、named import の削除は不要
4. 変更後に TypeScript / ESLint エラーがないことを `get_errors` ツールで確認すること
