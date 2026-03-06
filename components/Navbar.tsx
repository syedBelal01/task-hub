"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useState } from "react";

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-transparent">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 mt-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900">Task Hub</span>
          </div>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 pt-2">
          <Link href="/" className="text-xl font-bold text-slate-900">Task Hub</Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur pt-4 pb-3 border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4">
        {/* Brand and Welcome */}
        <div className="flex flex-col">
          <Link href="/dashboard" className="text-xl font-bold text-slate-900">Task Hub</Link>
          <span className="text-sm text-slate-500">Welcome back, {user.name}</span>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 md:gap-4 ml-auto">
          {/* Manage Tasks / Edit */}
          <Link
            href="/manage"
            className={`p-2 rounded-lg transition-colors ${pathname === "/manage" ? "text-primary-600 bg-primary-50" : "text-slate-500 hover:bg-slate-200"}`}
            aria-label="Manage Tasks"
          >
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>

          {/* Calendar */}
          <Link
            href="/calendar"
            className={`p-2 rounded-lg transition-colors ${pathname === "/calendar" ? "text-primary-600 bg-primary-50" : "text-slate-500 hover:bg-slate-200"}`}
            aria-label="Calendar"
          >
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
            aria-label="Logout"
          >
            {isLoggingOut ? (
              <svg className="h-[22px] w-[22px] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
