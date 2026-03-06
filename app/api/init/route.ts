import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
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
        if (!session) {
            return NextResponse.json({ user: null, tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], role: null }, { status: 200 });
        }

        await connectDB();

        const role = session.role;
        const SELECT_FIELDS = "title description dueDate priority status createdBy assignedTo rejectionReason createdAt";

        const userPromise = User.findById(session.id).select("name email role createdAt googleTokens").lean();

        if (role === "admin") {
            const tasksPromise = Task.find().limit(500).select(SELECT_FIELDS).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean();

            const [user, tasks] = await Promise.all([userPromise, tasksPromise]);
            if (!user) return NextResponse.json({ user: null, tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], role: null }, { status: 200 });

            const mapped = sortTasksGlobal((tasks as any[]).map(mapTask) as any);
            const assignedToOthers = sortTasksGlobal(mapped.filter((t: any) => t.assignedTo != null) as any);
            const grouped = groupTasks(tasks as any);

            return NextResponse.json({
                user: {
                    id: (user as any)._id.toString(),
                    name: (user as any).name,
                    email: (user as any).email,
                    role: (user as any).role,
                    hasGoogleAuth: !!(user as any).googleTokens?.refresh_token,
                },
                tasks: mapped,
                myTasks: mapped, // For admin, dashboard logic expects tasks to be all tasks
                assignedToMe: [],
                assignedToOthers,
                role: "admin",
                grouped: {
                    pending: grouped.pending.map((t: any) => mapTask(t)),
                    completed: grouped.completed.map((t: any) => mapTask(t)),
                    rejected: grouped.rejected.map((t: any) => mapTask(t)),
                },
            });
        } else {
            const [user, myTasksRaw, assignedToMeRaw] = await Promise.all([
                userPromise,
                Task.find({ createdBy: session.id }).limit(500).select(SELECT_FIELDS).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean(),
                Task.find({ assignedTo: session.id }).limit(500).select(SELECT_FIELDS).populate("createdBy", "name").populate("assignedTo", "name").sort({ createdAt: -1 }).lean(),
            ]);

            if (!user) return NextResponse.json({ user: null, tasks: [], myTasks: [], assignedToMe: [], assignedToOthers: [], role: null }, { status: 200 });

            const myTasks = sortTasksGlobal((myTasksRaw as TaskDoc[]).map(mapTask) as any);
            const assignedToMe = sortTasksGlobal((assignedToMeRaw as TaskDoc[]).map(mapTask) as any);
            const allForUser = sortTasksGlobal([...myTasks, ...assignedToMe.filter((t: any) => !myTasks.some((m: any) => m.id === t.id))] as any);
            const grouped = groupTasks(allForUser as any);

            return NextResponse.json({
                user: {
                    id: (user as any)._id.toString(),
                    name: (user as any).name,
                    email: (user as any).email,
                    role: (user as any).role,
                    hasGoogleAuth: !!(user as any).googleTokens?.refresh_token,
                },
                tasks: allForUser,
                myTasks,
                assignedToMe,
                assignedToOthers: [],
                role: "user",
                grouped: {
                    pending: grouped.pending as any,
                    completed: grouped.completed as any,
                    rejected: grouped.rejected as any,
                },
            });
        }

    } catch (e) {
        console.error("Init endpoint error:", e);
        return NextResponse.json({ error: "Failed to load initial data" }, { status: 500 });
    }
}
