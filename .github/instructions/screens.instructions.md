---
applyTo: "app/**/*.tsx"
---

# 画面構成ガイド

## ルート構造

`app/_layout.tsx` がルートレイアウト。`DatabaseProvider` で全体を包み、`Stack` ナビゲーターを定義する。モーダル画面はすべて `presentation: "modal"` を指定する。

```
app/
  _layout.tsx              # ルートレイアウト (DatabaseProvider, Stack)
  (tabs)/
    _layout.tsx            # タブナビゲーション (4タブ)
    index.tsx              # ホーム
    calendar.tsx           # カレンダー
    projects.tsx           # プロジェクト一覧
    settings.tsx           # 設定
  goals/
    new.tsx                # 週目標作成（モーダル）
    [id].tsx               # 週目標編集・削除（モーダル）
  records/
    daily/
      new.tsx              # 日記作成（モーダル）
      [id].tsx             # 日記編集・削除（モーダル）
    kpt/
      new.tsx              # KPT作成（モーダル）
      [id].tsx             # KPT編集・削除（モーダル）
  projects/
    new.tsx                # プロジェクト作成（モーダル）
    [id].tsx               # プロジェクト詳細（通常画面）
    edit/
      [id].tsx             # プロジェクト編集（モーダル）
```

## タブ画面

| ファイル              | タイトル     | アイコン（SF Symbol） | 主な役割                                                 |
| --------------------- | ------------ | --------------------- | -------------------------------------------------------- |
| `(tabs)/index.tsx`    | ホーム       | `house.fill`          | 今週の週目標・今週の日記一覧・KPTバナー表示              |
| `(tabs)/calendar.tsx` | カレンダー   | `calendar`            | 月次カレンダー＋日付タップで下からスライドするパネル表示 |
| `(tabs)/projects.tsx` | プロジェクト | `folder.fill`         | プロジェクト一覧・進捗バー・達成予定日・完了バッジ       |
| `(tabs)/settings.tsx` | 設定         | `gearshape.fill`      | 週始め曜日・通知・リマインド時刻                         |

## モーダル画面とパラメータ

### 週目標

| ファイル         | Stack タイトル | パラメータ                                          |
| ---------------- | -------------- | --------------------------------------------------- |
| `goals/new.tsx`  | "週目標を作成" | `weekStartDate`, `weekEndDate`, `projectId`（任意） |
| `goals/[id].tsx` | "週目標を編集" | `id`                                                |

`goals/new.tsx` の特記事項:

- 先週のKPT記録を折りたたみ参照欄として表示
- プロジェクトへの紐づけをチップ選択で行う

### 日記

| ファイル                 | Stack タイトル | パラメータ              |
| ------------------------ | -------------- | ----------------------- |
| `records/daily/new.tsx`  | "日記を記録"   | `date`, `weekStartDate` |
| `records/daily/[id].tsx` | "日記を編集"   | `id`                    |

### KPT

| ファイル               | Stack タイトル | パラメータ                              |
| ---------------------- | -------------- | --------------------------------------- |
| `records/kpt/new.tsx`  | "KPTを記録"    | `weeklyGoalId`（任意）, `weekStartDate` |
| `records/kpt/[id].tsx` | "KPTを編集"    | `id`                                    |

KPT画面の特記事項:

- Keep（`keepBg`/`secondary`）・Problem（`problemBg`/`danger`）・Try（`tryBg`/`primary`）の3色カードで入力
- Keep/Problem/Try の TextInput は `minHeight: 80`、`textAlignVertical: 'top'` を設定
- `new.tsx` では週の日記を折りたたみ参照欄として表示

### プロジェクト

| ファイル                 | Stack タイトル       | パラメータ | 備考                           |
| ------------------------ | -------------------- | ---------- | ------------------------------ |
| `projects/new.tsx`       | "プロジェクトを作成" | なし       | targetDate DateTimePicker あり |
| `projects/[id].tsx`      | "プロジェクト詳細"   | `id`       | 読み取り専用詳細画面           |
| `projects/edit/[id].tsx` | "プロジェクトを編集" | `id`       | モーダル・編集フォーム         |

