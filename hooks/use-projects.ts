/**
 * プロジェクトの CRUD と状態管理フック。
 */

import { Project } from "@/domain/models";
import {
  createProject,
  deleteProject,
  findAllProjects,
  updateProject,
} from "@/infrastructure/repositories/ProjectRepository";
import { useCallback, useEffect, useState } from "react";
import { useDatabase } from "./use-database";

export function useProjects() {
  const { db } = useDatabase();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const data = await findAllProjects(db);
      setProjects(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (params: {
      name: string;
      description?: string;
      progress?: number;
      targetDate?: string | null;
    }) => {
      if (!db) return;
      await createProject(db, params);
      await reload();
    },
    [db, reload],
  );

  const update = useCallback(
    async (
      id: number,
      params: {
        name?: string;
        description?: string | null;
        progress?: number;
        targetDate?: string | null;
        isCompleted?: boolean;
      },
    ) => {
      if (!db) return;
      await updateProject(db, id, params);
      await reload();
    },
    [db, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      if (!db) return;
      await deleteProject(db, id);
      await reload();
    },
    [db, reload],
  );

  return { projects, loading, error, reload, create, update, remove };
}
