import mongoose, { Schema, model, models } from "mongoose";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
  type: "task_completed" | "task_rejected" | "task_created" | "general";
  relatedTaskId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ["task_completed", "task_rejected", "task_created", "general"], default: "general" },
    relatedTaskId: { type: Schema.Types.ObjectId, ref: "Task" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export default models.Notification || model<INotification>("Notification", NotificationSchema);
