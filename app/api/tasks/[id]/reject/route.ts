import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";

import User from "@/models/User";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const reason = body?.rejectionReason?.trim();
  await connectDB();
  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const creatorId = task.createdBy?._id ? task.createdBy._id.toString() : task.createdBy?.toString();
  const assigneeId = task.assignedTo?._id ? task.assignedTo._id.toString() : task.assignedTo?.toString();

  const isCreator = creatorId === session.id;
  const isAssignee = assigneeId === session.id;

  const dbUser = await User.findById(session.id).select("role").lean() as any;
  const isAdmin = dbUser?.role === "admin";

  // Assignees can no longer reject tasks, only complete them. Only admins can reject tasks.
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If an admin is rejecting, a reason is still required.
  if (!reason) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
  }

  task.status = "Rejected";
  task.rejectionReason = reason;
  await task.save();
  task.status = "Rejected";
  task.rejectionReason = reason;
  await task.save();
  const t = task.toObject();
  return NextResponse.json({
    ...t,
    id: (t as { _id: { toString: () => string } })._id.toString(),
  });
}
