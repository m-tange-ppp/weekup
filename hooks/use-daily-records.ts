/**
 * 日記の CRUD と状態管理フック。
 */

import { DailyRecord } from "@/domain/models";
import {
  createDailyRecord,
  deleteDailyRecord,
  findDailyRecordsByDate,
  findDailyRecordsByGoalId,
  findDailyRecordsByWeek,
  findDatesWithRecords,
  updateDailyRecord,
} from "@/infrastructure/repositories/DailyRecordRepository";
import { useCallback, useEffect, useState } from "react";
import { useDatabase } from "./use-database";

export function useDailyRecords(weeklyGoalId?: number) {
  const { db } = useDatabase();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const data = weeklyGoalId
        ? await findDailyRecordsByGoalId(db, weeklyGoalId)
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
      description: string;
      date: string;
    }) => {
      if (!db) return;
      await createDailyRecord(db, params);
      await reload();
    },
    [db, reload],
  );

  const update = useCallback(
    async (id: number, params: { description: string }) => {
      if (!db) return;
      await updateDailyRecord(db, id, params);
      await reload();
    },
    [db, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!db) return;
      await deleteDailyRecord(db, id);
      await reload();
    },
    [db, reload],
  );

  const findByDate = useCallback(
    async (date: string) => {
      if (!db) return [];
      return findDailyRecordsByDate(db, date);
    },
    [db],
  );

  const findByWeek = useCallback(
    async (weekStartDate: string, weekEndDate: string) => {
      if (!db) return [];
      return findDailyRecordsByWeek(db, weekStartDate, weekEndDate);
    },
    [db],
  );

  const getDatesWithRecords = useCallback(
    async (fromDate: string, toDate: string) => {
      if (!db) return [];
      return findDatesWithRecords(db, fromDate, toDate);
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
    findByDate,
    findByWeek,
    getDatesWithRecords,
  };
}
