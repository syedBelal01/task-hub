"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

function beaconLogout() {
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const data = new Blob([], { type: "application/json" });
      (navigator as Navigator).sendBeacon("/api/auth/logout", data);
      return;
    }
  } catch {
    // ignore
  }

  try {
    fetch("/api/auth/logout", { method: "POST", credentials: "include", keepalive: true }).catch(() => {});
  } catch {
    // ignore
  }
}

export function AutoLogoutOnClose() {
  const { user } = useAuth();
  const armedRef = useRef(false);

  useEffect(() => {
    // Only attach once a user is logged in.
    if (!user || armedRef.current) return;
    armedRef.current = true;

    const onPageHide = () => beaconLogout();
    const onBeforeUnload = () => beaconLogout();

    // `pagehide` is the most reliable signal on mobile/PWA.
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      armedRef.current = false;
    };
  }, [user]);

  return null;
}

