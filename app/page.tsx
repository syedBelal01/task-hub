"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="text-slate-500">Loading...</div></div>}>
      <LandingPageContent />
    </Suspense>
  );
}

function LandingPageContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  useEffect(() => {
    if (!loading && user) {
      window.location.href = redirect;
    }
  }, [loading, user, redirect]);

  if (user && !loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-slate-500">Redirecting…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-800 md:text-5xl">Task Hub</h1>
      {loading && <div className="sr-only" aria-live="polite" />}
      <p className="mt-4 text-lg text-slate-600">
        Role-based task management. Create tasks, track progress, and stay organized.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Sign up with email and password — no OTP. Then log in anytime with the same credentials.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/register"
          className="w-full rounded-xl bg-primary-500 px-6 py-3 text-center font-medium text-white hover:bg-primary-600 sm:w-auto"
        >
          Sign up (new user)
        </Link>
        <Link
          href="/login"
          className="w-full rounded-xl border border-slate-300 px-6 py-3 text-center font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          Log in (existing user)
        </Link>
      </div>
    </div>
  );
}
