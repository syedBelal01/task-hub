import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";
import { PRIORITIES, STATUSES } from "@/models/Task";
import { createCalendarEvent } from "@/lib/google";
import { groupTasks, sortTasksGlobal } from "@/lib/taskUtils";

type TaskDoc = {
  _id: { toString: () => string };
  createdBy?: { _id?: unknown; name?: string } | null;
  assignedTo?: { _id?: unknown; name?: string } | null;
  [k: string]: unknown;
};

function mapTask(t: TaskDoc) {
  const { _id, createdBy, assignedTo, ...rest } = t;
  return {
    ...rest,
    id: _id.toString(),
    createdByName: createdBy && typeof createdBy === "object" && "name" in createdBy ? createdBy.name : null,
    assignedTo: assignedTo && typeof assignedTo === "object" && assignedTo._id != null ? String((assignedTo as { _id: { toString: () => string } })._id) : (rest.assignedTo != null ? String(rest.assignedTo) : null),
    assignedToName: assignedTo && typeof assignedTo === "object" && "name" in assignedTo ? assignedTo.name : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as string | null;
    const priority = searchParams.get("priority") as string | null;
    const limit = parseInt(searchParams.get("limit") || "500", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const dbUser = await User.findById(session.id).select("role").lean() as any;
    const role = (dbUser?.role === "admin" ? "admin" : "user") as "user" | "admin";
    const SELECT_FIELDS = "title description dueDate priority status createdBy assignedTo rejectionReason createdAt";

    if (role === "user") {
      console.time("DB_Query_User");
      const [myTasksRaw, assignedToMeRaw] = await Promise.all([
        Task.find({ createdBy: session.id }).skip(skip).limit(limit).select(SELECT_FIELDS).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean(),
        Task.find({ assignedTo: session.id }).skip(skip).limit(limit).select(SELECT_FIELDS).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean(),
      ]);
      console.timeEnd("DB_Query_User");
      const myTasks = sortTasksGlobal((myTasksRaw as TaskDoc[]).map(mapTask) as any);
      const assignedToMe = sortTasksGlobal((assignedToMeRaw as TaskDoc[]).map(mapTask) as any);
      const allForUser = sortTasksGlobal([...myTasks, ...assignedToMe.filter((t: any) => !myTasks.some((m: any) => m.id === t.id))] as any);
      const grouped = groupTasks(allForUser as any);
      return NextResponse.json({
        tasks: allForUser,
        myTasks,
        assignedToMe,
        role: "user",
        grouped: {
          pending: grouped.pending as any,
          completed: grouped.completed as any,
          rejected: grouped.rejected as any,
        },
      });
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "all" && STATUSES.includes(status as typeof STATUSES[number])) filter.status = status;
    if (priority && PRIORITIES.includes(priority as typeof PRIORITIES[number])) filter.priority = priority;

    console.time("DB_Query_Admin");
    const tasks = await Task.find(filter).skip(skip).limit(limit).select(SELECT_FIELDS).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean();
    console.timeEnd("DB_Query_Admin");

    const mapped = sortTasksGlobal((tasks as any[]).map(mapTask) as any);
    const assignedToOthers = sortTasksGlobal(mapped.filter((t: any) => t.assignedTo != null) as any);
    const grouped = groupTasks(tasks as any);
    return NextResponse.json({
      tasks: mapped,
      assignedToOthers,
      role: "admin",
      grouped: {
        pending: grouped.pending.map((t: any) => mapTask(t)),
        completed: grouped.completed.map((t: any) => mapTask(t)),
        rejected: grouped.rejected.map((t: any) => mapTask(t)),
      },
    });
  } catch (e) {
    console.error("Tasks list error:", e);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const body = await request.json();
    const { title, description, dueDate, priority, assignedTo } = body;
    if (!title?.trim() || !dueDate) {
      return NextResponse.json({ error: "Title and due date are required" }, { status: 400 });
    }
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due.getTime() < today.getTime()) {
      return NextResponse.json({ error: "Due date must be today or in the future" }, { status: 400 });
    }
    const taskData: Record<string, unknown> = {
      title: title.trim(),
      description: description?.trim() || "",
      dueDate: due,
      priority: priority && PRIORITIES.includes(priority) ? priority : "Medium",
      status: "Pending",
      createdBy: session.id,
    };
    if (session.role === "admin" && assignedTo) {
      taskData.assignedTo = assignedTo;
    }
    const task = await Task.create(taskData);

    // Non-blocking fire-and-forget background synchronization
    createCalendarEvent(session.id, {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
    })
      .then(async (eventId) => {
        if (eventId) {
          task.googleEventId = eventId;
          await task.save();
        }
      })
      .catch(console.error);

    const taskObj = task.toObject() as { _id: { toString: () => string }; createdBy?: unknown; assignedTo?: unknown };
    return NextResponse.json({
      task: {
        ...taskObj,
        id: taskObj._id.toString(),
        createdByName: session.name,
        assignedTo: task.assignedTo?.toString() ?? null,
      },
    });
  } catch (e) {
    console.error("Task create error:", e);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
