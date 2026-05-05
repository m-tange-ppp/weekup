import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DatabaseProvider } from "@/hooks/use-database";
import {
  initNotificationHandler,
  requestNotificationPermission,
} from "@/services/NotificationService";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? "light"];

  // ナビゲーターのテーマ background と card を上書きすることで、
  // モーダル表示・非表示アニメーション中に見えるナビゲーター背景・カード背景の白ちらつきを防ぐ。
  // card はスライドアニメーション中に見える各スクリーンのカード背景色として使われる。
  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.background,
    },
  };
  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.background,
    },
  };

  useEffect(() => {
    // 通知ハンドラーの初期化とパーミッション取得
    initNotificationHandler();
    requestNotificationPermission();
  }, []);

  return (
    <DatabaseProvider>
      <ThemeProvider value={colorScheme === "dark" ? darkTheme : lightTheme}>
        {/* Stack を背景色付き View でラップすることで、スクリーン遷移アニメーション中に
            画面カードの隙間から透けて見える下地の色をアプリの背景色に統一する。 */}
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: c.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="goals/new"
              options={{ presentation: "modal", title: "週目標を作成" }}
            />
            <Stack.Screen
              name="goals/[id]"
              options={{ presentation: "modal", title: "週目標を編集" }}
            />
            <Stack.Screen
              name="records/daily/new"
              options={{ presentation: "modal", title: "日記を記録" }}
            />
            <Stack.Screen
              name="records/daily/[id]"
              options={{ presentation: "modal", title: "日記を編集" }}
            />
            <Stack.Screen
              name="records/kpt/new"
              options={{ presentation: "modal", title: "KPTを記録" }}
            />
            <Stack.Screen
              name="records/kpt/[id]"
              options={{ presentation: "modal", title: "KPTを編集" }}
            />
            <Stack.Screen
              name="projects/new"
              options={{ presentation: "modal", title: "プロジェクトを作成" }}
            />
            <Stack.Screen
              name="projects/[id]"
              options={{ title: "プロジェクト詳細" }}
            />
            <Stack.Screen
              name="projects/edit/[id]"
              options={{ presentation: "modal", title: "プロジェクトを編集" }}
            />
          </Stack>
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </DatabaseProvider>
  );
}
