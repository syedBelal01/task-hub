"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Task, GroupedTasks } from "@/types/task";
import { TaskCard } from "@/components/TaskCard";
import { TaskFilters } from "@/components/TaskFilters";
import { ManageTaskModal } from "@/components/ManageTaskModal";
import { SectionSkeleton, MobileSectionSkeleton } from "@/components/Skeletons";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import type { Priority } from "@/types/task";

type StatusFilter = "all" | "Pending" | "Completed" | "Rejected";
type AdminActiveCard = "total" | "pending" | "completed" | "rejected" | "urgent" | "high" | "medium" | "low" | "assigned" | null;
type UserActiveCard = "myTotal" | "myPending" | "myCompleted" | "myRejected" | "assignedByAdmin" | null;

function applyFilter(tasks: Task[], statusFilter: StatusFilter, priorityFilter: Priority | null): Task[] {
  let list = tasks;
  if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
  if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter);
  return list;
}

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

function getAdminFilteredTasks(tasks: Task[], activeCard: AdminActiveCard): Task[] {
  switch (activeCard) {
    case "total": {
      const grouped = groupTasks(tasks);
      return [...grouped.pending, ...grouped.completed, ...grouped.rejected];
    }
    case "pending": return tasks.filter(t => t.status === "Pending");
    case "completed": return tasks.filter(t => t.status === "Completed");
    case "rejected": return tasks.filter(t => t.status === "Rejected");
    case "urgent": return tasks.filter(t => t.priority === "Urgent");
    case "high": return tasks.filter(t => t.priority === "High");
    case "medium": return tasks.filter(t => t.priority === "Medium");
    case "low": return tasks.filter(t => t.priority === "Low");
    default: return [];
  }
}

