/**
 * カレンダー画面。
 * 月次カレンダーで週目標・日記・KPTのある日をマーキング。
 * 日付タップで底面パネルに詳細を表示する。
 * 別の日付をタップするとパネルを閉じずに内容を切り替える。
 * パネルを下スワイプで閉じることができる。
 */

import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format, parseISO } from "date-fns";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { Colors } from "@/constants/theme";
import { DailyRecord, KPTRecord, WeeklyGoal } from "@/domain/models";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useSettings } from "@/hooks/use-settings";
import { findDailyRecordsByDate } from "@/infrastructure/repositories/DailyRecordRepository";
import { findKPTRecordsByWeek } from "@/infrastructure/repositories/KPTRecordRepository";
import { findWeeklyGoalsByWeek } from "@/infrastructure/repositories/WeeklyGoalRepository";
import {
  getTodayString,
  getWeekEndDate,
  getWeekStartDate,
} from "@/services/WeekService";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.24);

export default function CalendarScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { settings } = useSettings();
  const { db, initialized } = useDatabase();
  const today = getTodayString();

  // 表示中の月（前後ボタン押下時のみ変更）
  const [displayMonth, setDisplayMonth] = useState(
    format(new Date(), "yyyy-MM-01"),
  );

  const [markedDates, setMarkedDates] = useState<
    Record<string, { marked?: boolean; selected?: boolean; dotColor?: string }>
  >({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [dayGoals, setDayGoals] = useState<WeeklyGoal[]>([]);
  const [dayRecords, setDayRecords] = useState<DailyRecord[]>([]);
  const [dayKPTs, setDayKPTs] = useState<KPTRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // デバッグパネル
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugDate, setDebugDate] = useState(today);
  const [showDebugDatePicker, setShowDebugDatePicker] = useState(false);

  // パネルアニメーション
  const panelY = useRef(new Animated.Value(PANEL_HEIGHT)).current;

  const openPanel = useCallback(() => {
    setPanelVisible(true);
    Animated.timing(panelY, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [panelY]);

  const closePanel = useCallback(() => {
    Animated.timing(panelY, {
      toValue: PANEL_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      setPanelVisible(false);
      setSelectedDate(null);
    });
  }, [panelY]);

  // スワイプで閉じる PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panelY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 60) {
          Animated.timing(panelY, {
            toValue: PANEL_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setPanelVisible(false);
            setSelectedDate(null);
          });
        } else {
          Animated.timing(panelY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  /** カレンダーのマーキングデータを構築 */
  const buildMarkedDates = useCallback(
    async (year: number, month: number) => {
      if (!db) return;
      const marks: Record<string, { marked?: boolean; dotColor?: string }> = {};

      // その月の週を走査して、記録がある日を取得
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      for (
        let d = new Date(firstDay);
        d <= lastDay;
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = format(d, "yyyy-MM-dd");
        const records = await findDailyRecordsByDate(db, dateStr);
        if (records.length > 0) {
          marks[dateStr] = { marked: true, dotColor: c.secondary };
        }
      }

      // KPTがある週をマーキング
      const weekStartStr = getWeekStartDate(firstDay, settings.weekStartDay);
      const kpts = await findKPTRecordsByWeek(db, weekStartStr);
      if (kpts.length > 0) {
        // KPTがある週のすべての日にマーク（簡易実装）
        marks[weekStartStr] = {
          ...(marks[weekStartStr] ?? {}),
          marked: true,
          dotColor: c.primary,
        };
      }

      setMarkedDates(marks);
    },
    [db, settings.weekStartDay, c.secondary, c.primary],
  );

  useEffect(() => {
    if (initialized) {
      const now = new Date();
      buildMarkedDates(now.getFullYear(), now.getMonth() + 1);
    }
  }, [initialized, buildMarkedDates]);

  const loadDayData = useCallback(
    async (dateString: string) => {
      if (!db) return;
      setLoadingDetail(true);
      try {
        const weekStart = getWeekStartDate(
          parseISO(dateString),
          settings.weekStartDay,
        );
        const [goals, records, kpts] = await Promise.all([
          findWeeklyGoalsByWeek(db, weekStart),
          findDailyRecordsByDate(db, dateString),
          findKPTRecordsByWeek(db, weekStart),
        ]);
        setDayGoals(goals);
        setDayRecords(records);
        setDayKPTs(kpts);
      } finally {
        setLoadingDetail(false);
      }
    },
    [db, settings.weekStartDay],
  );

  /** デバッグ日付ピッカーのコールバック */
  const onDebugDateChange = useCallback(
    (_: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === "android") setShowDebugDatePicker(false);
      if (selected) setDebugDate(format(selected, "yyyy-MM-dd"));
    },
    [],
  );

  const handleDayPress = useCallback(
    async (day: { dateString: string }) => {
      setSelectedDate(day.dateString);
      if (!panelVisible) {
        openPanel();
      }
      await loadDayData(day.dateString);
    },
    [panelVisible, openPanel, loadDayData],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>カレンダー</Text>
      </View>

      <Calendar
        current={displayMonth}
        disableMonthChange={true}
        onDayPress={handleDayPress}
        onMonthChange={(month) => {
          const newMonth = `${month.year}-${String(month.month).padStart(2, "0")}-01`;
          setDisplayMonth(newMonth);
          buildMarkedDates(month.year, month.month);
        }}
        markedDates={{
          ...markedDates,
          [today]: {
            ...(markedDates[today] ?? {}),
            selected: true,
            selectedColor: c.primary,
          },
          ...(selectedDate && selectedDate !== today
            ? {
                [selectedDate]: {
                  ...(markedDates[selectedDate] ?? {}),
                  selected: true,
                  selectedColor: c.secondary,
                },
              }
            : {}),
        }}
        theme={{
          backgroundColor: c.background,
          calendarBackground: c.background,
          textSectionTitleColor: c.textSecondary,
          selectedDayBackgroundColor: c.primary,
          selectedDayTextColor: c.primaryText,
          todayTextColor: c.primary,
          dayTextColor: c.text,
          textDisabledColor: c.border,
          dotColor: c.secondary,
          selectedDotColor: c.primaryText,
          arrowColor: c.primary,
          monthTextColor: c.text,
          indicatorColor: c.primary,
        }}
      />

      {/* 追加ボタン群 */}
      <View style={[styles.addRow, { borderTopColor: c.border }]}>
        <Pressable
          style={[styles.addChip, { backgroundColor: c.primary }]}
          onPress={() => {
            const weekStartDate = getWeekStartDate(
              new Date(),
              settings.weekStartDay,
            );
            const weekEndDate = getWeekEndDate(
              new Date(),
              settings.weekStartDay,
            );
            router.push({
              pathname: "/goals/new",
              params: { weekStartDate, weekEndDate },
            });
          }}
        >
          <Text style={[styles.addChipText, { color: c.primaryText }]}>
            + 週目標
          </Text>
        </Pressable>
        <Pressable
          style={[styles.addChip, { backgroundColor: c.secondary }]}
          onPress={() =>
            router.push({
              pathname: "/records/daily/new",
              params: {
                date: today,
                weekStartDate: getWeekStartDate(
                  new Date(),
                  settings.weekStartDay,
                ),
              },
            })
          }
        >
          <Text style={[styles.addChipText, { color: "#fff" }]}>+ 日記</Text>
        </Pressable>
        <Pressable
          style={[styles.addChip, { backgroundColor: c.warning }]}
          onPress={() =>
            router.push({
              pathname: "/records/kpt/new",
              params: {
                weekStartDate: getWeekStartDate(
                  new Date(),
                  settings.weekStartDay,
                ),
              },
            })
          }
        >
          <Text style={[styles.addChipText, { color: "#fff" }]}>+ KPT</Text>
        </Pressable>
      </View>

      {/* デバッグパネル */}
      <View style={[styles.debugWrap, { borderTopColor: c.border }]}>
        <Pressable
          style={styles.debugToggle}
          onPress={() => setDebugOpen((v) => !v)}
        >
          <Text style={[styles.debugToggleText, { color: c.textSecondary }]}>
            {debugOpen ? "▲ デバッグ" : "▼ デバッグ"}
          </Text>
        </Pressable>
        {debugOpen && (
          <View
            style={[
              styles.debugBody,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.debugLabel, { color: c.textSecondary }]}>
              日付
            </Text>
            {Platform.OS === "ios" ? (
              <DateTimePicker
                value={parseISO(debugDate)}
                mode="date"
                display="compact"
                onChange={onDebugDateChange}
                style={{ marginBottom: 10, alignSelf: "flex-start" }}
              />
            ) : (
              <>
                <Pressable
                  style={[
                    styles.debugDateBtn,
                    { backgroundColor: c.card, borderColor: c.border },
                  ]}
                  onPress={() => setShowDebugDatePicker(true)}
                >
                  <Text style={[styles.debugDateBtnText, { color: c.text }]}>
                    {debugDate}
                  </Text>
                </Pressable>
                {showDebugDatePicker && (
                  <DateTimePicker
                    value={parseISO(debugDate)}
                    mode="date"
                    display="default"
                    onChange={onDebugDateChange}
                  />
                )}
              </>
            )}
            <View style={styles.debugBtnRow}>
              <Pressable
                style={[styles.debugBtn, { backgroundColor: c.primary }]}
                onPress={() => {
                  const d = parseISO(debugDate);
                  const weekStartDate = getWeekStartDate(
                    d,
                    settings.weekStartDay,
                  );
                  const weekEndDate = getWeekEndDate(d, settings.weekStartDay);
                  router.push({
                    pathname: "/goals/new",
                    params: { weekStartDate, weekEndDate },
                  });
                }}
              >
                <Text style={[styles.debugBtnText, { color: c.primaryText }]}>
                  週目標を作成
                </Text>
              </Pressable>
              <Pressable
                style={[styles.debugBtn, { backgroundColor: c.secondary }]}
                onPress={() => {
                  const d = parseISO(debugDate);
                  const weekStartDate = getWeekStartDate(
                    d,
                    settings.weekStartDay,
                  );
                  router.push({
                    pathname: "/records/daily/new",
                    params: { date: debugDate, weekStartDate },
                  });
                }}
              >
                <Text style={[styles.debugBtnText, { color: "#fff" }]}>
                  日記を作成
                </Text>
              </Pressable>
              <Pressable
                style={[styles.debugBtn, { backgroundColor: c.warning }]}
                onPress={() => {
                  const d = parseISO(debugDate);
                  const weekStartDate = getWeekStartDate(
                    d,
                    settings.weekStartDay,
                  );
                  router.push({
                    pathname: "/records/kpt/new",
                    params: { weekStartDate },
                  });
                }}
              >
                <Text style={[styles.debugBtnText, { color: "#fff" }]}>
                  KPTを作成
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* 日付詳細パネル（底面 Animated.View） */}
      <Animated.View
        style={[
          styles.panel,
          { backgroundColor: c.surface, transform: [{ translateY: panelY }] },
          !panelVisible && styles.panelHidden,
        ]}
      >
        {/* ドラッグハンドル */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <Text style={[styles.panelDate, { color: c.text }]}>
            {selectedDate ?? ""}
          </Text>
        </View>

        {loadingDetail ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView
            style={styles.panelScroll}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {dayGoals.length > 0 && (
              <View style={styles.panelSection}>
                <Text
                  style={[styles.panelSectionTitle, { color: c.textSecondary }]}
                >
                  週目標
                </Text>
                {dayGoals.map((g) => (
                  <Pressable
                    key={g.id}
                    style={[
                      styles.panelCard,
                      { backgroundColor: c.card, borderColor: c.border },
                    ]}
                    onPress={() => {
                      closePanel();
                      router.push({
                        pathname: "/goals/[id]",
                        params: { id: g.id },
                      });
                    }}
                  >
                    <Text style={[styles.panelCardText, { color: c.text }]}>
                      {g.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {dayRecords.length > 0 && (
              <View style={styles.panelSection}>
                <Text
                  style={[styles.panelSectionTitle, { color: c.textSecondary }]}
                >
                  日記
                </Text>
                {dayRecords.map((r) => (
                  <Pressable
                    key={r.id}
                    style={[
                      styles.panelCard,
                      { backgroundColor: c.card, borderColor: c.border },
                    ]}
                    onPress={() => {
                      closePanel();
                      router.push({
                        pathname: "/records/daily/[id]",
                        params: { id: r.id },
                      });
                    }}
                  >
                    <Text style={[styles.panelCardText, { color: c.text }]}>
                      {r.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            {dayKPTs.length > 0 && (
              <View style={styles.panelSection}>
                <Text
                  style={[styles.panelSectionTitle, { color: c.textSecondary }]}
                >
                  KPT
                </Text>
                {dayKPTs.map((k) => (
                  <Pressable
                    key={k.id}
                    style={[
                      styles.panelCard,
                      { backgroundColor: c.card, borderColor: c.border },
                    ]}
                    onPress={() => {
                      closePanel();
                      router.push({
                        pathname: "/records/kpt/[id]",
                        params: { id: k.id },
                      });
                    }}
                  >
                    {k.keep ? (
                      <Text style={[styles.panelCardText, { color: c.text }]}>
                        K: {k.keep}
                      </Text>
                    ) : null}
                    {k.problem ? (
                      <Text style={[styles.panelCardText, { color: c.text }]}>
                        P: {k.problem}
                      </Text>
                    ) : null}
                    {k.try ? (
                      <Text style={[styles.panelCardText, { color: c.text }]}>
                        T: {k.try}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            )}
            {dayGoals.length === 0 &&
              dayRecords.length === 0 &&
              dayKPTs.length === 0 && (
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  この日の記録はありません
                </Text>
              )}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  addRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addChipText: { fontSize: 13, fontWeight: "600" },
  // デバッグ
  debugWrap: { borderTopWidth: StyleSheet.hairlineWidth },
  debugToggle: { paddingHorizontal: 20, paddingVertical: 8 },
  debugToggleText: { fontSize: 12, fontWeight: "600" },
  debugBody: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  debugLabel: { fontSize: 11, marginBottom: 4 },
  debugDateBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  debugDateBtnText: { fontSize: 14 },
  debugBtnRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  debugBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  debugBtnText: { fontSize: 12, fontWeight: "600" },
  // 詳細パネル
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 16,
  },
  panelHidden: { display: "none" },
  handleArea: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "center",
  },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: 10 },
  panelDate: { fontSize: 16, fontWeight: "600", alignSelf: "flex-start" },
  panelScroll: { flex: 1, paddingHorizontal: 20 },
  panelSection: { marginBottom: 16 },
  panelSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  panelCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 6 },
  panelCardText: { fontSize: 14, lineHeight: 20 },
  emptyText: { textAlign: "center", fontSize: 14, marginTop: 20 },
});
