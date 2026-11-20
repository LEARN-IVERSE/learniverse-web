import type { MeOut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// The API picks a stable colour index 0..7 per account; static classes so Tailwind keeps them.
export const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-cyan-600",
  "bg-orange-600",
  "bg-teal-600",
] as const;

export function avatarColorClass(index: number): string {
  return AVATAR_COLORS[((index % AVATAR_COLORS.length) + AVATAR_COLORS.length) % AVATAR_COLORS.length];
}

/** Initial-letter avatar (product spec: first letter of the name, fixed colour). */
export function UserAvatar({
  user,
  className,
}: {
  user: Pick<MeOut, "avatar_initial" | "avatar_color">;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full font-heading text-base font-bold text-white",
        avatarColorClass(user.avatar_color),
        className,
      )}
    >
      {user.avatar_initial}
    </span>
  );
}