export default function DashboardPage() {
  const { user, tasksState, loading: authLoading, refresh: refreshAuth } = useAuth();
  const { tasks, myTasks, assignedToMe, assignedToOthers } = tasksState;

  const [apiRole, setApiRole] = useState<"user" | "admin" | null>(null);
  const showSkeleton = useDelayedLoading(authLoading, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [manageTask, setManageTask] = useState<Task | null>(null);
  const [manageAssignedTask, setManageAssignedTask] = useState<Task | null>(null);
  const [adminActiveCard, setAdminActiveCard] = useState<AdminActiveCard>(null);
  const [userActiveCard, setUserActiveCard] = useState<UserActiveCard>(null);
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>("all");
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);

  const handleStatusChange = (s: StatusFilter) => {
    setStatusFilter(s);
    if (s !== "all") setPriorityFilter(null);
  };
  const handlePriorityChange = (p: Priority | null) => {
    setPriorityFilter(p);
    if (p) setStatusFilter("all");
  };

  const isAdmin = user?.role === "admin" || apiRole === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setUserList(d.users ?? []))
        .catch(() => { });
    }
  }, [isAdmin]);

  const myGrouped = groupTasks(applyFilter(myTasks, statusFilter, priorityFilter));
  const assignedGrouped = groupTasks(applyFilter(assignedToMe, statusFilter, priorityFilter));

  const handleComplete = async (task: Task) => {
    if (!isAdmin && task.assignedTo !== user?.id) return;
    await fetch(`/api/tasks/${task.id}/complete`, { method: "POST", credentials: "include" });
    refreshAuth();
  };
  const handleReject = async (task: Task, reason: string) => {
    if (!isAdmin && task.assignedTo !== user?.id) return;
    await fetch(`/api/tasks/${task.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: reason }),
      credentials: "include",
    });
    refreshAuth();
  };
  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE", credentials: "include" });
    setManageTask(null);
    refreshAuth();
  };

  const total = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === "Pending").length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const rejectedCount = tasks.filter((t) => t.status === "Rejected").length;
  const urgentCount = tasks.filter((t) => t.priority === "Urgent").length;
  const highCount = tasks.filter((t) => t.priority === "High").length;
  const mediumCount = tasks.filter((t) => t.priority === "Medium").length;
  const lowCount = tasks.filter((t) => t.priority === "Low").length;

  const toggleCard = (card: AdminActiveCard) => {
    setAdminActiveCard(prev => prev === card ? null : card);
  };

  const adminVisibleTasks = getAdminFilteredTasks(tasks, adminActiveCard);

  const otherUsersList = userList.filter((u) => u.id !== user?.id);

  const filteredAssignedToOthers = assignedUserFilter === "all"
    ? assignedToOthers
    : assignedToOthers.filter(t => t.assignedTo === assignedUserFilter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all your tasks</p>
        </div>
        <a
          href="/add-task"
          className="flex items-center justify-center rounded-full bg-primary-600 w-12 h-12 text-white shadow-sm hover:bg-primary-700 transition"
          aria-label="New Task"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </a>
      </div>

      {authLoading ? (
        showSkeleton ? (
          <>
            <div className="mt-6 space-y-3 md:hidden">
              <MobileSectionSkeleton title="Loading Tasks..." count={4} />
            </div>
            <div className="hidden md:block">
              <div className="mt-6 grid grid-cols-4 gap-3">
                <div className="h-24 rounded-xl bg-slate-100 animate-pulse"></div>
                <div className="h-24 rounded-xl bg-slate-100 animate-pulse"></div>
                <div className="h-24 rounded-xl bg-slate-100 animate-pulse"></div>
                <div className="h-24 rounded-xl bg-slate-100 animate-pulse"></div>
              </div>
              <div className="mt-6 space-y-8">
                <SectionSkeleton title="Loading Tasks..." count={3} />
                <SectionSkeleton title="" count={3} />
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-[50vh]"></div>
        )
      ) : isAdmin ? (
        <>
          {/* ═══ MOBILE: Admin Expandable Cards ═══ */}
          <div className="mt-6 space-y-3 md:hidden stagger-children">
            <ExpandableCard label="Total Tasks" value={total} isActive={adminActiveCard === "total"} onClick={() => toggleCard("total")} className="bg-indigo-50 border-indigo-200 text-indigo-800" badgeClass="bg-indigo-200" />
            {adminActiveCard === "total" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}

            <ExpandableCard label="Pending" value={pendingCount} isActive={adminActiveCard === "pending"} onClick={() => toggleCard("pending")} className="bg-orange-50 border-orange-200 text-orange-800" badgeClass="bg-orange-200" />
            {adminActiveCard === "pending" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}

            <ExpandableCard label="Completed" value={completedCount} isActive={adminActiveCard === "completed"} onClick={() => toggleCard("completed")} className="bg-teal-50 border-teal-200 text-teal-800" badgeClass="bg-teal-200" />
            {adminActiveCard === "completed" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}

            <ExpandableCard label="Rejected" value={rejectedCount} isActive={adminActiveCard === "rejected"} onClick={() => toggleCard("rejected")} className="bg-red-50 border-red-200 text-red-800" badgeClass="bg-red-200" />
            {adminActiveCard === "rejected" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}

            <div className="grid grid-cols-2 gap-3">
              <ExpandableCard label="URGENT" value={urgentCount} isActive={adminActiveCard === "urgent"} onClick={() => toggleCard("urgent")} className="bg-pink-50 border-pink-200 text-pink-800 !px-3 !py-3" badgeClass="bg-pink-200" />
              <ExpandableCard label="HIGH" value={highCount} isActive={adminActiveCard === "high"} onClick={() => toggleCard("high")} className="bg-amber-50 border-amber-200 text-amber-800 !px-3 !py-3" badgeClass="bg-amber-200" />
            </div>
            {adminActiveCard === "urgent" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}
            {adminActiveCard === "high" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}

            <div className="grid grid-cols-2 gap-3">
              <ExpandableCard label="MEDIUM" value={mediumCount} isActive={adminActiveCard === "medium"} onClick={() => toggleCard("medium")} className="bg-sky-50 border-sky-200 text-sky-800 !px-3 !py-3" badgeClass="bg-sky-200" />
              <ExpandableCard label="LOW" value={lowCount} isActive={adminActiveCard === "low"} onClick={() => toggleCard("low")} className="bg-slate-50 border-slate-200 text-slate-700 !px-3 !py-3" badgeClass="bg-slate-200" />
            </div>
            {adminActiveCard === "medium" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}
            {adminActiveCard === "low" && <div className="animate-expand-down"><TaskList tasks={adminVisibleTasks} onManage={setManageTask} isAdmin /></div>}

            {otherUsersList.length > 0 && (
              <>
                <ExpandableCard label="Assigned to Others" value={filteredAssignedToOthers.length} isActive={adminActiveCard === "assigned"} onClick={() => toggleCard("assigned")} className="bg-violet-50 border-violet-200 text-violet-800" badgeClass="bg-violet-200" />
                {adminActiveCard === "assigned" && (
                  <div className="animate-expand-down space-y-3">
                    <select
                      value={assignedUserFilter}
                      onChange={(e) => setAssignedUserFilter(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 font-medium"
                    >
                      <option value="all">All Users</option>
                      {otherUsersList.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {filteredAssignedToOthers.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                        No tasks assigned
                      </div>
                    ) : (
                      <TaskList tasks={filteredAssignedToOthers} onManage={setManageTask} isAdmin />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ═══ DESKTOP: Admin Grid + Sections ═══ */}
          <div className="hidden md:block">
            <div className="mt-6 grid grid-cols-4 gap-3">
              <SummaryCard label="Total Tasks" value={total} className="bg-indigo-50 border-indigo-200 text-indigo-800" badgeClass="bg-indigo-200" />
              <SummaryCard label="Pending" value={pendingCount} className="bg-orange-50 border-orange-200 text-orange-800" badgeClass="bg-orange-200" />
              <SummaryCard label="Completed" value={completedCount} className="bg-teal-50 border-teal-200 text-teal-800" badgeClass="bg-teal-200" />
              <SummaryCard label="Rejected" value={rejectedCount} className="bg-red-50 border-red-200 text-red-800" badgeClass="bg-red-200" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <PriorityCard label="URGENT" value={urgentCount} className="bg-pink-50 border-pink-200 text-pink-800" badgeClass="bg-pink-200" />
              <PriorityCard label="HIGH" value={highCount} className="bg-amber-50 border-amber-200 text-amber-800" badgeClass="bg-amber-200" />
              <PriorityCard label="MEDIUM" value={mediumCount} className="bg-sky-50 border-sky-200 text-sky-800" badgeClass="bg-sky-200" />
              <PriorityCard label="LOW" value={lowCount} className="bg-slate-50 border-slate-200 text-slate-700" badgeClass="bg-slate-200" />
            </div>
            <div className="mt-6">
              <TaskFilters statusFilter={statusFilter} priorityFilter={priorityFilter} onStatusChange={handleStatusChange} onPriorityChange={handlePriorityChange} />
            </div>
            <div className="mt-6 space-y-8">
              <section>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">All Tasks</h2>
                <TaskSection title="Pending" tasks={groupTasks(applyFilter(tasks, statusFilter, priorityFilter)).pending} showManage onManage={setManageTask} isAdmin />
                <TaskSection title="Completed" tasks={groupTasks(applyFilter(tasks, statusFilter, priorityFilter)).completed} isAdmin />
                <TaskSection title="Rejected" tasks={groupTasks(applyFilter(tasks, statusFilter, priorityFilter)).rejected} isAdmin />
              </section>
              {otherUsersList.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-slate-800">Assigned to Others</h2>
                    <select
                      value={assignedUserFilter}
                      onChange={(e) => setAssignedUserFilter(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white"
                    >
                      <option value="all">All Users</option>
                      {otherUsersList.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    {filteredAssignedToOthers.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                        No tasks assigned
                      </div>
                    ) : (
                      filteredAssignedToOthers.map((task) => (
                        <TaskCard key={task.id} task={task} showManage isAdmin onManage={setManageTask} />
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ═══ MOBILE: User Expandable Cards ═══ */}
          <div className="mt-6 space-y-3 md:hidden stagger-children">
            <ExpandableCard label="My Tasks" value={myTasks.length} isActive={userActiveCard === "myTotal"} onClick={() => setUserActiveCard(prev => prev === "myTotal" ? null : "myTotal")} className="bg-indigo-50 border-indigo-200 text-indigo-800" badgeClass="bg-indigo-200" />
            {userActiveCard === "myTotal" && <div className="animate-expand-down"><TaskList tasks={myTasks} onManage={setManageTask} isAdmin={false} /></div>}

            <ExpandableCard label="Pending" value={myTasks.filter(t => t.status === "Pending").length} isActive={userActiveCard === "myPending"} onClick={() => setUserActiveCard(prev => prev === "myPending" ? null : "myPending")} className="bg-orange-50 border-orange-200 text-orange-800" badgeClass="bg-orange-200" />
            {userActiveCard === "myPending" && <div className="animate-expand-down"><TaskList tasks={myTasks.filter(t => t.status === "Pending")} onManage={setManageTask} isAdmin={false} /></div>}

            <ExpandableCard label="Completed" value={myTasks.filter(t => t.status === "Completed").length} isActive={userActiveCard === "myCompleted"} onClick={() => setUserActiveCard(prev => prev === "myCompleted" ? null : "myCompleted")} className="bg-teal-50 border-teal-200 text-teal-800" badgeClass="bg-teal-200" />
            {userActiveCard === "myCompleted" && <div className="animate-expand-down"><TaskList tasks={myTasks.filter(t => t.status === "Completed")} onManage={setManageTask} isAdmin={false} /></div>}

            <ExpandableCard label="Rejected" value={myTasks.filter(t => t.status === "Rejected").length} isActive={userActiveCard === "myRejected"} onClick={() => setUserActiveCard(prev => prev === "myRejected" ? null : "myRejected")} className="bg-red-50 border-red-200 text-red-800" badgeClass="bg-red-200" />
            {userActiveCard === "myRejected" && <div className="animate-expand-down"><TaskList tasks={myTasks.filter(t => t.status === "Rejected")} onManage={setManageTask} isAdmin={false} /></div>}

            {assignedToMe.length > 0 && (
              <>
                <ExpandableCard label="Assigned by Admin" value={assignedToMe.length} isActive={userActiveCard === "assignedByAdmin"} onClick={() => setUserActiveCard(prev => prev === "assignedByAdmin" ? null : "assignedByAdmin")} className="bg-violet-50 border-violet-200 text-violet-800" badgeClass="bg-violet-200" />
                {userActiveCard === "assignedByAdmin" && <div className="animate-expand-down"><TaskList tasks={assignedToMe} onManage={setManageAssignedTask} isAdmin={false} /></div>}
              </>
            )}
          </div>

          {/* ═══ DESKTOP: User Grid + Sections ═══ */}
          <div className="hidden md:block">
            <div className="mt-6 grid grid-cols-4 gap-3">
              <SummaryCard label="My Tasks" value={myTasks.length} className="bg-indigo-50 border-indigo-200 text-indigo-800" badgeClass="bg-indigo-200" />
              <SummaryCard label="Pending" value={myTasks.filter(t => t.status === "Pending").length} className="bg-orange-50 border-orange-200 text-orange-800" badgeClass="bg-orange-200" />
              <SummaryCard label="Completed" value={myTasks.filter(t => t.status === "Completed").length} className="bg-teal-50 border-teal-200 text-teal-800" badgeClass="bg-teal-200" />
              <SummaryCard label="Rejected" value={myTasks.filter(t => t.status === "Rejected").length} className="bg-red-50 border-red-200 text-red-800" badgeClass="bg-red-200" />
            </div>
            <div className="mt-6">
              <TaskFilters statusFilter={statusFilter} priorityFilter={priorityFilter} onStatusChange={handleStatusChange} onPriorityChange={handlePriorityChange} />
            </div>
            <div className="mt-6 space-y-8">
              <section>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">My tasks</h2>
                <TaskSection title="Pending" tasks={myGrouped.pending} showManage onManage={setManageTask} isAdmin={false} />
                <TaskSection title="Completed" tasks={myGrouped.completed} isAdmin={false} />
                <TaskSection title="Rejected" tasks={myGrouped.rejected} isAdmin={false} />
              </section>
              <section>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">Tasks assigned by admin</h2>
                <TaskSection title="Pending" tasks={assignedGrouped.pending} showManage onManage={setManageAssignedTask} isAdmin={false} isAssignedToMe />
                <TaskSection title="Completed" tasks={assignedGrouped.completed} isAdmin={false} isAssignedToMe />
                <TaskSection title="Rejected" tasks={assignedGrouped.rejected} isAdmin={false} isAssignedToMe />
              </section>
            </div>
          </div>
        </>
      )}

      {manageTask && (
        <ManageTaskModal
          task={manageTask}
          onClose={() => setManageTask(null)}
          onComplete={() => handleComplete(manageTask)}
          onReject={(id, reason) => handleReject(manageTask, reason)}
          onEdit={(t) => { setManageTask(null); window.location.href = `/manage?edit=${t.id}`; }}
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
            refreshAuth();
          } : undefined}
        />
      )}
      {manageAssignedTask && (
        <ManageTaskModal
          task={manageAssignedTask}
          onClose={() => setManageAssignedTask(null)}
          onComplete={() => handleComplete(manageAssignedTask)}
          onReject={undefined}
          onEdit={undefined}
          onDelete={undefined}
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
            refreshAuth();
          }}
        />
      )}
    </div>
  );
}

/* ─── Admin Expandable Card ─── */
function ExpandableCard({
  label,
  value,
  isActive,
  onClick,
  className = "",
  badgeClass = "",
}: {
  label: string;
  value: number;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  badgeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-5 py-4 shadow-sm flex items-center justify-between transition-all duration-200 active:scale-[0.98] ${isActive ? "ring-2 ring-primary-400 ring-offset-1" : ""
        } ${className}`}
    >
      <span className="text-sm font-bold uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-bold px-3 py-1 rounded-full ${badgeClass || "bg-black/5"}`}>{value}</span>
    </button>
  );
}

