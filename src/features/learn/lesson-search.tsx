"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { catalogSearchLessons, type SearchHitOut } from "@/lib/api-client";

/** Header search: lessons across all subjects, accent-insensitive (the API folds accents). */
export function LessonSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHitOut[] | null>(null);
  const listId = useId();
  const term = query.trim();

  useEffect(() => {
    if (!term) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void catalogSearchLessons({ query: { q: term } }).then(({ data }) => {
        if (!cancelled) setHits(data ?? []);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  const shown = term ? hits : null;

  return (
    <div className="relative ml-auto hidden w-64 md:block">
      <label>
        <span className="sr-only">Tìm bài học</span>
        <Search
          aria-hidden
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder="Tìm bài học, câu hỏi..."
          aria-controls={listId}
          className="h-10 w-full rounded-full bg-white pr-4 pl-9 text-sm ring-1 ring-blue-100 outline-none focus:ring-2 focus:ring-blue-300"
        />
      </label>
      {shown && (
        <div
          id={listId}
          role="region"
          aria-label="Kết quả tìm bài học"
          className="absolute top-12 right-0 z-40 w-80 overflow-hidden rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-black/5"
        >
          {shown.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Không có bài nào khớp.</p>
          ) : (
            <ul>
              {shown.map((hit) => (
                <li key={`${hit.subject_code}/${hit.code}`}>
                  <Link
                    href={
                      hit.kind === "lesson"
                        ? `/courses/${hit.subject_code}/${hit.code}`
                        : `/courses/${hit.subject_code}`
                    }
                    onClick={() => setQuery("")}
                    className="block rounded-2xl px-3 py-2 hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
                  >
                    <span className="block text-[11px] font-semibold text-blue-600 uppercase">
                      {hit.subject_name}
                    </span>
                    <span className="text-sm text-slate-800">
                      {hit.label ? `${hit.label}. ` : ""}
                      {hit.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
