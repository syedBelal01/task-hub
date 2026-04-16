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
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
}>({
  user: null,
  tasksState: { tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null },
  loading: true,
  setUser: () => { },
  refresh: async () => { }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [tasksState, setTasksState] = useState<GlobalTaskState>({ tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null });
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/init");
      const data = await res.json();
      setUser(data.user ?? null);
      if (data.user) {
        setTasksState({
          tasks: data.tasks ?? [],
          myTasks: data.myTasks ?? [],
          assignedToMe: data.assignedToMe ?? [],
          assignedToOthers: data.assignedToOthers ?? [],
          grouped: data.grouped ?? null
        });
      } else {
        setTasksState({ tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null });
      }
    } catch {
      setUser(null);
      setTasksState({ tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], grouped: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Avoid an eager `/api/init` call on public routes where we don't need tasks/user yet.
    // This reduces startup latency (especially noticeable in PWA standalone launches).
    if (pathname === "/" || pathname === "/login" || pathname === "/register") {
      setLoading(false);
      return;
    }
    refresh();
  }, [pathname, refresh]);

  return (
    <AuthContext.Provider value={{ user, tasksState, loading, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
