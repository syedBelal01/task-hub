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
