/**
 * KPT作成画面。
 * URL パラメータ: weeklyGoalId, weekStartDate
 */

import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
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
import { useDailyRecords } from "@/hooks/use-daily-records";
import { useDatabase } from "@/hooks/use-database";
import { useWeeklyGoals } from "@/hooks/use-weekly-goals";
import { createKPTRecord } from "@/infrastructure/repositories/KPTRecordRepository";

export default function NewKPTScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { weeklyGoalId: goalIdParam, weekStartDate } = useLocalSearchParams<{
    weeklyGoalId?: string;
    weekStartDate?: string;
  }>();
  const { db } = useDatabase();
  const { goals } = useWeeklyGoals(weekStartDate);

  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(
    goalIdParam ? Number(goalIdParam) : null,
  );
  const [keep, setKeep] = useState("");
  const [problem, setProblem] = useState("");
  const [tryText, setTryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refExpanded, setRefExpanded] = useState(true);
  const [goalRefExpanded, setGoalRefExpanded] = useState(true);

  const { records: dailyRecords } = useDailyRecords(
    selectedGoalId ?? goals[0]?.id,
  );

  const handleSave = async () => {
    if (!db) return;
    const goalId = selectedGoalId ?? goals[0]?.id;
    if (!goalId) {
      setError("週目標が必要です");
      return;
    }
    if (!keep.trim() && !problem.trim() && !tryText.trim()) {
      setError("Keep・Problem・Try のいずれかを入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createKPTRecord(db, {
        weeklyGoalId: goalId,
        keep: keep.trim(),
        problem: problem.trim(),
        try: tryText.trim(),
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
        {error ? (
          <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
        ) : null}

        {/* Keep */}
        <View
          style={[
            styles.kptCard,
            { backgroundColor: c.keepBg, borderColor: c.secondary },
          ]}
        >
          <Text style={[styles.kptLabel, { color: c.secondary }]}>
            Keep — 続けること
          </Text>
          <TextInput
            style={[styles.kptInput, { color: c.text }]}
            placeholder="良かったこと、継続したいこと..."
            placeholderTextColor={c.textSecondary}
            value={keep}
            onChangeText={setKeep}
            multiline
          />
        </View>

        {/* Problem */}
        <View
          style={[
            styles.kptCard,
            { backgroundColor: c.problemBg, borderColor: c.danger },
          ]}
        >
          <Text style={[styles.kptLabel, { color: c.danger }]}>
            Problem — 課題
          </Text>
          <TextInput
            style={[styles.kptInput, { color: c.text }]}
            placeholder="問題点、改善したいこと..."
            placeholderTextColor={c.textSecondary}
            value={problem}
            onChangeText={setProblem}
            multiline
          />
        </View>

        {/* Try */}
        <View
          style={[
            styles.kptCard,
            { backgroundColor: c.tryBg, borderColor: c.primary },
          ]}
        >
          <Text style={[styles.kptLabel, { color: c.primary }]}>
            Try — 次に試すこと
          </Text>
          <TextInput
            style={[styles.kptInput, { color: c.text }]}
            placeholder="次週に挑戦すること..."
            placeholderTextColor={c.textSecondary}
            value={tryText}
            onChangeText={setTryText}
            multiline
          />
        </View>

        {/* 週目標・日記参照 */}
        {goals[0] && (
          <Pressable
            style={[styles.toggleBtn, { borderColor: c.border }]}
            onPress={() => setRefExpanded(!refExpanded)}
          >
            <Text style={[styles.toggleBtnText, { color: c.primary }]}>
              {refExpanded
                ? "▲ 今週の目標・日記を閉じる"
                : "▼ 今週の目標・日記を確認する"}
            </Text>
          </Pressable>
        )}
        {goals[0] && refExpanded && (
          <>
            <Text
              style={[styles.panelSectionTitle, { color: c.textSecondary }]}
            >
              週目標
            </Text>
            <View
              style={[
                styles.refArea,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Text style={[styles.refText, { color: c.text }]}>
                {goals[0].description}
              </Text>
            </View>
            <Text
              style={[styles.panelSectionTitle, { color: c.textSecondary }]}
            >
              日記
            </Text>
            <View
              style={[
                styles.refArea,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              {dailyRecords.map((r) => (
                <View key={r.id} style={{ marginBottom: 8 }}>
                  <Text style={[styles.refDate, { color: c.textSecondary }]}>
                    {r.date}
                  </Text>
                  <Text style={[styles.refText, { color: c.text }]}>
                    {r.description}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <SaveFooter onPress={handleSave} saving={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120 },
  errorText: { fontSize: 13, marginBottom: 12 },
  section: { marginBottom: 16 },
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
  kptCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  kptLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  kptInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: "top",
  },
  panelSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  toggleBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderStyle: "dashed",
    marginTop: 4,
  },
  toggleBtnText: { fontSize: 14, fontWeight: "500" },
  refArea: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 8 },
  refDate: { fontSize: 12, marginBottom: 2 },
  refText: { fontSize: 14, lineHeight: 20 },
});
