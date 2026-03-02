"use client";

import { useState, useEffect, useRef } from "react";

type Notification = { id: string; message: string; read: boolean; type: string; createdAt: string };

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const list = data.notifications ?? [];
      setNotifications(list);
      const unreadIds = list.filter((n: Notification) => !n.read).map((n: Notification) => n.id);
      if (unreadIds.length > 0) {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: unreadIds }),
          credentials: "include",
        });
        setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50 flex flex-col max-h-[80vh] sm:max-h-96 overflow-hidden sm:origin-top-right animate-scale-in sm:animate-none">
            <div className="border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm px-4 py-3 font-semibold text-slate-800 shrink-0">
              Notifications
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 text-sm ${n.read ? "text-slate-600 bg-white" : "bg-primary-50/40 text-slate-800"}`}
                    >
                      <p className="leading-relaxed">{n.message}</p>
                      <div className="mt-1.5 text-xs text-slate-400 font-medium">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
