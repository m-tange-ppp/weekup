/**
 * アプリ設定を AsyncStorage で管理するフック。
 */

import { AppSettings, DEFAULT_SETTINGS } from "@/domain/models";
import { scheduleAllNotifications } from "@/services/NotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const SETTINGS_KEY = "@weekup/settings";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(SETTINGS_KEY);
        const loaded: AppSettings = json
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(json) }
          : DEFAULT_SETTINGS;
        setSettings(loaded);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      // 通知関連の設定が変わった場合は再スケジューリング
      await scheduleAllNotifications(next);
    },
    [settings],
  );

  return { settings, loading, updateSettings };
}
