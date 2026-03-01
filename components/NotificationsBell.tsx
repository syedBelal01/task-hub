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
        <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border bg-white shadow-lg z-50 max-h-96 overflow-auto">
          <div className="border-b px-3 py-2 font-medium text-slate-800">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-slate-500 text-sm">No notifications</div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-3 py-2 text-sm ${n.read ? "text-slate-600" : "bg-primary-50/50 text-slate-800"}`}
                >
                  {n.message}
                  <div className="mt-0.5 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
