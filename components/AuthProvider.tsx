"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { Task, GroupedTasks } from "@/types/task";

export type User = { id: string; name: string; email: string; role: "user" | "admin"; hasGoogleAuth?: boolean } | null;

type GlobalTaskState = {
  tasks: Task[];
  myTasks: Task[];
  assignedToMe: Task[];
  assignedToOthers: Task[];
  grouped: GroupedTasks | null;
};

const AuthContext = createContext<{
  user: User;
  tasksState: GlobalTaskState;
  loading: boolean;
  tasksLoading: boolean;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}>({
  user: null,
  tasksState: { tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null },
  loading: false,
  tasksLoading: false,
  setUser: () => { },
  refresh: async () => { },
  refreshTasks: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [tasksState, setTasksState] = useState<GlobalTaskState>({ tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null });
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    // Only fetch tasks when we know the user is logged in.
    if (!user) {
      setTasksState({ tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null });
      return;
    }

    setTasksLoading(true);
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) {
        setTasksState({ tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null });
        return;
      }
      const data = await res.json();
      setTasksState({
        tasks: data.tasks ?? [],
        myTasks: data.myTasks ?? [],
        assignedToMe: data.assignedToMe ?? [],
        assignedToOthers: data.assignedToOthers ?? [],
        grouped: data.grouped ?? null,
      });
    } catch {
      setTasksState({ tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null });
    } finally {
      setTasksLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Always resolve the current user quickly, but do not block initial render.
    // Tasks are fetched on-demand by pages that need them.
    refresh();
  }, [pathname, refresh]);

  return (
    <AuthContext.Provider value={{ user, tasksState, loading, tasksLoading, setUser, refresh, refreshTasks }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
