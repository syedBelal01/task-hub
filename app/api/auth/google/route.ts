import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = getAuthUrl();
    return NextResponse.redirect(url);
}
