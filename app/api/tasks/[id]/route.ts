import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";
import { PRIORITIES } from "@/models/Task";

async function getTaskAndCheckAuth(id: string, session: { id: string; role: string }) {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const task = await Task.findById(id).select("title description dueDate priority status createdBy assignedTo rejectionReason createdAt").populate("createdBy", "name").populate("assignedTo", "name").lean() as any;
  if (!task) return null;
  const createdById = task.createdBy?._id?.toString?.() ?? task.createdBy?.toString?.();
  const assignedToId = task.assignedTo?._id?.toString?.() ?? task.assignedTo?.toString?.();
  if (session.role === "admin") return task;
  if (createdById === session.id || assignedToId === session.id) return task;
  return null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await getTaskAndCheckAuth(id, session);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const t = task as any;
  return NextResponse.json({
    ...task,
    id: t._id.toString(),
    createdByName: t.createdBy?.name ?? null,
    assignedTo: (task as { assignedTo?: { _id?: { toString: () => string } } }).assignedTo?._id?.toString() ?? (task as { assignedTo?: unknown }).assignedTo ?? null,
    assignedToName: t.assignedTo?.name ?? null,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const taskDoc = await Task.findById(id);
  if (!taskDoc) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const isCreator = taskDoc.createdBy.toString() === session.id;
  const isAssignee = taskDoc.assignedTo?.toString() === session.id;
  const dbUser = await User.findById(session.id).select("role").lean() as any;
  const isAdmin = dbUser?.role === "admin";

  const body = await request.json();

  if (isAssignee && !isAdmin && !isCreator) {
    if (Object.keys(body).length === 1 && body.assignedTo != null) {
      taskDoc.assignedTo = body.assignedTo;
      await taskDoc.save();
      const task = taskDoc.toObject() as any;
      return NextResponse.json({
        ...task,
        id: task._id.toString(),
        assignedTo: taskDoc.assignedTo?.toString() ?? null,
      });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isCreator && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (taskDoc.status !== "Pending") {
    return NextResponse.json({ error: "Only Pending tasks can be edited" }, { status: 400 });
  }

  if (body.title !== undefined) taskDoc.title = String(body.title).trim();
  if (body.description !== undefined) taskDoc.description = String(body.description).trim();
  if (body.dueDate !== undefined) {
    const due = new Date(body.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) {
      return NextResponse.json({ error: "Due date must be today or in the future" }, { status: 400 });
    }
    taskDoc.dueDate = due;
  }
  if (body.priority !== undefined && PRIORITIES.includes(body.priority)) taskDoc.priority = body.priority;
  if (isAdmin && body.assignedTo !== undefined) taskDoc.assignedTo = body.assignedTo || null;
  await taskDoc.save();
  const task = taskDoc.toObject() as any;
  return NextResponse.json({
    ...task,
    id: task._id.toString(),
    createdByName: session.name,
    assignedTo: taskDoc.assignedTo?.toString() ?? null,
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const isCreator = task.createdBy.toString() === session.id;
  const delDbUser = await User.findById(session.id).select("role").lean() as any;
  const isAdmin = delDbUser?.role === "admin";
  if (!isCreator && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await Task.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
