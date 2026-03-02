"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";
import type { Task, GroupedTasks } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";
import { ManageTaskModal } from "@/components/ManageTaskModal";
import type { Priority } from "@/types/task";

function groupTasks(tasks: Task[]): GroupedTasks {
  const pending = tasks.filter((t) => t.status === "Pending").sort((a, b) => {
    const order: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
    return order[a.priority] - order[b.priority];
  });
  const completed = tasks.filter((t) => t.status === "Completed").sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const rejected = tasks.filter((t) => t.status === "Rejected").sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return { pending, completed, rejected };
}

export default function ManagePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-6"><p>Loading...</p></div>}>
      <ManagePageContent />
    </Suspense>
  );
}

function ManagePageContent() {
  const { user } = useAuth();
  const editId = useSearchParams()?.get("edit") ?? null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [assignedToMe, setAssignedToMe] = useState<Task[]>([]);
  const [assignedToOthers, setAssignedToOthers] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageTask, setManageTask] = useState<Task | null>(null);
  const [manageAssignedTask, setManageAssignedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks ?? []);
        setMyTasks(data.myTasks ?? data.tasks ?? []);
        setAssignedToMe(data.assignedToMe ?? []);
        setAssignedToOthers(data.assignedToOthers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (editId && tasks.length > 0 && !editingTask) {
      const t = tasks.find((x) => x.id === editId);
      if (t && t.status === "Pending") setEditingTask(t);
    }
  }, [editId, tasks, editingTask]);

  const isAdmin = user?.role === "admin";

  const handleComplete = async (id: string) => {
    await fetch(`/api/tasks/${id}/complete`, { method: "POST", credentials: "include" });
    fetchTasks();
  };
  const handleReject = async (id: string, reason: string) => {
    await fetch(`/api/tasks/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: reason }),
      credentials: "include",
    });
    fetchTasks();
  };
  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE", credentials: "include" });
    setManageTask(null);
    if (editingTask?.id === id) setEditingTask(null);
    fetchTasks();
  };
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setManageTask(null);
  };

  const grouped = groupTasks(tasks);
  const myGrouped = groupTasks(myTasks);
  const assignedGrouped = groupTasks(assignedToMe);
  const assignedOthersGrouped = groupTasks(assignedToOthers);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Manage Tasks</h1>
        <a
          href="/add-task"
          className="md:hidden flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 btn-press"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </a>
      </div>

      {/* ═══ MOBILE VIEW ═══ */}
      <div className="mt-6 md:hidden space-y-6">
        {isAdmin ? (
          <>
            <MobileSection title="Pending" tasks={grouped.pending} onComplete={handleComplete} onReject={handleReject} onEdit={handleEdit} onDelete={handleDelete} isAdmin onReassign={async (taskId, userId) => { await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedTo: userId || null }), credentials: "include" }); fetchTasks(); }} />
            <MobileSection title="Completed" tasks={grouped.completed} isAdmin />
            <MobileSection title="Rejected" tasks={grouped.rejected} isAdmin />
            {assignedToOthers.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-slate-800 pt-2">Assigned to Others</h2>
                <MobileSection title="Pending" tasks={assignedOthersGrouped.pending} onComplete={handleComplete} onReject={handleReject} onEdit={handleEdit} onDelete={handleDelete} isAdmin onReassign={async (taskId, userId) => { await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignedTo: userId || null }), credentials: "include" }); fetchTasks(); }} />
                <MobileSection title="Completed" tasks={assignedOthersGrouped.completed} isAdmin />
                <MobileSection title="Rejected" tasks={assignedOthersGrouped.rejected} isAdmin />
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-800">My tasks</h2>
            <MobileSection title="Pending" tasks={myGrouped.pending} onComplete={handleComplete} onReject={handleReject} onEdit={handleEdit} onDelete={handleDelete} />
            <MobileSection title="Completed" tasks={myGrouped.completed} />
            <MobileSection title="Rejected" tasks={myGrouped.rejected} />
            <h2 className="text-lg font-semibold text-slate-800 pt-2">Tasks assigned by admin</h2>
            <MobileSection title="Pending" tasks={assignedGrouped.pending} onComplete={handleComplete} onReject={handleReject} />
            <MobileSection title="Completed" tasks={assignedGrouped.completed} />
            <MobileSection title="Rejected" tasks={assignedGrouped.rejected} />
          </>
        )}
      </div>

      {/* ═══ DESKTOP VIEW ═══ */}
      <div className="hidden md:block mt-6 space-y-8">
        {isAdmin ? (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">All Tasks</h2>
              <Section title="Pending" tasks={grouped.pending} showManage onManage={setManageTask} isAdmin />
              <Section title="Completed" tasks={grouped.completed} isAdmin />
              <Section title="Rejected" tasks={grouped.rejected} isAdmin />
            </section>
            {(assignedOthersGrouped.pending.length > 0 || assignedOthersGrouped.completed.length > 0 || assignedOthersGrouped.rejected.length > 0) && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">Assigned to Others</h2>
                <div className="space-y-6">
                  <Section title="Pending" tasks={assignedOthersGrouped.pending} showManage onManage={setManageTask} isAdmin />
                  <Section title="Completed" tasks={assignedOthersGrouped.completed} isAdmin />
                  <Section title="Rejected" tasks={assignedOthersGrouped.rejected} isAdmin />
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">My tasks</h2>
              <Section title="Pending" tasks={myGrouped.pending} showManage onManage={setManageTask} isAdmin={false} />
              <Section title="Completed" tasks={myGrouped.completed} isAdmin={false} />
              <Section title="Rejected" tasks={myGrouped.rejected} isAdmin={false} />
            </section>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">Tasks assigned by admin</h2>
              <Section title="Pending" tasks={assignedGrouped.pending} showManage onManage={setManageAssignedTask} isAdmin={false} isAssignedToMe />
              <Section title="Completed" tasks={assignedGrouped.completed} isAdmin={false} isAssignedToMe />
              <Section title="Rejected" tasks={assignedGrouped.rejected} isAdmin={false} isAssignedToMe />
            </section>
          </>
        )}
      </div>

      {manageTask && (
        <ManageTaskModal
          task={manageTask}
          onClose={() => setManageTask(null)}
          onComplete={handleComplete}
          onReject={handleReject}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isPending={manageTask.status === "Pending"}
          mode="full"
          isAdmin={isAdmin}
          currentUserId={user?.id}
          onReassign={isAdmin ? async (userId) => {
            await fetch(`/api/tasks/${manageTask.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assignedTo: userId || null }),
              credentials: "include",
            });
            setManageTask(null);
            fetchTasks();
          } : undefined}
        />
      )}
      {manageAssignedTask && (
        <ManageTaskModal
          task={manageAssignedTask}
          onClose={() => setManageAssignedTask(null)}
          onComplete={handleComplete}
          onReject={handleReject}
          onEdit={() => { }}
          onDelete={async () => { }}
          isPending={manageAssignedTask.status === "Pending"}
          mode="assignedToMe"
          currentUserId={user?.id}
          onReassign={async (userId) => {
            await fetch(`/api/tasks/${manageAssignedTask.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assignedTo: userId }),
              credentials: "include",
            });
            setManageAssignedTask(null);
            fetchTasks();
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => { setEditingTask(null); if (typeof window !== "undefined") window.history.replaceState({}, "", "/manage"); }}
          onSaved={() => { setEditingTask(null); fetchTasks(); if (typeof window !== "undefined") window.history.replaceState({}, "", "/manage"); }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  tasks,
  showManage,
  onManage,
  isAdmin,
  isAssignedToMe,
}: {
  title: string;
  tasks: Task[];
  showManage?: boolean;
  onManage?: (task: Task) => void;
  isAdmin?: boolean;
  isAssignedToMe?: boolean;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} showManage={showManage} isAdmin={isAdmin} onManage={onManage} isAssignedToMe={isAssignedToMe} />
        ))}
      </div>
    </section>
  );
}

/* ─── Mobile Section ─── */
function MobileSection({
  title,
  tasks,
  onComplete,
  onReject,
  onEdit,
  onDelete,
  isAdmin,
  onReassign,
}: {
  title: string;
  tasks: Task[];
  onComplete?: (id: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => Promise<void>;
  isAdmin?: boolean;
  onReassign?: (taskId: string, userId: string) => Promise<void>;
}) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-slate-700">{title}</h3>
      <div className="space-y-4 stagger-children">
        {tasks.map((task) => (
          <MobileManageCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onReject={onReject}
            onEdit={onEdit}
            onDelete={onDelete}
            onReassign={onReassign}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Mobile Manage Card (matches reference screenshot) ─── */
const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "bg-pink-100 text-pink-800 border-pink-200",
  High: "bg-amber-100 text-amber-800 border-amber-200",
  Medium: "bg-sky-100 text-sky-800 border-sky-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

function MobileManageCard({
  task,
  onComplete,
  onReject,
  onEdit,
  onDelete,
  isAdmin,
  onReassign,
}: {
  task: Task;
  onComplete?: (id: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => Promise<void>;
  isAdmin?: boolean;
  onReassign?: (taskId: string, userId: string) => Promise<void>;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);
  const [assignTo, setAssignTo] = useState("");

  useEffect(() => {
    if (isAdmin && onReassign) {
      fetch("/api/users", { credentials: "include" })
        .then(r => r.json())
        .then(d => setUserList(d.users ?? []))
        .catch(() => { });
    }
  }, [isAdmin, onReassign]);

  const isPending = task.status === "Pending";
  const priorityClass = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.Low;
  const isRejected = task.status === "Rejected";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm card-hover ${isRejected ? "bg-rejected-100 border-rejected-200" : "bg-white border-slate-200"}`}>
      {/* Title row */}
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
        <span className={`rounded-md border px-2 py-0.5 text-xs font-bold uppercase ${priorityClass}`}>{task.priority}</span>
        {isPending && <span className="text-xs text-slate-500 font-medium">Pending Approval</span>}
        {task.status === "Completed" && <span className="text-xs text-emerald-600 font-medium">Completed</span>}
        {isRejected && <span className="text-xs text-rose-600 font-medium">Rejected</span>}
      </div>

      {task.description && <p className="mt-1.5 text-sm text-slate-600">{task.description}</p>}

      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Due: {new Date(task.dueDate).toLocaleDateString()}
      </div>

      {isAdmin && task.createdByName && <p className="mt-1 text-xs text-slate-400">Submitted by: {task.createdByName}</p>}
      {isAdmin && task.assignedToName && <p className="mt-0.5 text-xs text-violet-500 font-medium">Assigned to: {task.assignedToName}</p>}
      {isRejected && task.rejectionReason && <p className="mt-2 text-sm text-red-700">Reason: {task.rejectionReason}</p>}

      {/* Assign to (admin only) */}
      {isAdmin && onReassign && isPending && userList.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className="flex-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800"
          >
            <option value="">Assign to...</option>
            {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button
            type="button"
            disabled={!assignTo || loading === "reassign"}
            onClick={async () => { setLoading("reassign"); await onReassign(task.id, assignTo); setLoading(null); setAssignTo(""); }}
            className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 btn-press"
          >
            Assign
          </button>
        </div>
      )}

      {/* Action icons — single row, icon-only */}
      {isPending && (onComplete || onReject) && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-4">
            {onComplete && (
              <button
                type="button"
                disabled={loading === "complete"}
                onClick={async () => { setLoading("complete"); await onComplete(task.id); setLoading(null); }}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors btn-press disabled:opacity-50"
                aria-label="Complete"
                title="Complete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
            )}

            {onReject && (
              <button
                type="button"
                onClick={() => setShowRejectInput(!showRejectInput)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors btn-press ${showRejectInput ? "border-rose-400 bg-rose-100 text-rose-700" : "border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700"}`}
                aria-label="Reject"
                title="Reject"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors btn-press"
                aria-label="Edit"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                disabled={loading === "delete"}
                onClick={async () => { setLoading("delete"); await onDelete(task.id); setLoading(null); }}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-rose-200 bg-rose-50 text-slate-400 hover:text-rose-500 hover:bg-rose-100 transition-colors btn-press disabled:opacity-50"
                aria-label="Delete"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>

          {showRejectInput && (
            <div className="animate-expand-down space-y-2">
              <input type="text" placeholder={isAdmin ? "Rejection reason (Optional)..." : "Rejection reason..."} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" autoFocus />
              <div className="flex gap-2">
                <button type="button" disabled={loading === "reject" || (!isAdmin && !rejectReason.trim())} onClick={async () => { setLoading("reject"); await onReject!(task.id, rejectReason); setLoading(null); setShowRejectInput(false); setRejectReason(""); }} className="flex-1 rounded-lg bg-rose-500 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50">Confirm</button>
                <button type="button" onClick={() => { setShowRejectInput(false); setRejectReason(""); }} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditTaskModal({ task, onClose, onSaved }: { task: Task; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate.slice(0, 10));
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate, priority }),
        credentials: "include",
      });
      if (res.ok) onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-800">Edit task</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary-500 py-2 text-white hover:bg-primary-600 disabled:opacity-50">
              Save
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
