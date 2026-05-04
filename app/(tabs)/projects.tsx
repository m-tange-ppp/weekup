/**
 * プロジェクト一覧画面。
 * プロジェクトの進捗バー付き一覧と、詳細・作成への遷移を提供する。
 * 達成予定日・残り日数・完了済みフラグに対応。
 */

import { useFocusEffect } from "@react-navigation/native";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { Project } from "@/domain/models";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useProjects } from "@/hooks/use-projects";
import { getTodayString } from "@/services/WeekService";

export default function ProjectsScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { initialized } = useDatabase();
  const { projects, loading, reload } = useProjects();

  useFocusEffect(
    useCallback(() => {
      if (initialized) reload();
    }, [initialized, reload]),
  );

  if (!initialized || loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>
          プロジェクト
        </Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push("/projects/new")}
        >
          <Text style={[styles.addBtnText, { color: c.primaryText }]}>
            + 新規
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {projects.length === 0 ? (
          <Pressable
            style={[
              styles.emptyCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => router.push("/projects/new")}
          >
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              プロジェクトを追加して、大きな目標を管理しましょう
            </Text>
          </Pressable>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              scheme={scheme}
              onPress={() =>
                router.push({
                  pathname: "/projects/[id]",
                  params: { id: project.id },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ProjectCard({
  project,
  scheme,
  onPress,
}: {
  project: Project;
  scheme: "light" | "dark";
  onPress: () => void;
}) {
  const c = Colors[scheme];
  const today = getTodayString();
  const progressColor = project.isCompleted
    ? c.textSecondary
    : project.progress >= 100
      ? c.success
      : c.primary;
  const cardBg = project.isCompleted ? c.surface : c.card;
  const nameColor = project.isCompleted ? c.textSecondary : c.text;

  // 残り日数の計算
  let remainingDaysText: string | null = null;
  if (project.targetDate) {
    const diff = differenceInCalendarDays(
      parseISO(project.targetDate),
      parseISO(today),
    );
    if (diff > 0) remainingDaysText = `残り${diff}日`;
    else if (diff === 0) remainingDaysText = "本日が期限";
    else remainingDaysText = `${Math.abs(diff)}日超過`;
  }

  return (
    <Pressable
      style={[styles.card, { backgroundColor: cardBg, borderColor: c.border }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[
            styles.cardName,
            { color: nameColor },
            project.isCompleted && styles.strikeThrough,
          ]}
        >
          {project.name}
        </Text>
        <Text style={[styles.cardProgress, { color: c.textSecondary }]}>
          {project.progress}%
        </Text>
      </View>
      {project.description ? (
        <Text
          style={[styles.cardDesc, { color: c.textSecondary }]}
          numberOfLines={2}
        >
          {project.description}
        </Text>
      ) : null}
      {project.targetDate ? (
        <View style={styles.cardDateRow}>
          <Text style={[styles.cardDateText, { color: c.textSecondary }]}>
            📅 {project.targetDate}
          </Text>
          {remainingDaysText && (
            <Text
              style={[
                styles.cardRemainingText,
                {
                  color: remainingDaysText.includes("超過")
                    ? c.danger
                    : c.textSecondary,
                },
              ]}
            >
              {remainingDaysText}
            </Text>
          )}
        </View>
      ) : null}
      {project.isCompleted && (
        <Text style={[styles.completedBadge, { color: c.textSecondary }]}>
          ✓ 完了
        </Text>
      )}
      {/* 進捗バー */}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  addBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  addBtnText: { fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
  },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardName: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  strikeThrough: { textDecorationLine: "line-through" },
  cardProgress: { fontSize: 14, fontWeight: "600" },
  cardDesc: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardDateText: { fontSize: 12 },
  cardRemainingText: { fontSize: 12, fontWeight: "600" },
  completedBadge: { fontSize: 12, marginBottom: 6 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBar: { height: 6, borderRadius: 3 },
});
