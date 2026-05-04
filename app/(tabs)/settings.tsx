/**
 * 設定画面。
 * 週の始まり曜日・リマインド時刻・通知ON/OFFを設定する。
 */

import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettings } from "@/hooks/use-settings";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

/** HH:MM を ±30分刻みで次の時刻に変換するヘルパー */
function adjustTime(current: string, deltaMinutes: number): string {
  const [h, m] = current.split(":").map(Number);
  const totalMins = h * 60 + m + deltaMinutes;
  const wrapped = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
  const newH = Math.floor(wrapped / 60);
  const newM = wrapped % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { settings, loading, updateSettings } = useSettings();

  if (loading) {
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
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>設定</Text>
      </View>

      {/* 週の始まり */}
      <Section title="週の始まり" color={c}>
        <View style={styles.dayRow}>
          {DAY_LABELS.map((label, i) => (
            <Pressable
              key={i}
              style={[
                styles.dayBtn,
                {
                  backgroundColor:
                    settings.weekStartDay === i ? c.primary : c.card,
                  borderColor:
                    settings.weekStartDay === i ? c.primary : c.border,
                },
              ]}
              onPress={() => updateSettings({ weekStartDay: i })}
            >
              <Text
                style={[
                  styles.dayBtnText,
                  {
                    color: settings.weekStartDay === i ? c.primaryText : c.text,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* 通知設定 */}
      <Section title="通知" color={c}>
        <View style={[styles.row, { borderBottomColor: c.border }]}>
          <Text style={[styles.rowLabel, { color: c.text }]}>
            通知を有効にする
          </Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor={
              Platform.OS === "android"
                ? settings.notificationsEnabled
                  ? c.primary
                  : c.border
                : undefined
            }
          />
        </View>
      </Section>

      {/* リマインド時刻 */}
      <Section title="リマインド時刻" color={c}>
        <TimeRow
          label="週始め前日（目標作成リマインド）"
          time={settings.weekStartReminderTime}
          disabled={!settings.notificationsEnabled}
          scheme={scheme}
          onDecrease={() =>
            updateSettings({
              weekStartReminderTime: adjustTime(
                settings.weekStartReminderTime,
                -30,
              ),
            })
          }
          onIncrease={() =>
            updateSettings({
              weekStartReminderTime: adjustTime(
                settings.weekStartReminderTime,
                30,
              ),
            })
          }
        />
        <TimeRow
          label="朝の確認"
          time={settings.morningReminderTime}
          disabled={!settings.notificationsEnabled}
          scheme={scheme}
          onDecrease={() =>
            updateSettings({
              morningReminderTime: adjustTime(
                settings.morningReminderTime,
                -30,
              ),
            })
          }
          onIncrease={() =>
            updateSettings({
              morningReminderTime: adjustTime(settings.morningReminderTime, 30),
            })
          }
        />
        <TimeRow
          label="夜の振り返り"
          time={settings.eveningReminderTime}
          disabled={!settings.notificationsEnabled}
          scheme={scheme}
          onDecrease={() =>
            updateSettings({
              eveningReminderTime: adjustTime(
                settings.eveningReminderTime,
                -30,
              ),
            })
          }
          onIncrease={() =>
            updateSettings({
              eveningReminderTime: adjustTime(settings.eveningReminderTime, 30),
            })
          }
        />
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: typeof Colors.light;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: color.textSecondary }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: color.card, borderColor: color.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function TimeRow({
  label,
  time,
  disabled,
  scheme,
  onDecrease,
  onIncrease,
}: {
  label: string;
  time: string;
  disabled: boolean;
  scheme: "light" | "dark";
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const c = Colors[scheme];
  return (
    <View style={[styles.timeRow, { borderBottomColor: c.border }]}>
      <Text
        style={[
          styles.timeLabel,
          { color: disabled ? c.textSecondary : c.text },
        ]}
      >
        {label}
      </Text>
      <View style={styles.timeControl}>
        <Pressable
          style={[
            styles.timeBtn,
            { backgroundColor: disabled ? c.border : c.surface },
          ]}
          onPress={onDecrease}
          disabled={disabled}
        >
          <Text
            style={[
              styles.timeBtnText,
              { color: disabled ? c.border : c.text },
            ]}
          >
            −
          </Text>
        </Pressable>
        <Text
          style={[
            styles.timeValue,
            { color: disabled ? c.textSecondary : c.text },
          ]}
        >
          {time}
        </Text>
        <Pressable
          style={[
            styles.timeBtn,
            { backgroundColor: disabled ? c.border : c.surface },
          ]}
          onPress={onIncrease}
          disabled={disabled}
        >
          <Text
            style={[
              styles.timeBtnText,
              { color: disabled ? c.border : c.text },
            ]}
          >
            ＋
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { paddingBottom: 100 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 15 },
  dayRow: {
    flexDirection: "row",
    padding: 12,
    gap: 6,
    justifyContent: "center",
  },
  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnText: { fontSize: 14, fontWeight: "600" },
  timeRow: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  timeLabel: { fontSize: 14, marginBottom: 4 },
  timeControl: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  timeBtnText: { fontSize: 20, lineHeight: 24 },
  timeValue: {
    fontSize: 18,
    fontWeight: "600",
    minWidth: 56,
    textAlign: "center",
  },
});
