export type Priority = "Urgent" | "High" | "Medium" | "Low";
export type TaskStatus = "Pending" | "Completed" | "Rejected";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  rejectionReason?: string;
  createdBy?: string;
  createdByName?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  createdAt: string;
}

export interface GroupedTasks {
  pending: Task[];
  completed: Task[];
  rejected: Task[];
}
