/**
 * モーダル画面共通の保存ボタンフッター。
 * キーボード高さに応じて自動的に浮き上がり、
 * システムナビゲーションバーの高さも考慮する。
 */

import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useKeyboardVisible } from "@/hooks/use-keyboard-visible";

interface SaveFooterProps {
  /** ボタンのラベル（デフォルト: "保存"） */
  label?: string;
  /** 保存ハンドラー */
  onPress: () => void;
  /** 保存中フラグ（trueのときスピナー表示・ボタン無効化） */
  saving?: boolean;
}

export function SaveFooter({
  label = "保存",
  onPress,
  saving = false,
}: SaveFooterProps) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const { keyboardVisible, keyboardHeight } = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  // Android: キーボード上部にクリップボード/マイク等のツールバーが表示される場合があり、
  // そのツールバー高さは keyboardDidShow の endCoordinates.height に含まれない。
  // Gboard 等では概ね 50dp 程度のため、Android 限定で追加オフセットを加算する。
  const androidToolbarOffset =
    Platform.OS === "android" && keyboardVisible ? 44 : 0;

  return (
    <View
      style={[
        styles.footer,
        {
          bottom: keyboardHeight + androidToolbarOffset,
          backgroundColor: c.background,
          borderTopColor: c.border,
          paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom + 16, 34),
        },
      ]}
    >
      <Pressable
        style={[
          styles.saveBtn,
          { backgroundColor: saving ? c.border : c.primary },
        ]}
        onPress={onPress}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={c.primaryText} />
        ) : (
          <Text style={[styles.saveBtnText, { color: c.primaryText }]}>
            {label}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
