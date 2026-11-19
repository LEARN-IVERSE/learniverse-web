import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder with the rough shape of a page (title + three cards) while a segment streams in. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Đang tải" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded-full bg-blue-100" />
        <Skeleton className="h-10 w-72 max-w-full rounded-2xl bg-blue-100" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full bg-blue-50" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-[2rem] bg-white ring-1 ring-blue-100" />
        ))}
      </div>
    </div>
  );
}
