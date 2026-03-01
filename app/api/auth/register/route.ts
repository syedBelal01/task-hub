import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { COOKIE_NAME } from "@/lib/auth";

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    let body: { name?: string; email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const name = body.name;
    const email = body.email;
    const password = body.password != null ? String(body.password) : "";
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: "user",
    });
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.warn("Welcome email failed (registration still succeeded):", err);
    }
    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const res = NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Register error:", e);
    return NextResponse.json(
      {
        error: "Registration failed",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
