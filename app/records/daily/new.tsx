/**
 * 日記作成画面。
 * URL パラメータ: date, weekStartDate
 */

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";
import { useWeeklyGoals } from "@/hooks/use-weekly-goals";
import {
  createDailyRecord,
  findDailyRecordsByDate,
} from "@/infrastructure/repositories/DailyRecordRepository";

export default function NewDailyRecordScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { date, weekStartDate } = useLocalSearchParams<{
    date: string;
    weekStartDate: string;
  }>();
  const { db } = useDatabase();
  const { goals } = useWeeklyGoals(weekStartDate);
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  // その日に既に日記があれば編集画面へリダイレクト
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!db || !date) {
      setChecking(false);
      return;
    }
    (async () => {
      const existing = await findDailyRecordsByDate(db, date);
      if (existing.length > 0) {
        // 既存レコードあり → 編集画面へ差し替え
        router.replace({
          pathname: "/records/daily/[id]",
          params: { id: String(existing[0].id) },
        });
      } else {
        setChecking(false);
      }
    })();
  }, [db, date]);

  const [description, setDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalsExpanded, setGoalsExpanded] = useState(false);

  // チェック中はローディングを表示
  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: c.background,
        }}
      >
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const handleSave = async () => {
    if (!db) return;
    if (!description.trim()) {
      setError("記録内容を入力してください");
      return;
    }
    const goalId = selectedGoalId ?? goals[0]?.id;
    if (!goalId) {
      setError("週目標が必要です。先に週目標を作成してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createDailyRecord(db, {
        weeklyGoalId: goalId,
        description: description.trim(),
        date: date!,
      });
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={styles.container}
      >
        <Text style={[styles.dateLabel, { color: c.textSecondary }]}>
          {date}
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
          placeholder="今日やったこと・気づきを記録..."
          placeholderTextColor={c.textSecondary}
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            setError(null);
          }}
          multiline
          autoFocus
        />
        {error ? (
          <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
        ) : null}

        {/* 週目標選択 */}
        {goals.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              紐づける週目標
            </Text>
            {goals.map((g) => (
              <Pressable
                key={g.id}
                style={[
                  styles.goalOption,
                  {
                    backgroundColor:
                      (selectedGoalId ?? goals[0]?.id) === g.id
                        ? c.surface
                        : c.card,
                    borderColor:
                      (selectedGoalId ?? goals[0]?.id) === g.id
                        ? c.primary
                        : c.border,
                  },
                ]}
                onPress={() => setSelectedGoalId(g.id)}
              >
                <Text style={[styles.goalOptionText, { color: c.text }]}>
                  {g.description}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 週目標参照 */}
        {goals.length > 0 && (
          <Pressable
            style={[styles.kptToggle, { borderColor: c.border }]}
            onPress={() => setGoalsExpanded(!goalsExpanded)}
          >
            <Text style={[styles.kptToggleText, { color: c.primary }]}>
              {goalsExpanded
                ? "▲ 今週の目標を閉じる"
                : "▼ 今週の目標を確認する"}
            </Text>
          </Pressable>
        )}
        {goalsExpanded && (
          <View
            style={[
              styles.kptArea,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            {goals.map((g, i) => (
              <Text
                key={g.id}
                style={{
                  color: c.text,
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 4,
                }}
              >
                {i + 1}. {g.description}
              </Text>
            ))}
          </View>
        )}
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
            paddingBottom: keyboardVisible
              ? 8
              : Math.max(insets.bottom + 16, 34),
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
  container: { padding: 20, paddingBottom: 120 },
  dateLabel: { fontSize: 13, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
    textAlignVertical: "top",
  },
  errorText: { fontSize: 13, marginTop: 6 },
  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  goalOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  goalOptionText: { fontSize: 14, lineHeight: 20 },
  kptToggle: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    alignItems: "center",
    borderStyle: "dashed",
  },
  kptToggleText: { fontSize: 14, fontWeight: "500" },
  kptArea: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 8 },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
