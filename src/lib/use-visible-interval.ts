"use client";

import { useEffect, useRef } from "react";

/**
 * Run `callback` every `ms` milliseconds, but only while the tab is visible. A forgotten background tab
 * then makes no requests at all, which matters when every request counts (shared demo, tunnel quotas).
 */
export function useVisibleInterval(callback: () => void, ms: number, enabled = true): void {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") latest.current();
    }, ms);
    return () => window.clearInterval(timer);
  }, [ms, enabled]);
}
