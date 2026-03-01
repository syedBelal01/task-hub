import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";
const COOKIE_NAME = "taskhub_token";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & AuthUser;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export { COOKIE_NAME };
