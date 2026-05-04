/**
 * アプリ全体で使用するカラーテーマ。
 * ライトモードは暖色系アースカラー、ダークモードは落ち着いたダークブラウン系。
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    /** メインテキスト */
    text: "#2C2825",
    /** サブテキスト（説明文など） */
    textSecondary: "#6B6460",
    /** アプリ背景 */
    background: "#F5F0EB",
    /** カード・入力欄の背景 */
    card: "#FDFAF7",
    /** サーフェス（モーダル・シートなど） */
    surface: "#EDE8E1",
    /** ボーダー・区切り線 */
    border: "#D4CECA",
    /** プライマリカラー（ボタン・アクセント） */
    primary: "#8B7355",
    /** プライマリの上に乗るテキスト */
    primaryText: "#FDFAF7",
    /** セカンダリアクセント（ミュートグリーン） */
    secondary: "#7A8C6E",
    /** 成功・完了状態 */
    success: "#6A8F6A",
    /** 警告・注意状態 */
    warning: "#C4934A",
    /** エラー・削除 */
    danger: "#B85C5C",
    /** タブアイコン（非選択） */
    icon: "#A09890",
    tabIconDefault: "#A09890",
    /** タブアイコン（選択中） */
    tabIconSelected: "#8B7355",
    /** Keep カード背景 */
    keepBg: "#EEF3EC",
    /** Problem カード背景 */
    problemBg: "#F5EDEC",
    /** Try カード背景 */
    tryBg: "#EDF0F5",
  },
  dark: {
    text: "#E8E3DC",
    textSecondary: "#9B9590",
    background: "#1C1917",
    card: "#242220",
    surface: "#2A2723",
    border: "#3A3733",
    primary: "#A89070",
    primaryText: "#1C1917",
    secondary: "#8FA382",
    success: "#7A9F7A",
    warning: "#D4A55A",
    danger: "#C87070",
    icon: "#706C68",
    tabIconDefault: "#706C68",
    tabIconSelected: "#A89070",
    keepBg: "#232B22",
    problemBg: "#2B2222",
    tryBg: "#222530",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
