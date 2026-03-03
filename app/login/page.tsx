import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { Suspense } from "react";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen bg-slate-50"></div>}>
      <LoginForm />
    </Suspense>
  );
}
