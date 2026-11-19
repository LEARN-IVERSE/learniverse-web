"use client";

import { useEffect } from "react";

import { type Activity, progressTimeHeartbeat } from "@/lib/api-client";

export const HEARTBEAT_MS = 30_000;

// One random id per open tab (page load); the server merges overlapping tabs (K6).
let tabId: string | null = null;
function currentTabId(): string {
  tabId ??= `tab-${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
  return tabId;
}

/**
 * While this activity page is open AND visible, tell the server every 30 seconds (K6-D3).
 * Hidden tabs (switched away, minimized) send nothing, so they add no time.
 */
export function useStudyTimer(subject: string, code: string, activity: Activity, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    const beat = () =>
      void progressTimeHeartbeat({ body: { tab_id: currentTabId(), subject, code, activity } }).catch(
        () => {},
      );
    const start = () => {
      if (timer !== undefined || document.visibilityState !== "visible") return;
      beat();
      timer = window.setInterval(beat, HEARTBEAT_MS);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [subject, code, activity, enabled]);
}
