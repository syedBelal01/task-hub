import type { ITask } from "@/models/Task";
import { PRIORITIES, STATUSES } from "@/models/Task";
import type { Priority, TaskStatus } from "@/models/Task";

const PRIORITY_ORDER: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

export function sortPendingByPriority(tasks: ITask[]): ITask[] {
  return [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function sortByDateNewestFirst(tasks: ITask[]): ITask[] {
  return [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function sortTasksGlobal(tasks: ITask[]): ITask[] {
  const STATUS_ORDER: Record<TaskStatus, number> = { Pending: 0, Completed: 1, Rejected: 2 };

  return [...tasks].sort((a, b) => {
    if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    }

    // If both are Pending, sort by Priority
    if (a.status === "Pending" && b.status === "Pending") {
      const PRIORITY_ORDER: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      if (a.priority !== b.priority) {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
    }

    // Otherwise, or if priorities match, sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function groupTasks(tasks: ITask[]): { pending: ITask[]; completed: ITask[]; rejected: ITask[] } {
  const pending = tasks.filter((t) => t.status === "Pending");
  const completed = tasks.filter((t) => t.status === "Completed");
  const rejected = tasks.filter((t) => t.status === "Rejected");
  return {
    pending: sortPendingByPriority(pending),
    completed: sortByDateNewestFirst(completed),
    rejected: sortByDateNewestFirst(rejected),
  };
}

export { PRIORITIES, STATUSES };
