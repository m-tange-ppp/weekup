/**
 * 通知サービス。
 * expo-notifications を使って通知のスケジューリングを行う。
 * 設定が変更されたときに再スケジューリングを行う。
 */

import { AppSettings } from "@/domain/models";
import * as Notifications from "expo-notifications";
import { getReminderDayBeforeWeekStart } from "./WeekService";

// 通知識別子
const WEEK_START_REMINDER_ID = "week-start-reminder";
const MORNING_REMINDER_ID = "morning-reminder";
const EVENING_REMINDER_ID = "evening-reminder";

/** 通知ハンドラーを初期化する（アプリ起動時に一度呼び出す） */
export function initNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** 通知パーミッションをリクエストする */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** HH:MM 形式の時刻文字列を時・分に分解する */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour, minute };
}

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
      weekday: reminderDay + 1, // expo-notifications は 1=日, 2=月, ...
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
