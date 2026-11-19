import { cn } from "@/lib/utils";

/**
 * Two-tone wordmark: LEARN + IVERSE (learn + universe). Uses the display font (font-heading).
 * The dark tone is one weight lighter: light text on a dark ground looks heavier (irradiation).
 */
export function Wordmark({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "font-heading leading-none tracking-tight",
        tone === "dark" ? "font-bold" : "font-extrabold",
        className,
      )}
    >
      <span className={tone === "dark" ? "text-white" : "text-slate-900"}>LEARN</span>
      <span className={tone === "dark" ? "text-sky-300" : "text-blue-600"}>IVERSE</span>
    </span>
  );
}
