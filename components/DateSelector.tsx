/**
 * 日付選択コンポーネント。
 * タップで DatePicker を開き、任意の日付を選択できる。
 */

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface DateSelectorProps {
  /** 選択中の日付 */
  date: Date;
  /** 日付が変更されたときのコールバック */
  onChange: (date: Date) => void;
}

export function DateSelector({ date, onChange }: DateSelectorProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const [showPicker, setShowPicker] = useState(false);

  const handlePickerChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (selected) {
      onChange(selected);
    }
  };

  const label = format(date, "yyyy/MM/dd (eee)", { locale: ja });

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[
          styles.btn,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        <Text style={[styles.hint, { color: c.textSecondary }]}>
          タップして変更
        </Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  btn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 15, fontWeight: "600" },
  hint: { fontSize: 12 },
});
