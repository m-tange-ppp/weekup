/**
 * ホーム画面。
 * 今週の週目標・今日の日記・週末のKPTバナーを表示する。
 */

import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
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
import { DailyRecord, KPTRecord, WeeklyGoal } from "@/domain/models";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useSettings } from "@/hooks/use-settings";
import { useWeeklyGoals } from "@/hooks/use-weekly-goals";
import { findDailyRecordsByWeek } from "@/infrastructure/repositories/DailyRecordRepository";
import { findKPTRecordsByWeek } from "@/infrastructure/repositories/KPTRecordRepository";
import {
  getCurrentWeekRange,
  getDaysRemainingInWeek,
  getTodayString,
  isNearWeekEnd,
} from "@/services/WeekService";

const MAX_GOALS = 1;

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { settings } = useSettings();
  const { db, initialized } = useDatabase();
  const today = getTodayString();
  const { weekStartDate, weekEndDate } = getCurrentWeekRange(
    settings.weekStartDay,
  );

  const {
    goals,
    loading: goalsLoading,
    reload: reloadGoals,
  } = useWeeklyGoals(weekStartDate);
  const [weekRecords, setWeekRecords] = useState<DailyRecord[]>([]);
  const [weekKPTs, setWeekKPTs] = useState<KPTRecord[]>([]);

  const loadTodayData = useCallback(async () => {
    if (!db) return;
    const records = await findDailyRecordsByWeek(
      db,
      weekStartDate,
      weekEndDate,
    );
    setWeekRecords(records);
    const kpts = await findKPTRecordsByWeek(db, weekStartDate);
    setWeekKPTs(kpts);
  }, [db, weekStartDate, weekEndDate]);

  useFocusEffect(
    useCallback(() => {
      if (initialized) {
        reloadGoals();
        loadTodayData();
      }
    }, [initialized, loadTodayData, reloadGoals]),
  );

  const nearWeekEnd = isNearWeekEnd(weekEndDate);
  const daysLeft = getDaysRemainingInWeek(weekEndDate);

  if (!initialized || goalsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.container}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>WeekUp</Text>
        <Text style={[styles.headerSub, { color: c.textSecondary }]}>
          {weekStartDate} 〜 {weekEndDate}
        </Text>
      </View>

      {/* 週末KPTバナー */}
      {nearWeekEnd && weekKPTs.length === 0 && (
        <Pressable
          style={[styles.banner, { backgroundColor: c.primary }]}
          onPress={() => {
            if (goals.length === 0) {
              Alert.alert("週目標が未設定", "先に週目標を作成してください");
              return;
            }
            router.push({
              pathname: "/records/kpt/new",
              params: { weeklyGoalId: goals[0].id, weekStartDate },
            });
          }}
        >
          <Text style={[styles.bannerText, { color: c.primaryText }]}>
            今週の振り返り（KPT）を記録しよう — 残り{daysLeft}日
          </Text>
        </Pressable>
      )}

      {/* 週目標セクション */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            今週の目標
          </Text>
          {goals.length < MAX_GOALS && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              onPress={() =>
                router.push({
                  pathname: "/goals/new",
                  params: { weekStartDate, weekEndDate },
                })
              }
            >
              <Text style={[styles.addBtnText, { color: c.primaryText }]}>
                + 追加
              </Text>
            </Pressable>
          )}
        </View>

        {goals.length === 0 ? (
          <Pressable
            style={[
              styles.emptyCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() =>
              router.push({
                pathname: "/goals/new",
                params: { weekStartDate, weekEndDate },
              })
            }
          >
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              今週の目標を立てましょう
            </Text>
          </Pressable>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              scheme={scheme}
              onPress={() =>
                router.push({
                  pathname: "/goals/[id]",
                  params: { id: goal.id },
                })
              }
            />
          ))
        )}
      </View>

      {/* 今週の日記セクション */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            今週の記録
          </Text>
          {goals.length > 0 && (
            <Pressable
              style={[styles.addBtn, { backgroundColor: c.secondary }]}
              onPress={() =>
                router.push({
                  pathname: "/records/daily/new",
                  params: { date: today, weekStartDate },
                })
              }
            >
              <Text style={[styles.addBtnText, { color: "#fff" }]}>+ 記録</Text>
            </Pressable>
          )}
        </View>

        {weekRecords.length === 0 ? (
          <Pressable
            style={[
              styles.emptyCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            onPress={() => {
              if (goals.length === 0) return;
              router.push({
                pathname: "/records/daily/new",
                params: { date: today, weekStartDate },
              });
            }}
          >
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              今日の気づきや行動を記録しましょう
            </Text>
          </Pressable>
        ) : (
          weekRecords.map((record) => (
            <DailyRecordCard
              key={record.id}
              record={record}
              scheme={scheme}
              onPress={() =>
                router.push({
                  pathname: "/records/daily/[id]",
                  params: { id: record.id },
                })
              }
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function GoalCard({
  goal,
  scheme,
  onPress,
}: {
  goal: WeeklyGoal;
  scheme: "light" | "dark";
  onPress: () => void;
}) {
  const c = Colors[scheme];
  return (
    <Pressable
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
    >
      <Text style={[styles.cardText, { color: c.text }]}>
        {goal.description}
      </Text>
    </Pressable>
  );
}

function DailyRecordCard({
  record,
  scheme,
  onPress,
}: {
  record: DailyRecord;
  scheme: "light" | "dark";
  onPress: () => void;
}) {
  const c = Colors[scheme];
  return (
    <Pressable
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
    >
      <Text style={[styles.cardDate, { color: c.textSecondary }]}>
        {record.date}
      </Text>
      <Text style={[styles.cardText, { color: c.text }]}>
        {record.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { paddingBottom: 100 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "700", letterSpacing: 0.5 },
  headerSub: { fontSize: 13, marginTop: 4 },
  banner: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
  },
  bannerText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "600" },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  addBtnText: { fontSize: 13, fontWeight: "600" },
  emptyCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, textAlign: "center" },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  cardDate: { fontSize: 11, marginBottom: 4 },
  cardText: { fontSize: 15, lineHeight: 22 },
});
