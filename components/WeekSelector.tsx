/**
 * 週選択コンポーネント。
 * 前週・翌週ボタン + DatePicker で週を選択する。
 */

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { addWeeks, parseISO, subWeeks } from "date-fns";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getWeekEndDate, getWeekStartDate } from "@/services/WeekService";

export interface WeekSelectorProps {
  /** 選択中の週開始日（Date オブジェクト） */
  weekStart: Date;
  /** 週始め曜日（0=日, 1=月, ...。ユーザー設定値） */
  weekStartDay: number;
  /** 週が変更されたときのコールバック */
  onChange: (weekStart: Date) => void;
}

export function WeekSelector({
  weekStart,
  weekStartDay,
  onChange,
}: WeekSelectorProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const [showPicker, setShowPicker] = useState(false);

  const weekStartStr = getWeekStartDate(weekStart, weekStartDay);
  const weekEndStr = getWeekEndDate(weekStart, weekStartDay);

  const handlePrev = () => {
    onChange(subWeeks(weekStart, 1));
  };

  const handleNext = () => {
    onChange(addWeeks(weekStart, 1));
  };

  const handlePickerChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (date) {
      // 選択日付が属する週の開始日に丸める
      const rounded = parseISO(getWeekStartDate(date, weekStartDay));
      onChange(rounded);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePrev} style={styles.arrowBtn}>
        <Text style={[styles.arrow, { color: c.primary }]}>◀</Text>
      </Pressable>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[
          styles.weekLabel,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <Text style={[styles.weekText, { color: c.text }]}>
          {weekStartStr} ～ {weekEndStr}
        </Text>
      </Pressable>
      <Pressable onPress={handleNext} style={styles.arrowBtn}>
        <Text style={[styles.arrow, { color: c.primary }]}>▶</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={weekStart}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  arrowBtn: { padding: 10 },
  arrow: { fontSize: 16, fontWeight: "bold" },
  weekLabel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  weekText: { fontSize: 14, fontWeight: "600" },
});
