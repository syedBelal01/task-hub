import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "taskhub_token";

const publicPaths = ["/", "/api/auth/login", "/api/auth/register"];
const authApiPaths = ["/api/auth/me", "/api/auth/logout"];

function isPublic(pathname: string): boolean {
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthApi(pathname: string): boolean {
  return authApiPaths.some((p) => pathname === p);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = !!request.cookies.get(COOKIE_NAME)?.value;

  if (pathname.startsWith("/api/")) {
    if (isPublic(pathname) || isAuthApi(pathname)) return NextResponse.next();
    if (!hasToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname === "/" && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const protectedPaths = ["/dashboard", "/manage", "/add-task", "/calendar"];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isProtected && !hasToken) {
    const login = new URL("/", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-).*)"],
};
