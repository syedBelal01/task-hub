"use client";

import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="mx-auto max-w-md px-4 py-8 animate-fade-in-up">
            <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xl font-bold">
                        {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-slate-800">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Role</span>
                        <span className="font-medium text-slate-800 capitalize">{user.role}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
