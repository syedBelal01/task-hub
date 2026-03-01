import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";
import { PRIORITIES, STATUSES } from "@/models/Task";
import { groupTasks } from "@/lib/taskUtils";

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

    const dbUser = await User.findById(session.id).select("role").lean() as any;
    const role = (dbUser?.role === "admin" ? "admin" : "user") as "user" | "admin";

    if (role === "user") {
      const [myTasksRaw, assignedToMeRaw] = await Promise.all([
        Task.find({ createdBy: session.id }).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean(),
        Task.find({ assignedTo: session.id }).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean(),
      ]);
      const myTasks = (myTasksRaw as TaskDoc[]).map(mapTask);
      const assignedToMe = (assignedToMeRaw as TaskDoc[]).map(mapTask);
      const allForUser = [...myTasks, ...assignedToMe.filter((t) => !myTasks.some((m) => m.id === t.id))];
      const grouped = groupTasks(allForUser as unknown as import("@/models/Task").ITask[]);
      return NextResponse.json({
        tasks: allForUser,
        myTasks,
        assignedToMe,
        role: "user",
        grouped: {
          pending: grouped.pending as ReturnType<typeof mapTask>[],
          completed: grouped.completed as ReturnType<typeof mapTask>[],
          rejected: grouped.rejected as ReturnType<typeof mapTask>[],
        },
      });
    }

    const filter: Record<string, unknown> = {};
    if (status && status !== "all" && STATUSES.includes(status as typeof STATUSES[number])) filter.status = status;
    if (priority && PRIORITIES.includes(priority as typeof PRIORITIES[number])) filter.priority = priority;

    const tasks = await Task.find(filter).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean();
    const mapped = (tasks as TaskDoc[]).map(mapTask);
    const assignedToOthers = mapped.filter(t => t.assignedTo != null);
    const grouped = groupTasks(tasks as unknown as import("@/models/Task").ITask[]);
    return NextResponse.json({
      tasks: mapped,
      assignedToOthers,
      role: "admin",
      grouped: {
        pending: grouped.pending.map((t) => mapTask(t as unknown as TaskDoc)),
        completed: grouped.completed.map((t) => mapTask(t as unknown as TaskDoc)),
        rejected: grouped.rejected.map((t) => mapTask(t as unknown as TaskDoc)),
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
