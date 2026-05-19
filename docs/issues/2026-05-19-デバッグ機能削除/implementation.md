# 実装サマリー: デバッグ機能の削除

## 変更ファイル

| ファイル                  | 変更内容                                                                   |
| ------------------------- | -------------------------------------------------------------------------- |
| `app/(tabs)/calendar.tsx` | デバッグパネルに関連する import・ステート・ハンドラー・JSX・スタイルを削除 |
| `NOTES.md`                | `### OPEN` から `デバッグ機能の削除` を削除し、`### CLOSE` 冒頭に移動      |

## 削除した項目

| 種別       | 削除内容                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| import     | `DateTimePicker`・`DateTimePickerEvent`（`@react-native-community/datetimepicker`）                                                                                       |
| import     | `Platform`（React Native import から除去）                                                                                                                                |
| ステート   | `debugOpen`・`debugDate`・`showDebugDatePicker`（コメント行含む）                                                                                                         |
| ハンドラー | `onDebugDateChange` useCallback（コメント含む）                                                                                                                           |
| JSX        | `{/* デバッグパネル */}` View ブロック全体                                                                                                                                |
| スタイル   | `debugWrap`・`debugToggle`・`debugToggleText`・`debugBody`・`debugLabel`・`debugDateBtn`・`debugDateBtnText`・`debugBtnRow`・`debugBtn`・`debugBtnText`（コメント行含む） |

## 実装上の判断・注意点

- `parseISO` は `loadDayData` 内で引き続き使用されるため削除しなかった
- `getWeekEndDate` は `+ 週目標` ボタンで引き続き使用されるため削除しなかった
- TypeScript・ESLint エラーなし（`get_errors` で確認済み）
