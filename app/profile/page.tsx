"use client";

import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export default function ProfilePage() {
    const { user } = useAuth();
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        await fetch("/api/auth/google/disconnect", { method: "POST" });
        window.location.reload();
    };

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
                <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-slate-800">Google Calendar</p>
                            <p className="text-sm text-slate-500">Sync your tasks automatically.</p>
                        </div>
                        {user.hasGoogleAuth ? (
                            <button
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                            </button>
                        ) : (
                            <a
                                href="/api/auth/google"
                                className="rounded-lg flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
                                </svg>
                                Connect Google
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
