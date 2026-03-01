import mongoose, { Schema, model, models } from "mongoose";

export const PRIORITIES = ["Urgent", "High", "Medium", "Low"] as const;
export const STATUSES = ["Pending", "Completed", "Rejected"] as const;

export type Priority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof STATUSES)[number];

export interface ITask {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  priority: Priority;
  status: TaskStatus;
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: PRIORITIES, required: true },
    status: { type: String, enum: STATUSES, default: "Pending" },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.Task || model<ITask>("Task", TaskSchema);
