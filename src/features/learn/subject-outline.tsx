"use client";

import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ProgressRing, SubjectBackdrop, SubjectScene } from "@/components/art/subject-art";
import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { catalogSubjectOutline, type OutlineOut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { LessonRow } from "./lesson-row";
import { fold } from "./search-text";
import { artId, subjectTheme } from "./subject-theme";
import { useApi } from "./use-api";

/** /courses/[subject]: chapters in book order, collapsible, with a quick filter. */
export function SubjectOutline() {
  const { subject } = useParams<{ subject: string }>();
  const [state, retry] = useApi(`outline:${subject}`, () => catalogSubjectOutline({ path: { subject } }));

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error")
    return state.notFound ? (
      <ErrorState title="Không tìm thấy môn học" description="Môn học này không có trong LEARNIVERSE." />
    ) : (
      <ErrorState onRetry={retry} />
    );
  return <Outline outline={state.data} />;
}

function Outline({ outline }: { outline: OutlineOut }) {
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const theme = subjectTheme(outline.subject.code);
  const art = artId(outline.subject.code);
  const needle = fold(query);

  const units = outline.units
    .map((unit) => ({
      ...unit,
      lessons: unit.lessons.filter((l) => !needle || fold(`${l.label ?? ""} ${l.title}`).includes(needle)),
    }))
    .filter((unit) => unit.lessons.length > 0);

  const toggle = (code: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  return (
    <div className="space-y-6">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" /> Các hành tinh
      </Link>

      {/* Split cover: text on the left, the 2:1 illustration on the right, so the art is never cropped. */}
      <header className="overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5 md:grid md:grid-cols-[1fr_1.3fr]">
        <div className="relative aspect-[2/1] md:order-2 md:aspect-auto md:min-h-64">
          <SubjectScene id={art} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 md:order-1 md:p-8">
          <div>
            <p className={cn("text-[11px] font-bold tracking-[.25em] uppercase", theme.text)}>Hành tinh</p>
            <h1 className="font-heading text-4xl leading-none font-bold md:text-5xl">
              {outline.subject.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{theme.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stars arrive with the progress system in K5, so the ring starts empty. */}
            <ProgressRing value={0} size={56} stroke={6} color={theme.color} label="0%" />
            <p className="text-sm font-semibold">
              {outline.subject.lesson_count} mục
              <span className="block text-xs font-normal text-muted-foreground">
                {outline.subject.textbook}
              </span>
            </p>
          </div>
        </div>
      </header>

      <div className="relative isolate space-y-5 rounded-[2rem] p-1 md:p-2">
        <SubjectBackdrop id={art} className="absolute inset-0 -z-10" />
        <label className="relative block max-w-md">
          <span className="sr-only">Lọc bài trong môn</span>
          <Search
            aria-hidden
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lọc bài, gõ có dấu hay không dấu đều được..."
            className="h-11 w-full rounded-full bg-white pr-4 pl-11 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>

        {units.length === 0 && (
          <p className="relative text-center text-sm text-muted-foreground">Không có bài nào khớp.</p>
        )}

        <div className="relative space-y-5">
          {units.map((unit) => {
            const isOpen = !closed.has(unit.code) || needle !== "";
            return (
              <section
                key={unit.code}
                aria-labelledby={`unit-${unit.code}`}
                className="rounded-[1.75rem] bg-white/85 p-4 ring-1 ring-black/5 md:p-6"
              >
                <h2 id={`unit-${unit.code}`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(unit.code)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left font-heading text-lg font-bold text-slate-900 hover:bg-white focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
                  >
                    <span className="flex-1">{unit.title}</span>
                    <ChevronDown aria-hidden className={cn("size-5 transition", isOpen && "rotate-180")} />
                  </button>
                </h2>
                {isOpen && (
                  <ul className="relative mt-5 space-y-4 pl-16">
                    <span
                      aria-hidden
                      className="absolute top-6 bottom-6 left-[24px] w-1 rounded-full"
                      style={{
                        background: `repeating-linear-gradient(to bottom, ${theme.color}66 0 10px, transparent 10px 18px)`,
                      }}
                    />
                    {unit.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.code}
                        subject={outline.subject.code}
                        lesson={lesson}
                        color={theme.color}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
