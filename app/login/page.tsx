import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  const sp = (await searchParams) ?? {};
  const redirectTo = typeof sp.redirect === "string" ? sp.redirect : "/dashboard";

  if (session) {
    redirect("/dashboard");
  }

  return <LoginForm redirectTo={redirectTo} />;
}
