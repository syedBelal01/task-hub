import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const ids = Array.isArray(body?.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ ok: true });
  await connectDB();
  await Notification.updateMany(
    { _id: { $in: ids }, userId: session.id },
    { $set: { read: true } }
  );
  return NextResponse.json({ ok: true });
}
