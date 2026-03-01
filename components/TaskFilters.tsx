"use client";

import { useState } from "react";

type StatusFilter = "all" | "Pending" | "Completed" | "Rejected";
type PriorityFilter = "Urgent" | "High" | "Medium" | "Low" | null;

interface TaskFiltersProps {
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  onStatusChange: (s: StatusFilter) => void;
  onPriorityChange: (p: PriorityFilter) => void;
}

export function TaskFilters({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
}: TaskFiltersProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const openStatus = () => {
    setStatusOpen(true);
    setPriorityOpen(false);
  };
  const openPriority = () => {
    setPriorityOpen(true);
    setStatusOpen(false);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={openStatus}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Status: {statusFilter === "all" ? "All" : statusFilter}
        </button>
        {statusOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border bg-white py-1 shadow">
            {(["all", "Pending", "Completed", "Rejected"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onStatusChange(s); setStatusOpen(false); }}
                className={`block w-full px-3 py-2 text-left text-sm ${statusFilter === s ? "bg-primary-50 text-primary-700" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={openPriority}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Priority: {priorityFilter ?? "Any"}
        </button>
        {priorityOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border bg-white py-1 shadow">
            {(["Urgent", "High", "Medium", "Low"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { onPriorityChange(p); setPriorityOpen(false); }}
                className={`block w-full px-3 py-2 text-left text-sm ${priorityFilter === p ? "bg-primary-50 text-primary-700" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { onPriorityChange(null); setPriorityOpen(false); }}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              Any
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
