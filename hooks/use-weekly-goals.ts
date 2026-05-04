/**
 * 週目標の CRUD と状態管理フック。
 */

import { WeeklyGoal } from "@/domain/models";
import {
  countWeeklyGoalsByWeek,
  createWeeklyGoal,
  deleteWeeklyGoal,
  findAllWeeklyGoals,
  findWeeklyGoalsByProject,
  findWeeklyGoalsByWeek,
  updateWeeklyGoal,
} from "@/infrastructure/repositories/WeeklyGoalRepository";
import { useCallback, useEffect, useState } from "react";
import { useDatabase } from "./use-database";

/** 週目標の最大件数 */
const MAX_GOALS_PER_WEEK = 1;

export function useWeeklyGoals(weekStartDate?: string) {
  const { db } = useDatabase();
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const data = weekStartDate
        ? await findWeeklyGoalsByWeek(db, weekStartDate)
        : await findAllWeeklyGoals(db);
      setGoals(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [db, weekStartDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (params: {
      projectId?: number;
      description: string;
      weekStartDate: string;
      weekEndDate: string;
    }) => {
      if (!db) return;
      // 1週間3件制限
      const count = await countWeeklyGoalsByWeek(db, params.weekStartDate);
      if (count >= MAX_GOALS_PER_WEEK) {
        throw new Error(`週目標は1週間に最大${MAX_GOALS_PER_WEEK}件です`);
      }
      await createWeeklyGoal(db, params);
      await reload();
    },
    [db, reload],
  );

  const update = useCallback(
    async (
      id: number,
      params: { projectId?: number | null; description?: string },
    ) => {
      if (!db) return;
      await updateWeeklyGoal(db, id, params);
      await reload();
    },
    [db, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!db) return;
      await deleteWeeklyGoal(db, id);
      await reload();
    },
    [db, reload],
  );

  const findByProject = useCallback(
    async (projectId: number) => {
      if (!db) return [];
      return findWeeklyGoalsByProject(db, projectId);
    },
    [db],
  );

  return {
    goals,
    loading,
    error,
    reload,
    create,
    update,
    remove,
    findByProject,
  };
}
