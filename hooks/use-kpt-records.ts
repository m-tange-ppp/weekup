/**
 * KPTレコードの CRUD と状態管理フック。
 */

import { KPTRecord } from "@/domain/models";
import {
  createKPTRecord,
  deleteKPTRecord,
  findKPTRecordsByGoalId,
  findKPTRecordsByWeek,
  updateKPTRecord,
} from "@/infrastructure/repositories/KPTRecordRepository";
import { useCallback, useEffect, useState } from "react";
import { useDatabase } from "./use-database";

export function useKPTRecords(weeklyGoalId?: number) {
  const { db } = useDatabase();
  const [records, setRecords] = useState<KPTRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const data = weeklyGoalId
        ? await findKPTRecordsByGoalId(db, weeklyGoalId)
        : [];
      setRecords(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [db, weeklyGoalId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (params: {
      weeklyGoalId: number;
      keep: string;
      problem: string;
      try: string;
    }) => {
      if (!db) return;
      await createKPTRecord(db, params);
      await reload();
    },
    [db, reload],
  );

  const update = useCallback(
    async (
      id: number,
      params: { keep?: string; problem?: string; try?: string },
    ) => {
      if (!db) return;
      await updateKPTRecord(db, id, params);
      await reload();
    },
    [db, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!db) return;
      await deleteKPTRecord(db, id);
      await reload();
    },
    [db, reload],
  );

  const findByWeek = useCallback(
    async (weekStartDate: string) => {
      if (!db) return [];
      return findKPTRecordsByWeek(db, weekStartDate);
    },
    [db],
  );

  return {
    records,
    loading,
    error,
    reload,
    create,
    update,
    remove,
    findByWeek,
  };
}
