import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { Suspense } from "react";

export default async function LandingPage() {
  const session = await getSession();

  // Instant server-side authentication check! No blank loading views.
  if (session) {
    redirect("/dashboard");
  }

  // Render the login form instantly on the root route
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen bg-slate-50"></div>}>
      <LoginForm />
    </Suspense>
  );
}
