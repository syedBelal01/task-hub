"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { NotificationsBell } from "./NotificationsBell";
import { useState } from "react";

async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "/";
}

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-semibold text-primary-600">Task Hub</Link>
        </div>
      </header>
    );
  }

  if (!user) {
    return (
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="font-semibold text-primary-600">Task Hub</Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  const navLinks = (
    <>
      <Link
        href="/dashboard"
        className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/dashboard" ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100"}`}
        onClick={() => setMenuOpen(false)}
      >
        Dashboard
      </Link>
      <Link
        href="/manage"
        className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/manage" ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100"}`}
        onClick={() => setMenuOpen(false)}
      >
        Manage Tasks
      </Link>
      <Link
        href="/calendar"
        className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/calendar" ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100"}`}
        onClick={() => setMenuOpen(false)}
      >
        Calendar
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/dashboard" className="font-semibold text-primary-600 shrink-0">Task Hub</Link>

        <nav className="hidden md:flex items-center gap-1">{navLinks}</nav>

        <div className="flex items-center gap-2 ml-auto">
          <NotificationsBell />
          <Link
            href="/add-task"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            aria-label="Add Task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <Link
            href="/profile"
            className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {user.name}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="hidden md:block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Logout
          </button>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white py-2 px-4 flex flex-col gap-1 animate-slide-down">
          {navLinks}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {user.name}
          </Link>
          <button type="button" onClick={logout} className="w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
