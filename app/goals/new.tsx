/**
 * 週目標作成画面。
 * URL パラメータ: weekStartDate, weekEndDate, projectId（任意）
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
import { useKPTRecords } from "@/hooks/use-kpt-records";
import { useProjects } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import { useWeeklyGoals } from "@/hooks/use-weekly-goals";
import { getLastWeekRange } from "@/services/WeekService";

export default function NewGoalScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { weekStartDate, weekEndDate } = useLocalSearchParams<{
    weekStartDate: string;
    weekEndDate: string;
  }>();
  const { settings } = useSettings();
  const { create } = useWeeklyGoals(weekStartDate);
  const { projects } = useProjects();
  const { findByWeek } = useKPTRecords();
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWeekKPTs, setLastWeekKPTs] = useState<
    { keep: string; problem: string; try: string }[]
  >([]);
  const [kptExpanded, setKptExpanded] = useState(false);

  /** 先週のKPTを読み込む */
  const loadLastWeekKPT = async () => {
    if (kptExpanded) {
      setKptExpanded(false);
      return;
    }
    const { weekStartDate: lastStart } = getLastWeekRange(
      settings.weekStartDay,
    );
    const kpts = await findByWeek(lastStart);
    setLastWeekKPTs(kpts);
    setKptExpanded(true);
  };

  const handleSave = async () => {
    if (!description.trim()) {
      setError("目標を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await create({
        description: description.trim(),
        weekStartDate: weekStartDate!,
        weekEndDate: weekEndDate!,
        projectId: selectedProjectId ?? undefined,
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
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: error ? c.danger : c.border,
              color: c.text,
            },
          ]}
          placeholder="今週の目標を入力..."
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

        {/* プロジェクト選択 */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              プロジェクト（任意）
            </Text>
            <View style={styles.projectRow}>
              <Pressable
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      selectedProjectId === null ? c.primary : c.card,
                    borderColor:
                      selectedProjectId === null ? c.primary : c.border,
                  },
                ]}
                onPress={() => setSelectedProjectId(null)}
              >
                <Text
                  style={{
                    color: selectedProjectId === null ? c.primaryText : c.text,
                    fontSize: 13,
                  }}
                >
                  なし
                </Text>
              </Pressable>
              {projects.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        selectedProjectId === p.id ? c.primary : c.card,
                      borderColor:
                        selectedProjectId === p.id ? c.primary : c.border,
                    },
                  ]}
                  onPress={() => setSelectedProjectId(p.id)}
                >
                  <Text
                    style={{
                      color:
                        selectedProjectId === p.id ? c.primaryText : c.text,
                      fontSize: 13,
                    }}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 先週のKPT参照 */}
        <Pressable
          style={[styles.kptToggle, { borderColor: c.border }]}
          onPress={loadLastWeekKPT}
        >
          <Text style={[styles.kptToggleText, { color: c.primary }]}>
            {kptExpanded ? "▲ 先週のKPTを閉じる" : "▼ 先週のKPTを参照する"}
          </Text>
        </Pressable>
        {kptExpanded && (
          <View
            style={[
              styles.kptArea,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            {lastWeekKPTs.length === 0 ? (
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                先週のKPT記録はありません
              </Text>
            ) : (
              lastWeekKPTs.map((k, i) => (
                <View key={i} style={{ marginBottom: 10 }}>
                  {k.keep ? (
                    <Text style={{ color: c.text, fontSize: 13 }}>
                      K: {k.keep}
                    </Text>
                  ) : null}
                  {k.problem ? (
                    <Text style={{ color: c.text, fontSize: 13 }}>
                      P: {k.problem}
                    </Text>
                  ) : null}
                  {k.try ? (
                    <Text style={{ color: c.text, fontSize: 13 }}>
                      T: {k.try}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <SaveFooter onPress={handleSave} saving={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
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
  projectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
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
});
