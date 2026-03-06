"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types/task";
import { useAuth } from "@/components/AuthProvider";

export default function CalendarPage() {
  const { user, tasksState } = useAuth();
  const { tasks } = tasksState;

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const start = new Date(month.year, month.month, 1);
  const end = new Date(month.year, month.month + 1, 0);
  const daysInMonth = end.getDate();
  const firstDay = start.getDay();

  const tasksByDay: Record<string, Task[]> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    tasksByDay[key] = tasks.filter((t) => t.dueDate.startsWith(key));
  }

  const prevMonth = () => {
    if (month.month === 0) setMonth({ year: month.year - 1, month: 11 });
    else setMonth({ ...month, month: month.month - 1 });
  };
  const nextMonth = () => {
    if (month.month === 11) setMonth({ year: month.year + 1, month: 0 });
    else setMonth({ ...month, month: month.month + 1 });
  };

  const monthLabel = start.toLocaleString("default", { month: "long", year: "numeric" });

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    await fetch("/api/auth/google/disconnect", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
          <p className="mt-1 text-slate-600">Tasks by due date</p>
        </div>
        {user?.hasGoogleAuth ? (
          <button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {isDisconnecting ? "Disconnecting..." : "Disconnect Google"}
          </button>
        ) : (
          <a
            href="/api/auth/google"
            className="rounded-lg flex items-center gap-2 border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
            </svg>
            Sync Google Calendar
          </a>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-lg border px-3 py-2 hover:bg-slate-50">Previous</button>
        <span className="font-semibold text-slate-800">{monthLabel}</span>
        <button type="button" onClick={nextMonth} className="rounded-lg border px-3 py-2 hover:bg-slate-50">Next</button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-sm font-medium text-slate-600">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] rounded-lg bg-slate-50" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const key = `${month.year}-${String(month.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayTasks = tasksByDay[key] ?? [];
          return (
            <div key={d} className="min-h-[80px] rounded-lg border bg-white p-2">
              <span className="text-sm font-medium text-slate-700">{d}</span>
              <ul className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <li key={t.id} className="truncate rounded bg-primary-50 px-1 text-xs text-primary-700" title={t.title}>
                    {t.title}
                  </li>
                ))}
                {dayTasks.length > 3 && (
                  <li className="text-xs text-slate-500">+{dayTasks.length - 3} more</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