プロジェクト画面の特記事項:

- 進捗率は 0/10/25/50/75/90/100% のプリセットボタンで選択
- **達成予定日**（`targetDate`）は `@react-native-community/datetimepicker` で入力（iOS: compact inline、Android: ボタン→モーダル）
- **完了済みフラグ**（`isCompleted`）は `Switch` コンポーネントで切り替え
- `projects/[id].tsx`（詳細）は読み取り専用。「編集」ボタンで `projects/edit/[id]` へ遷移する
- `projects/[id].tsx` では関連する週目標（`findByProject`）を一覧表示し各目標へ遷移できる
- `projects/[id].tsx` に削除ボタンを配置（編集モーダルには削除ボタンなし）

## 画面実装パターン

### カラーテーマの参照

```tsx
const scheme = useColorScheme() ?? "light";
const c = Colors[scheme];
```

`c.background`, `c.card`, `c.surface`, `c.primary`, `c.primaryText`, `c.textSecondary`, `c.border`, `c.danger`, `c.keepBg`, `c.problemBg`, `c.tryBg` 等を使う。ハードコードした色は使わない。

### 削除の確認

削除ボタンには必ず `Alert.alert` で確認ダイアログを出す:

```tsx
Alert.alert('削除の確認', 'この○○を削除しますか？', [
  { text: 'キャンセル', style: 'cancel' },
  { text: '削除', style: 'destructive', onPress: async () => { ... router.back(); } },
]);
```

### ローディング表示

非同期データ取得中は `ActivityIndicator` で全面ローディングを表示する:

```tsx
if (loading) {
  return (
    <View style={[styles.center, { backgroundColor: c.background }]}>
      <ActivityIndicator color={c.primary} />
    </View>
  );
}
```

### フッター固定の保存ボタン（キーボード対応）

すべてのモーダル画面では `SaveFooter` コンポーネントを使用する。`useKeyboardVisible` と `useSafeAreaInsets` はコンポーネント内部で処理されるため、呼び出し元で import する必要はない:

```tsx
import { SaveFooter } from "@/components/ui/save-footer";

// フッター — 親は <View style={{ flex: 1 }}> でラップするだけでよい
<View style={{ flex: 1 }}>
  <ScrollView contentContainerStyle={styles.container}>
    {/* コンテンツ */}
  </ScrollView>
  <SaveFooter onPress={handleSave} saving={saving} />
</View>;
```

`projects/new.tsx` のようにラベルを変えたい場合は `label` prop を指定する:

```tsx
<SaveFooter onPress={handleSave} saving={saving} label="作成" />
```

**`SaveFooter` の内部動作**:

- `position: "absolute"; left: 0; right: 0; bottom: keyboardHeight` でキーボード上に浮き上がる
- キーボード非表示時は `Math.max(insets.bottom + 16, 34)` でシステムナビバーを確保
- `KeyboardAvoidingView` は使用しない（Expo Router モーダル内でヘッダー高さのオフセットが正しく計算されないため）
- ScrollView の `contentContainerStyle` には `paddingBottom: 120` を必ず入れてフッターに隠れないようにする

### タブ画面のデータ更新（`useFocusEffect`）

タブ画面では、モーダルから戻ったときにデータを再取得するため `useFocusEffect` を使う。`useEffect` はマウント時のみ実行されるためタブ復帰時に再実行されない:

```tsx
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

useFocusEffect(
  useCallback(() => {
    if (initialized) reload();
  }, [initialized, reload]),
);
```

### DB接続の取得

```tsx
const { db } = useDatabase();
// db が null の間は操作しない
if (!db || !id) return;
```

### ナビゲーション

- モーダルを閉じるときは `router.back()` を使う
- モーダルを開くときは `router.push({ pathname: '/goals/new', params: { weekStartDate, weekEndDate } })` のように型付きパスを使う
