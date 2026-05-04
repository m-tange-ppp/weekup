/**
 * 日記編集・削除画面。
 * URL パラメータ: id（日記ID）
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { DailyRecord } from "@/domain/models";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDatabase } from "@/hooks/use-database";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";
import {
  deleteDailyRecord,
  findDailyRecordById,
  updateDailyRecord,
} from "@/infrastructure/repositories/DailyRecordRepository";

export default function EditDailyRecordScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !id) return;
    (async () => {
      const r = await findDailyRecordById(db, Number(id));
      if (r) {
        setRecord(r);
        setDescription(r.description);
      }
      setLoading(false);
    })();
  }, [db, id]);

  const handleSave = async () => {
    if (!db || !id) return;
    if (!description.trim()) {
      setError("記録内容を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateDailyRecord(db, Number(id), {
        description: description.trim(),
      });
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("削除の確認", "この日記を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          if (!db || !id) return;
          await deleteDailyRecord(db, Number(id));
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
        {record && (
          <Text style={[styles.dateLabel, { color: c.textSecondary }]}>
            {record.date}
          </Text>
        )}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: c.card,
              borderColor: error ? c.danger : c.border,
              color: c.text,
            },
          ]}
          placeholder="今日やったこと・気づき..."
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
        <Pressable
          style={[styles.deleteBtn, { borderColor: c.danger }]}
          onPress={handleDelete}
        >
          <Text style={[styles.deleteBtnText, { color: c.danger }]}>
            この記録を削除
          </Text>
        </Pressable>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  deleteBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 32,
  },
  deleteBtnText: { fontSize: 15, fontWeight: "600" },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
