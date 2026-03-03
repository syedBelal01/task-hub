import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const user = await User.findById(session.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.googleTokens = undefined;
        await user.save();

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Disconnect Google error:", error);
        return NextResponse.json({ error: "Interal Server Error" }, { status: 500 });
    }
}
