import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const notifications = await Notification.find({ userId: session.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return NextResponse.json({
    notifications: notifications.map((n: any) => ({
      id: n._id.toString(),
      message: n.message,
      read: n.read,
      type: n.type,
      createdAt: n.createdAt,
    })),
  });
}
