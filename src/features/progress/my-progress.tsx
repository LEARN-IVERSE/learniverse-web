"use client";

import { useEffect, useState } from "react";

import { type MyProgressOut, progressMyProgress } from "@/lib/api-client";

const CHANGED = "lv:progress-changed";

/** Ask every streak/time widget to reload, e.g. after a graded attempt. */
export function announceProgressChange(): void {
  window.dispatchEvent(new Event(CHANGED));
}

/** Streak and study time of the signed-in learner; reloads on announceProgressChange(). */
export function useMyProgress(enabled = true): MyProgressOut | null {
  const [data, setData] = useState<MyProgressOut | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () =>
      void progressMyProgress().then(({ data: next }) => {
        if (!cancelled && next) setData(next);
      });
    load();
    window.addEventListener(CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGED, load);
    };
  }, [enabled]);
  return data;
}

/** "1 giờ 5 phút", "12 phút", "0 phút". */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes} phút`;
  return minutes % 60 === 0 ? `${hours} giờ` : `${hours} giờ ${minutes % 60} phút`;
}
