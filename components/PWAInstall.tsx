"use client";

import { useState, useEffect } from "react";

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt((e as unknown as { prompt: () => Promise<{ outcome: string }> }).prompt ? (e as unknown as { prompt: () => Promise<{ outcome: string }> }) : null);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await (deferredPrompt as { prompt: () => Promise<{ outcome: string }> }).prompt();
    setShowBanner(false);
  };

  if (!showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-30 rounded-xl border bg-white p-4 shadow-lg md:left-auto md:right-4 md:max-w-sm">
      <p className="text-sm font-medium text-slate-800">Install Task Hub for a better experience</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={install} className="rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600">
          Install
        </button>
        <button type="button" onClick={() => setShowBanner(false)} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">
          Not now
        </button>
      </div>
    </div>
  );
}
