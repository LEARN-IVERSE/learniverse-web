"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Page numbers to show: first, last and a window around the current page, with gaps as null. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const list = [...wanted].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/** Previous/next, numbered pages and a jump box (spec 2.6). */
export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  const [jump, setJump] = useState("");
  if (pages <= 1) return null;
  const go = (n: number) => onPage(Math.min(pages, Math.max(1, n)));
  const arrow =
    "inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white disabled:opacity-40";

  return (
    <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" className={arrow} disabled={page <= 1} onClick={() => go(page - 1)}>
        <ChevronLeft aria-hidden className="size-4" /> Trang trước
      </button>
      {pageWindow(page, pages).map((n, i) =>
        n === null ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-label={`Trang ${n}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => go(n)}
            className={cn(
              "size-9 rounded-full text-sm font-semibold",
              n === page ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-white",
            )}
          >
            {n}
          </button>
        ),
      )}
      <button type="button" className={arrow} disabled={page >= pages} onClick={() => go(page + 1)}>
        Trang sau <ChevronRight aria-hidden className="size-4" />
      </button>
      <form
        className="ml-2 flex items-center gap-1.5 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number.parseInt(jump, 10);
          if (!Number.isNaN(n)) go(n);
          setJump("");
        }}
      >
        <label className="text-muted-foreground" htmlFor="jump-page">
          Tới trang
        </label>
        <input
          id="jump-page"
          inputMode="numeric"
          value={jump}
          onChange={(e) => setJump(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="h-9 w-14 rounded-full bg-white px-3 text-center ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          className="h-9 rounded-full bg-blue-50 px-3 font-semibold text-blue-700 hover:bg-blue-100"
        >
          Đi
        </button>
      </form>
    </nav>
  );
}
