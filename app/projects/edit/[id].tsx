/**
 * プロジェクト編集モーダル。
 * URL パラメータ: id（プロジェクトID）
 * targetDate（日付ピッカー）・isCompleted（完了フラグ）に対応。
 */

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";
import { useProjects } from "@/hooks/use-projects";
import { findProjectById } from "@/infrastructure/repositories/ProjectRepository";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditProjectScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const { update } = useProjects();
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !id) return;
    (async () => {
      const p = await findProjectById(db, Number(id));
      if (p) {
        setName(p.name);
        setDescription(p.description ?? "");
        setProgress(p.progress);
        setTargetDate(p.targetDate ? new Date(p.targetDate) : null);
        setIsCompleted(p.isCompleted);
      }
      setLoading(false);
    })();
  }, [db, id]);

  const handleSave = async () => {
    if (!id) return;
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
      await update(Number(id), {
        name: name.trim(),
        description: description.trim() || null,
        progress,
        targetDate: targetDateStr,
        isCompleted,
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const footerPb = keyboardVisible ? 8 : Math.max(insets.bottom + 16, 34);

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
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
          placeholder="プロジェクト名..."
          placeholderTextColor={c.textSecondary}
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
          value={description}
          onChangeText={setDescription}
          placeholder="プロジェクトの概要..."
          placeholderTextColor={c.textSecondary}
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
                backgroundColor: progress >= 100 ? c.success : c.primary,
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

        {/* 完了済みフラグ */}
        <View
          style={[
            styles.switchRow,
            { borderColor: c.border, backgroundColor: c.card },
          ]}
        >
          <Text style={[styles.switchLabel, { color: c.text }]}>完了済み</Text>
          <Switch
            value={isCompleted}
            onValueChange={setIsCompleted}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={isCompleted ? c.primaryText : c.card}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: keyboardHeight,
            backgroundColor: c.background,
            borderTopColor: c.border,
            paddingBottom: footerPb,
          },
        ]}
      >
        <Pressable
          style={[
            styles.saveBtn,
            { backgroundColor: saving ? c.border : c.primary },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={c.primaryText} />
          ) : (
            <Text style={[styles.saveBtnText, { color: c.primaryText }]}>
              保存
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  // 完了フラグ
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 20,
  },
  switchLabel: { fontSize: 16 },
  // フッター
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
