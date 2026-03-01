"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({})) as { error?: string; detail?: string };
      if (!res.ok) {
        const msg = data.error || "Registration failed";
        const detail = data.detail ? ` (${data.detail})` : "";
        setError(msg + detail);
        return;
      }
      setUser(data.user);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Sign up</h1>
      <p className="mt-1 text-sm text-slate-500">Create an account with email and password. No OTP. After this you can log in anytime using the same email and password.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          Sign up
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-600 hover:underline">Log in</Link>
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">Back to home</Link>
      </p>
    </div>
  );
}
