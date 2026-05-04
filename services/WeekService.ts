/**
 * 週計算サービス。
 * 週の始まり曜日はユーザー設定から取得する。
 * date-fns を使って週の開始・終了日を計算する。
 */

import {
  addWeeks,
  endOfWeek,
  format,
  isSameWeek,
  isWithinInterval,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

/** 週始め曜日（0=日, 1=月, ...）を date-fns の weekStartsOn 型に変換 */
function toWeekStartsOn(weekStartDay: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** 指定日を含む週の開始日を返す（YYYY-MM-DD形式） */
export function getWeekStartDate(date: Date, weekStartDay: number): string {
  const start = startOfWeek(date, {
    weekStartsOn: toWeekStartsOn(weekStartDay),
  });
  return format(start, DATE_FORMAT);
}

/** 指定日を含む週の終了日を返す（YYYY-MM-DD形式） */
export function getWeekEndDate(date: Date, weekStartDay: number): string {
  const end = endOfWeek(date, { weekStartsOn: toWeekStartsOn(weekStartDay) });
  return format(end, DATE_FORMAT);
}

/** 今週の開始日と終了日を返す */
export function getCurrentWeekRange(weekStartDay: number): {
  weekStartDate: string;
  weekEndDate: string;
} {
  const today = new Date();
  return {
    weekStartDate: getWeekStartDate(today, weekStartDay),
    weekEndDate: getWeekEndDate(today, weekStartDay),
  };
}

/** 先週の開始日と終了日を返す */
export function getLastWeekRange(weekStartDay: number): {
  weekStartDate: string;
  weekEndDate: string;
} {
  const lastWeek = subWeeks(new Date(), 1);
  return {
    weekStartDate: getWeekStartDate(lastWeek, weekStartDay),
    weekEndDate: getWeekEndDate(lastWeek, weekStartDay),
  };
}

/** 次週の開始日と終了日を返す */
export function getNextWeekRange(weekStartDay: number): {
  weekStartDate: string;
  weekEndDate: string;
} {
  const nextWeek = addWeeks(new Date(), 1);
  return {
    weekStartDate: getWeekStartDate(nextWeek, weekStartDay),
    weekEndDate: getWeekEndDate(nextWeek, weekStartDay),
  };
}

/** 指定日が今週かどうかを判定 */
export function isCurrentWeek(dateStr: string, weekStartDay: number): boolean {
  const date = parseISO(dateStr);
  return isSameWeek(date, new Date(), {
    weekStartsOn: toWeekStartsOn(weekStartDay),
  });
}

/** 今日の日付を YYYY-MM-DD 形式で返す */
export function getTodayString(): string {
  return format(new Date(), DATE_FORMAT);
}

/** 週始め前日（リマインド送信日）の曜日を返す（0〜6） */
export function getReminderDayBeforeWeekStart(weekStartDay: number): number {
  return ((weekStartDay - 1 + 7) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** 日付文字列が指定範囲内かどうかを判定 */
export function isDateInRange(
  dateStr: string,
  startDateStr: string,
  endDateStr: string,
): boolean {
  const date = parseISO(dateStr);
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  return isWithinInterval(date, { start, end });
}

/** 週の残り日数（今日含む）を返す */
export function getDaysRemainingInWeek(weekEndDate: string): number {
  const today = new Date();
  const end = parseISO(weekEndDate);
  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, diff + 1);
}

/** 週末が近いか（残り2日以内）を判定 */
export function isNearWeekEnd(weekEndDate: string): boolean {
  return getDaysRemainingInWeek(weekEndDate) <= 2;
}
