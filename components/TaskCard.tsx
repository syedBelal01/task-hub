"use client";

import type { Task, Priority } from "@/types/task";

const PRIORITY_BADGE: Record<Priority, string> = {
  Urgent: "bg-pink-100 text-pink-800 border-pink-200",
  High: "bg-amber-100 text-amber-800 border-amber-200",
  Medium: "bg-sky-100 text-sky-800 border-sky-200",
  Low: "bg-slate-100 text-slate-600 border-slate-200",
};

interface TaskCardProps {
  task: Task;
  showManage?: boolean;
  isAdmin?: boolean;
  onManage?: (task: Task) => void;
  isAssignedToMe?: boolean;
}

export function TaskCard({ task, showManage, isAdmin, onManage, isAssignedToMe }: TaskCardProps) {
  const isRejected = task.status === "Rejected";
  const bg = isRejected ? "bg-rejected-100 border-rejected-200" : "bg-white border-slate-200";
  const priorityClass = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.Low;

  return (
    <div className={`rounded-xl border p-4 shadow-sm card-hover ${bg}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-slate-800">{task.title}</h3>
          {task.description && (
            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            <span className={`rounded border px-1.5 py-0.5 font-medium ${priorityClass}`}>{task.priority}</span>
            {task.status !== "Pending" && <span>{task.status}</span>}
            {isAdmin && (
              <span>Submitted by: {task.createdByName ?? "User"}</span>
            )}
            {isAdmin && task.assignedToName && (
              <span>Assigned to: {task.assignedToName}</span>
            )}
            {isAssignedToMe && (
              <span className="text-primary-600 font-medium">Assigned to you</span>
            )}
          </div>
          {isRejected && task.rejectionReason && (
            <p className="mt-2 text-sm text-red-700">Reason: {task.rejectionReason}</p>
          )}
        </div>
        {showManage && task.status === "Pending" && onManage && (
          <button
            type="button"
            onClick={() => onManage(task)}
            className="shrink-0 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            Manage
          </button>
        )}
      </div>
    </div>
  );
}
