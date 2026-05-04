/**
 * データベース接続をアプリ全体で共有するコンテキストとフック。
 */

import { getDatabase, initDatabase } from "@/infrastructure/database/database";
import { SQLiteDatabase } from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  initialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  initialized: false,
});

/** データベースプロバイダー。ルートレイアウトでラップする。 */
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DatabaseContextValue>({
    db: null,
    initialized: false,
  });

  useEffect(() => {
    (async () => {
      await initDatabase();
      setState({ db: getDatabase(), initialized: true });
    })();
  }, []);

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}

/** データベース接続を取得するフック */
export function useDatabase() {
  return useContext(DatabaseContext);
}
