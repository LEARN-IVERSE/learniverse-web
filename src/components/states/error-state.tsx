import { RotateCcw, TriangleAlert } from "lucide-react";

/** Error panel with a retry button; shown by error boundaries and failed data loads. */
export function ErrorState({
  title = "Ối, có lỗi xảy ra",
  description = "Trang này chưa tải được. Bạn thử lại nhé, nếu vẫn lỗi hãy quay lại sau ít phút.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <section
      role="alert"
      className="flex flex-col items-center rounded-[2rem] bg-white px-6 py-12 text-center ring-1 ring-rose-100"
    >
      <span aria-hidden className="mb-5 grid size-16 place-items-center rounded-full bg-rose-50">
        <TriangleAlert className="size-8 text-rose-500" />
      </span>
      <h2 className="font-heading text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          <RotateCcw aria-hidden className="size-4" />
          Thử lại
        </button>
      )}
    </section>
  );
}
