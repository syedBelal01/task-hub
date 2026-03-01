import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const users = await User.find({}).select("_id name").sort({ name: 1 }).lean();
    return NextResponse.json({
      users: users.map((u) => ({ id: (u as { _id: { toString: () => string } })._id.toString(), name: (u as { name: string }).name })),
    });
  } catch (e) {
    console.error("Users list error:", e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
