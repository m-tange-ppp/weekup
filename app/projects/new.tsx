/**
 * プロジェクト作成画面。
 */

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SaveFooter } from "@/components/ui/save-footer";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProjects } from "@/hooks/use-projects";

export default function NewProjectScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { create } = useProjects();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("プロジェクト名を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const targetDateStr = targetDate
        ? targetDate.toISOString().slice(0, 10)
        : null;
      await create({
        name: name.trim(),
        description: description.trim() || undefined,
        progress,
        targetDate: targetDateStr,
      });
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selected) setTargetDate(selected);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: c.textSecondary }]}>
          プロジェクト名
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: error ? c.danger : c.border,
              color: c.text,
            },
          ]}
          placeholder="プロジェクト名を入力..."
          placeholderTextColor={c.textSecondary}
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
          autoFocus
        />
        {error ? (
          <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
        ) : null}

        <Text style={[styles.label, { color: c.textSecondary, marginTop: 20 }]}>
          説明（任意）
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              color: c.text,
              minHeight: 80,
            },
          ]}
          placeholder="プロジェクトの概要..."
          placeholderTextColor={c.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: c.textSecondary, marginTop: 20 }]}>
          進捗率: {progress}%
        </Text>
        <View style={[styles.progressBg, { backgroundColor: c.border }]}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: c.primary,
                width: `${progress}%` as `${number}%`,
              },
            ]}
          />
        </View>
        <View style={styles.progressBtns}>
          {[0, 10, 25, 50, 75, 90, 100].map((v) => (
            <Pressable
              key={v}
              style={[
                styles.pBtn,
                {
                  backgroundColor: progress === v ? c.primary : c.card,
                  borderColor: progress === v ? c.primary : c.border,
                },
              ]}
              onPress={() => setProgress(v)}
            >
              <Text
                style={{
                  color: progress === v ? c.primaryText : c.text,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {v}%
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 達成予定日 */}
        <Text style={[styles.label, { color: c.textSecondary, marginTop: 20 }]}>
          達成予定日（任意）
        </Text>
        {Platform.OS === "ios" ? (
          <View
            style={[
              styles.datePickerWrap,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <DateTimePicker
              value={targetDate ?? new Date()}
              mode="date"
              display="compact"
              onChange={onDateChange}
              themeVariant={scheme}
            />
            {targetDate && (
              <Pressable onPress={() => setTargetDate(null)}>
                <Text style={[styles.clearText, { color: c.danger }]}>
                  クリア
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.androidDateRow}>
            <Pressable
              style={[
                styles.dateBtn,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[
                  styles.dateBtnText,
                  { color: targetDate ? c.text : c.textSecondary },
                ]}
              >
                {targetDate
                  ? targetDate.toISOString().slice(0, 10)
                  : "日付を選択..."}
              </Text>
            </Pressable>
            {targetDate && (
              <Pressable onPress={() => setTargetDate(null)}>
                <Text style={[styles.clearText, { color: c.danger }]}>
                  クリア
                </Text>
              </Pressable>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={targetDate ?? new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>
        )}
      </ScrollView>

      <SaveFooter onPress={handleSave} saving={saving} label="作成" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlignVertical: "top",
  },
  errorText: { fontSize: 13, marginTop: 6 },
  progressBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: { height: 8, borderRadius: 4 },
  progressBtns: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  // 日付ピッカー
  datePickerWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  androidDateRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateBtnText: { fontSize: 15 },
  clearText: { fontSize: 13, fontWeight: "600" },
});
