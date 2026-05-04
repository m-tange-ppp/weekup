/**
 * プロジェクト詳細画面。
 * URL パラメータ: id（プロジェクトID）
 * 読み取り専用表示 + 編集ボタンで編集モーダルへ遷移
 */

import { differenceInCalendarDays, parseISO } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { Project, WeeklyGoal } from "@/domain/models";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useWeeklyGoals } from "@/hooks/use-weekly-goals";
import {
  deleteProject,
  findProjectById,
} from "@/infrastructure/repositories/ProjectRepository";
import { getTodayString } from "@/services/WeekService";

export default function ProjectDetailScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const { findByProject } = useWeeklyGoals();

  const [project, setProject] = useState<Project | null>(null);
  const [relatedGoals, setRelatedGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !id) return;
    (async () => {
      const p = await findProjectById(db, Number(id));
      setProject(p);
      const goals = await findByProject(Number(id));
      setRelatedGoals(goals);
      setLoading(false);
    })();
  }, [db, id, findByProject]);

  const handleDelete = () => {
    Alert.alert("削除の確認", "このプロジェクトを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          if (!db || !id) return;
          await deleteProject(db, Number(id));
          router.back();
        },
      },
    ]);
  };

  if (loading || !project) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const today = getTodayString();
  const progressColor = project.isCompleted
    ? c.textSecondary
    : project.progress >= 100
      ? c.success
      : c.primary;

  let remainingText: string | null = null;
  if (project.targetDate) {
    const diff = differenceInCalendarDays(
      parseISO(project.targetDate),
      parseISO(today),
    );
    if (diff > 0) remainingText = `残り${diff}日`;
    else if (diff === 0) remainingText = "本日が期限";
    else remainingText = `${Math.abs(diff)}日超過`;
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.container}
    >
      {/* プロジェクト名 */}
      <View style={styles.nameRow}>
        <Text
          style={[
            styles.projectName,
            { color: project.isCompleted ? c.textSecondary : c.text },
            project.isCompleted && styles.strikeThrough,
          ]}
        >
          {project.name}
        </Text>
        {project.isCompleted && (
          <Text style={[styles.completedBadge, { color: c.textSecondary }]}>
            ✓ 完了
          </Text>
        )}
      </View>

      {/* 説明 */}
      {project.description ? (
        <Text style={[styles.description, { color: c.textSecondary }]}>
          {project.description}
        </Text>
      ) : null}

      {/* 進捗率 */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: c.textSecondary }]}>進捗率</Text>
        <Text style={[styles.progressValue, { color: c.text }]}>
          {project.progress}%
        </Text>
        <View style={[styles.progressBg, { backgroundColor: c.border }]}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: progressColor,
                width: `${Math.min(project.progress, 100)}%` as `${number}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* 達成予定日 */}
      {project.targetDate ? (
        <View style={styles.section}>
          <Text style={[styles.label, { color: c.textSecondary }]}>
            達成予定日
          </Text>
          <Text style={[styles.valueText, { color: c.text }]}>
            {project.targetDate}
          </Text>
          {remainingText && (
            <Text
              style={[
                styles.remainingText,
                {
                  color: remainingText.includes("超過")
                    ? c.danger
                    : c.textSecondary,
                },
              ]}
            >
              {remainingText}
            </Text>
          )}
        </View>
      ) : null}

      {/* 編集ボタン */}
      <Pressable
        style={[styles.editBtn, { backgroundColor: c.primary }]}
        onPress={() =>
          router.push({ pathname: "/projects/edit/[id]", params: { id } })
        }
      >
        <Text style={[styles.editBtnText, { color: c.primaryText }]}>編集</Text>
      </Pressable>

      {/* 関連する週目標 */}
      {relatedGoals.length > 0 && (
        <View style={styles.goalsSection}>
          <Text style={[styles.label, { color: c.textSecondary }]}>
            関連する週目標
          </Text>
          {relatedGoals.map((g) => (
            <Pressable
              key={g.id}
              style={[
                styles.goalCard,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
              onPress={() =>
                router.push({ pathname: "/goals/[id]", params: { id: g.id } })
              }
            >
              <Text style={[styles.goalCardText, { color: c.text }]}>
                {g.description}
              </Text>
              <Text style={[styles.goalCardDate, { color: c.textSecondary }]}>
                {g.weekStartDate} 〜
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={[styles.deleteBtn, { borderColor: c.danger }]}
        onPress={handleDelete}
      >
        <Text style={[styles.deleteBtnText, { color: c.danger }]}>
          このプロジェクトを削除
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 60 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  projectName: { fontSize: 24, fontWeight: "700", flex: 1 },
  strikeThrough: { textDecorationLine: "line-through" },
  completedBadge: { fontSize: 13, fontWeight: "600" },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  progressValue: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  progressBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBar: { height: 8, borderRadius: 4 },
  valueText: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  remainingText: { fontSize: 13, fontWeight: "600" },
  editBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  editBtnText: { fontSize: 15, fontWeight: "700" },
  goalsSection: { marginBottom: 24 },
  goalCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 6 },
  goalCardText: { fontSize: 14, lineHeight: 20 },
  goalCardDate: { fontSize: 12, marginTop: 4 },
  deleteBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  deleteBtnText: { fontSize: 15, fontWeight: "600" },
});
