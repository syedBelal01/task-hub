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
    notifications: notifications.map((n) => ({
      id: (n as { _id: { toString: () => string } })._id.toString(),
      message: (n as { message: string }).message,
      read: (n as { read: boolean }).read,
      type: (n as { type: string }).type,
      createdAt: (n as { createdAt: Date }).createdAt,
    })),
  });
}
