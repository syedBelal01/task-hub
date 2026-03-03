import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const creatorId = task.createdBy?._id ? task.createdBy._id.toString() : task.createdBy?.toString();
  const assigneeId = task.assignedTo?._id ? task.assignedTo._id.toString() : task.assignedTo?.toString();

  const isCreator = creatorId === session?.id;
  const isAssignee = assigneeId === session?.id;

  const dbUser = await User.findById(session.id).select("role").lean() as any;
  const isAdmin = dbUser?.role === "admin";

  if (!isAdmin && !isAssignee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  task.status = "Completed";
  task.rejectionReason = undefined;
  await task.save();
  await Notification.create({
    userId: task.createdBy,
    message: `Task "${task.title}" was marked as completed.`,
    type: "task_completed",
    relatedTaskId: task._id,
  });
  const t = task.toObject();
  return NextResponse.json({
    ...t,
    id: (t as { _id: { toString: () => string } })._id.toString(),
  });
}
