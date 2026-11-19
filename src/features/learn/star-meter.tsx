import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** 0-4 stars next to a lesson (one per function); "Hoàn thành" once all four are earned. */
export function StarMeter({ stars, completed }: { stars: number; completed: boolean }) {
  if (completed) {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
        Hoàn thành
      </span>
    );
  }
  return (
    <span role="img" aria-label={`${stars} trên 4 sao`} className="flex shrink-0 gap-0.5">
      {[0, 1, 2, 3].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn("size-4", i < stars ? "fill-amber-400 text-amber-400" : "text-slate-300")}
        />
      ))}
    </span>
  );
}
