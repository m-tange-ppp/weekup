# 設計書: デバッグ機能の削除

## アーキテクチャ上の変更方針

本課題は UI 層（`app/(tabs)/calendar.tsx`）に限定した削除作業であり、DDD のドメイン層・インフラ層・サービス層への影響はない。
カレンダー画面コンポーネントから「デバッグパネル」に紐づく import・ステート・ハンドラー・JSX・スタイルをすべて除去する。

---

## ファイル別変更計画

### 変更

| ファイルパス              | 変更箇所       | 変更内容                                                  |
| ------------------------- | -------------- | --------------------------------------------------------- |
| `app/(tabs)/calendar.tsx` | 9〜11行目      | `DateTimePicker` / `DateTimePickerEvent` の import を削除 |
| `app/(tabs)/calendar.tsx` | 20行目         | `Platform,` を React Native import から削除               |
| `app/(tabs)/calendar.tsx` | 68〜71行目     | デバッグパネル用ステート変数 3 件とコメントを削除         |
| `app/(tabs)/calendar.tsx` | 約196〜205行目 | `onDebugDateChange` useCallback ハンドラーを削除          |
| `app/(tabs)/calendar.tsx` | 約319〜418行目 | `{/* デバッグパネル */}` View ブロック全体を削除          |
| `app/(tabs)/calendar.tsx` | 約575〜596行目 | StyleSheet のデバッグ関連スタイル 9 件を削除              |

### 新規作成

なし。

---

## 削除するコードの具体的な内容

### 1. Import 削除（9〜11行目）

```typescript
// 削除対象
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
```

### 2. `Platform` を React Native import から除去（15〜26行目のブロック内）

```typescript
// 変更前
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Platform, // ← この1行を削除
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
```

```typescript
// 変更後
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
```

### 3. ステート変数の削除（68〜71行目）

```typescript
// 削除対象（コメント含む4行）
// デバッグパネル
const [debugOpen, setDebugOpen] = useState(false);
const [debugDate, setDebugDate] = useState(today);
const [showDebugDatePicker, setShowDebugDatePicker] = useState(false);
```

### 4. ハンドラーの削除（約196〜205行目）

```typescript
// 削除対象
/** デバッグ日付ピッカーのコールバック */
const onDebugDateChange = useCallback(
  (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDebugDatePicker(false);
    if (selected) setDebugDate(format(selected, "yyyy-MM-dd"));
  },
  [],
);
```

### 5. デバッグパネル JSX の削除（約319〜418行目）

```tsx
// 削除対象（{/* デバッグパネル */} ブロック全体）
{
  /* デバッグパネル */
}
<View style={[styles.debugWrap, { borderTopColor: c.border }]}>
  <Pressable style={styles.debugToggle} onPress={() => setDebugOpen((v) => !v)}>
    <Text style={[styles.debugToggleText, { color: c.textSecondary }]}>
      {debugOpen ? "▲ デバッグ" : "▼ デバッグ"}
    </Text>
  </Pressable>
  {debugOpen && (
    <View
      style={[
        styles.debugBody,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      ... (DateTimePicker・debugBtnRow を含む全内容)
    </View>
  )}
</View>;
```

### 6. StyleSheet スタイルの削除（約575〜596行目）

```typescript
// 削除対象（// デバッグ コメントとスタイル9件）
  // デバッグ
  debugWrap: { borderTopWidth: StyleSheet.hairlineWidth },
  debugToggle: { paddingHorizontal: 20, paddingVertical: 8 },
  debugToggleText: { fontSize: 12, fontWeight: "600" },
  debugBody: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  debugLabel: { fontSize: 11, marginBottom: 4 },
  debugDateBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  debugDateBtnText: { fontSize: 14 },
  debugBtnRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  debugBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  debugBtnText: { fontSize: 12, fontWeight: "600" },
```

---

## インターフェース定義

本課題は削除のみであり、新規の型・関数シグネチャの追加はない。

---

## 影響範囲の確認

| 対象                         | 影響                           |
| ---------------------------- | ------------------------------ |
| `app/(tabs)/calendar.tsx`    | 変更あり（デバッグコード削除） |
| `domain/` 以下すべて         | 変更なし                       |
| `infrastructure/` 以下すべて | 変更なし                       |
| `hooks/` 以下すべて          | 変更なし                       |
| `services/` 以下すべて       | 変更なし                       |
| `components/` 以下すべて     | 変更なし                       |
| 他の `app/` 画面             | 変更なし                       |

デバッグパネルのロジック（`router.push` による画面遷移）は、追加ボタン群（`+ 週目標` / `+ 日記` / `+ KPT`）と重複しているため、削除しても正規機能に影響しない。

---

## 変更しないもの（除外理由）

- `app/(tabs)/calendar.tsx` の追加ボタン群 JSX: 正規機能のため変更対象外
- `app/(tabs)/calendar.tsx` の日付詳細パネル（底面スライドパネル）: 正規機能のため変更対象外
- `@react-native-community/datetimepicker` パッケージ本体: `package.json` から除去しない（他画面で使用している可能性があるため別途確認）

---

## 実装時の注意事項

1. **削除順序**: import → ステート → ハンドラー → JSX → スタイルの順に削除すると、途中でコンパイルエラーが累積しにくい。最終的に一括で保存・確認するのが最も安全。

2. **`Platform` import の確認**: `Platform` はデバッグパネルの `Platform.OS === "android"` 判定でのみ使用されている。ファイル内で他に `Platform` を使用している箇所がないことを確認してから import を削除する。

3. **`parseISO` import の確認**: `parseISO` はデバッグパネルの `DateTimePicker` の `value={parseISO(debugDate)}` でも使用しているが、`loadDayData` 内の `getWeekStartDate(parseISO(dateString), ...)` でも使用されているため、**削除しない**。

4. **`getWeekEndDate` import の確認**: `getWeekEndDate` はデバッグパネルの週目標作成ボタンと、追加ボタン群の `+ 週目標` ボタンの両方で使用されている。追加ボタン群側で引き続き使用されているため、**削除しない**。

5. **TypeScript コンパイル確認**: 削除後に `npx expo start` を実行し、TypeScript エラーが出ないことを確認する。

6. **ESLint 確認**: 未使用 import が残っていないかを ESLint で確認する（`debugOpen`・`debugDate`・`showDebugDatePicker` を参照していたスタイルキー `debugWrap` 等も同時に除去されていることを確認）。
