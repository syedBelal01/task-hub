import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LandingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  const sp = (await searchParams) ?? {};
  const redirectTo = typeof sp.redirect === "string" ? sp.redirect : "/dashboard";

  // Instant server-side authentication check! No blank loading views.
  if (session) {
    redirect("/dashboard");
  }

  // Render the login form instantly on the root route
  return <LoginForm redirectTo={redirectTo} />;
}
