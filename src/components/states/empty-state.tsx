import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Friendly "nothing here yet" panel used by every list and page while it has no data. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-[2rem] bg-white px-6 py-12 text-center ring-1 ring-blue-100",
        className,
      )}
    >
      <span aria-hidden className="relative mb-5 grid size-20 place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-dashed border-blue-200" />
        <span className="absolute inset-3 rounded-full bg-blue-50" />
        <Icon className="relative size-8 text-blue-600" />
      </span>
      <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </section>
  );
}
