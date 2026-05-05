/**
 * 週目標編集・削除画面。
 * URL パラメータ: id（週目標ID）
 */

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SaveFooter } from "@/components/ui/save-footer";
import { Colors } from "@/constants/theme";
import { WeeklyGoal } from "@/domain/models";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useProjects } from "@/hooks/use-projects";
import {
  deleteWeeklyGoal,
  findWeeklyGoalById,
  updateWeeklyGoal,
} from "@/infrastructure/repositories/WeeklyGoalRepository";

export default function EditGoalScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const { projects } = useProjects();

  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !id) return;
    (async () => {
      const g = await findWeeklyGoalById(db, Number(id));
      if (g) {
        setGoal(g);
        setDescription(g.description);
        setSelectedProjectId(g.projectId);
      }
      setLoading(false);
    })();
  }, [db, id]);

  const handleSave = async () => {
    if (!db || !id) return;
    if (!description.trim()) {
      setError("目標を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateWeeklyGoal(db, Number(id), {
        description: description.trim(),
        projectId: selectedProjectId,
      });
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "削除の確認",
      "この週目標を削除しますか？関連する日記・KPTも削除されます。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            if (!db || !id) return;
            await deleteWeeklyGoal(db, Number(id));
            router.back();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

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

        {/* 削除ボタン */}
        <Pressable
          style={[styles.deleteBtn, { borderColor: c.danger }]}
          onPress={handleDelete}
        >
          <Text style={[styles.deleteBtnText, { color: c.danger }]}>
            この週目標を削除
          </Text>
        </Pressable>
      </ScrollView>

      <SaveFooter onPress={handleSave} saving={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  deleteBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 32,
  },
  deleteBtnText: { fontSize: 15, fontWeight: "600" },
});