/* ─── Desktop Summary Card ─── */
function SummaryCard({ label, value, className, badgeClass }: { label: string; value: number; className?: string; badgeClass?: string }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm card-hover flex items-center justify-between ${className ?? "border-slate-200 bg-white"}`}>
      <p className="text-sm font-bold uppercase tracking-wide">{label}</p>
      <div className={`text-sm font-bold px-3 py-1 rounded-full ${badgeClass || "bg-black/5"}`}>{value}</div>
    </div>
  );
}

/* ─── Desktop Priority Card ─── */
function PriorityCard({ label, value, className, badgeClass }: { label: string; value: number; className: string; badgeClass?: string }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm flex items-center justify-between ${className}`}>
      <p className="text-sm font-bold uppercase tracking-wide">{label}</p>
      <div className={`text-sm font-bold px-3 py-1 rounded-full ${badgeClass || "bg-black/5"}`}>{value}</div>
    </div>
  );
}

/* ─── Admin Task List (shown below a card when expanded) ─── */
function TaskList({
  tasks,
  onManage,
  isAdmin,
}: {
  tasks: Task[];
  onManage: (task: Task) => void;
  isAdmin: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
        No tasks found
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          showManage
          isAdmin={isAdmin}
          onManage={onManage}
        />
      ))}
    </div>
  );
}

/* ─── User Section (unchanged logic) ─── */
function TaskSection({
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
          <TaskCard
            key={task.id}
            task={task}
            showManage={showManage}
            isAdmin={isAdmin}
            onManage={onManage}
            isAssignedToMe={isAssignedToMe}
          />
        ))}
      </div>
    </section>
  );
}
