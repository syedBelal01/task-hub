import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getTokensFromCode } from "@/lib/google";

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    try {
        const tokens = await getTokensFromCode(code);

        await connectDB();
        const user = await User.findById(session.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.googleTokens = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
        };

        await user.save();

        // Redirect to profile or dashboard after successful connection
        return NextResponse.redirect(new URL("/profile", request.url));
    } catch (error) {
        console.error("Google OAuth error:", error);
        return NextResponse.redirect(new URL("/profile?error=google_auth_failed", request.url));
    }
}
