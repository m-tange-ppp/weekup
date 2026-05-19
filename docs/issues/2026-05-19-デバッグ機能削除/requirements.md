# 要件定義: デバッグ機能の削除

## 背景・目的

`app/(tabs)/calendar.tsx` に「デバッグ用一時機能」として任意の日付を指定して週目標・日記・KPT を作成できるデバッグパネルが実装されている。
本機能は開発中の動作確認用として追加されたものであり、本番リリースに向けてコードから完全に削除する。
残留すると不要なUIが露出し続け、コードの保守性も低下するため、早期に整理する。

## 対象ファイル（影響範囲）

- `app/(tabs)/calendar.tsx`: デバッグパネルの状態変数・ハンドラー・JSX・スタイルを削除し、不要になった import も除去する

## 機能要件

- [ ] カレンダー画面の「▼ デバッグ」トグルボタンおよびその展開コンテンツを画面から削除する
- [ ] 削除後も既存の追加ボタン群（`+ 週目標` / `+ 日記` / `+ KPT`）は引き続き正常に動作すること
- [ ] 削除後もカレンダーの日付詳細パネル（底面スライドパネル）は引き続き正常に動作すること

## 非機能要件

- 削除後に不使用となる import（`DateTimePicker`・`DateTimePickerEvent`・`Platform`）を除去し、不要な依存を残さない
- TypeScript のコンパイルエラーが発生しないこと
- ESLint エラーが発生しないこと

## 受け入れ条件

- [ ] カレンダー画面に「▼ デバッグ」（または「▲ デバッグ」）トグルボタンが表示されない
- [ ] 以下のステート変数が `CalendarScreen` から削除されている
  - `debugOpen`
  - `debugDate`
  - `showDebugDatePicker`
- [ ] `onDebugDateChange` ハンドラーが削除されている
- [ ] デバッグパネルの JSX（`{/* デバッグパネル */}` ブロック）が削除されている
- [ ] 以下のスタイル定義が `StyleSheet.create` から削除されている
  - `debugWrap`, `debugToggle`, `debugToggleText`, `debugBody`
  - `debugLabel`, `debugDateBtn`, `debugDateBtnText`
  - `debugBtnRow`, `debugBtn`, `debugBtnText`
- [ ] `DateTimePicker` / `DateTimePickerEvent` / `Platform` の import が削除されている
- [ ] `npx expo start` で TypeScript コンパイルエラーが発生しない

## 除外スコープ

- 追加ボタン群（`+ 週目標` / `+ 日記` / `+ KPT`）のUI・ロジック変更
- カレンダーの日付詳細パネルの変更
- その他の画面・コンポーネントへの変更
