"use client";

import { Flame } from "lucide-react";

import { useSession } from "@/features/auth/session";
import { cn } from "@/lib/utils";

import { useMyProgress } from "./my-progress";

/** Header flame: the current streak; dimmed with a hint until something counts today. */
export function StreakChip() {
  const session = useSession();
  const signedIn = session?.state.status === "signed-in";
  const progress = useMyProgress(signedIn);
  const days = progress?.streak_current ?? 0;
  const today = progress?.learned_today ?? false;
  const hint = today ? `Chuỗi ${days} ngày học liên tiếp` : "Hoàn thành 1 hoạt động hôm nay để giữ chuỗi";

  return (
    <span
      title={hint}
      className={cn(
        "ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold md:ml-0",
        today ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400",
      )}
    >
      <Flame aria-hidden className={cn("size-4", today && "d-flicker")} />
      <span className="sr-only">Chuỗi ngày học:</span>
      {days}
      <span className="sr-only"> ngày. {hint}</span>
    </span>
  );
}
