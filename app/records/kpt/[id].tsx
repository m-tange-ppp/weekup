/**
 * KPT編集・削除画面。
 * URL パラメータ: id（KPTレコードID）
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
import { KPTRecord } from "@/domain/models";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import {
  deleteKPTRecord,
  findKPTRecordById,
  updateKPTRecord,
} from "@/infrastructure/repositories/KPTRecordRepository";

export default function EditKPTScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();

  const [record, setRecord] = useState<KPTRecord | null>(null);
  const [keep, setKeep] = useState("");
  const [problem, setProblem] = useState("");
  const [tryText, setTryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !id) return;
    (async () => {
      const r = await findKPTRecordById(db, Number(id));
      if (r) {
        setRecord(r);
        setKeep(r.keep);
        setProblem(r.problem);
        setTryText(r.try);
      }
      setLoading(false);
    })();
  }, [db, id]);

  const handleSave = async () => {
    if (!db || !id) return;
    setSaving(true);
    setError(null);
    try {
      await updateKPTRecord(db, Number(id), {
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

  const handleDelete = () => {
    Alert.alert("削除の確認", "このKPT記録を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          if (!db || !id) return;
          await deleteKPTRecord(db, Number(id));
          router.back();
        },
      },
    ]);
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
        {error ? (
          <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
        ) : null}

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
            placeholder="継続したいこと..."
            placeholderTextColor={c.textSecondary}
            value={keep}
            onChangeText={setKeep}
            multiline
          />
        </View>

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
            placeholder="問題点..."
            placeholderTextColor={c.textSecondary}
            value={problem}
            onChangeText={setProblem}
            multiline
          />
        </View>

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

        <Pressable
          style={[styles.deleteBtn, { borderColor: c.danger }]}
          onPress={handleDelete}
        >
          <Text style={[styles.deleteBtnText, { color: c.danger }]}>
            このKPTを削除
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
  errorText: { fontSize: 13, marginBottom: 12 },
  kptCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  kptLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  kptInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: "top",
  },
  deleteBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  deleteBtnText: { fontSize: 15, fontWeight: "600" },
});
