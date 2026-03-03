"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/types/task";

interface ManageTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onComplete: (id: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => Promise<void>;
  isPending: boolean;
  mode?: "full" | "assignedToMe";
  users?: { id: string; name: string }[];
  onReassign?: (userId: string) => Promise<void>;
  currentUserId?: string | null;
  isAdmin?: boolean;
}

export function ManageTaskModal({
  task,
  onClose,
  onComplete,
  onReject,
  onEdit,
  onDelete,
  isPending,
  mode = "full",
  users = [],
  onReassign,
  currentUserId = null,
  isAdmin = false,
}: ManageTaskModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [userList, setUserList] = useState<{ id: string; name: string }[]>(users);

  useEffect(() => {
    if ((mode === "assignedToMe" || mode === "full") && userList.length === 0 && users.length === 0) {
      fetch("/api/users", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setUserList(d.users ?? []))
        .catch(() => { });
    } else if (users.length > 0) {
      setUserList(users);
    }
  }, [mode, users, userList.length]);

  useEffect(() => {
    if (task) {
      setAssignTo(task.assignedTo ?? "");
      setReassignTo("");
    }
  }, [task]);

  if (!task) return null;

  const handleComplete = async () => {
    setLoading("complete");
    await onComplete(task.id);
    setLoading(null);
    onClose();
  };

  const handleReject = async () => {
    if (!isAdmin && !rejectReason.trim()) return;
    setLoading("reject");
    if (onReject) await onReject(task.id, rejectReason.trim());
    setLoading(null);
    setShowRejectForm(false);
    setRejectReason("");
    onClose();
  };

  const handleDelete = async () => {
    setLoading("delete");
    if (onDelete) await onDelete(task.id);
    setLoading(null);
    onClose();
  };

  const handleReassign = async () => {
    if (!reassignTo || !onReassign) return;
    setLoading("reassign");
    await onReassign(reassignTo);
    setLoading(null);
    onClose();
  };

  const handleAssign = async () => {
    if (!onReassign) return;
    setLoading("assign");
    await onReassign(assignTo || "");
    setLoading(null);
    onClose();
  };

  const isAssignedMode = mode === "assignedToMe";
  const otherUsers = userList.filter((u) => u.id !== currentUserId && u.id !== (task.assignedTo ?? ""));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold text-slate-800">{task.title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
        <p className="mt-1 text-xs text-slate-500">Due: {new Date(task.dueDate).toLocaleDateString()} · {task.priority}</p>

        {task.status === "Pending" && isPending && (
          <div className="mt-4 space-y-2">
            {(isAdmin || task.assignedTo === currentUserId) && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={!!loading}
                className="flex w-full items-center justify-center rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading === "complete" ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Marking...
                  </>
                ) : (
                  "Mark as completed"
                )}
              </button>
            )}

            {isAssignedMode && onReassign && otherUsers.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Reassign to</label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select user</option>
                  {otherUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleReassign}
                  disabled={!reassignTo || !!loading}
                  className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reassign
                </button>
              </div>
            )}

            {!isAssignedMode && (
              <>
                {isAdmin && onReassign && userList.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Assign to</label>
                    <select
                      value={assignTo || task.assignedTo || ""}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {userList.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAssign}
                      disabled={!!loading}
                      className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Save assignment
                    </button>
                  </div>
                )}
                {onReject && isAdmin && (
                  !showRejectForm ? (
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(true)}
                      className="w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Rejection reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={isAdmin ? "Optional" : "Required"}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={(!isAdmin && !rejectReason.trim()) || !!loading}
                          className="flex flex-1 items-center justify-center rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {loading === "reject" ? (
                            <>
                              <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            "Submit rejection"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                )}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="flex w-full items-center justify-center rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!!loading}
                    className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
