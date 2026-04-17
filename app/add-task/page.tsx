"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { Priority } from "@/types/task";

const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];

export default function AddTaskPage() {
  const router = useRouter();
  const { user, refresh: refreshAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [assignTo, setAssignTo] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setUsers(d.users ?? []))
        .catch(() => { });
    }
  }, [isAdmin]);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!dueDate) {
      setError("Due date is required");
      return;
    }
    const due = new Date(dueDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (due.getTime() < todayDate.getTime()) {
      setError("Due date must be today or in the future");
      return;
    }
    setLoading(true);
    try {
      const body: { title: string; description: string; dueDate: string; priority: Priority; assignedTo?: string } = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        priority,
      };
      if (isAdmin && assignTo) body.assignedTo = assignTo;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent("/add-task")}`);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create task");
        return;
      }
      refreshAuth();
      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-slate-800">Add Task</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">Due date</label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            min={today}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-slate-700">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        {isAdmin && users.length > 0 && (
          <div>
            <label htmlFor="assignTo" className="block text-sm font-medium text-slate-700">Assign to</label>
            <select
              id="assignTo"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-primary-500 py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <svg className="mr-2 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            "Create task"
          )}
        </button>
      </form>
    </div>
  );
}
