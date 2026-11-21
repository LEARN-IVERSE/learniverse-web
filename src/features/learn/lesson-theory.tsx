"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { askAboutLesson } from "@/features/ai/ask-ai";
import { catalogLesson } from "@/lib/api-client";

import { MathText } from "./math-text";
import { TheoryCheck } from "./theory-check";
import { useStudyTimer } from "../progress/use-study-timer";
import { useApi } from "./use-api";

/** /courses/[subject]/[code]: the theory of one lesson; math is $...$ / $$...$$ rendered by KaTeX. */
export function LessonTheory() {
  const { subject, code } = useParams<{ subject: string; code: string }>();
  const [state, retry] = useApi(`lesson:${subject}/${code}`, () =>
    catalogLesson({ path: { subject, code } }),
  );

  // Reading time counts only while this page is open and visible (K6-D5).
  useStudyTimer(subject, code, "theory", state.status === "ready" && state.data.kind === "lesson");

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error")
    return state.notFound ? (
      <ErrorState title="Không tìm thấy bài học" description="Bài học này không có trong môn đã chọn." />
    ) : (
      <ErrorState onRetry={retry} />
    );

  const lesson = state.data;
  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href={`/courses/${lesson.subject_code}`}
        className="text-sm font-semibold text-blue-700 hover:underline"
      >
        ← {lesson.subject_name}
      </Link>
      <p className="mt-3 text-xs font-bold tracking-[.2em] text-blue-600 uppercase">{lesson.unit_title}</p>
      <h1 className="mt-1 font-heading text-4xl leading-tight font-extrabold text-slate-900">
        {lesson.label ? `${lesson.label}. ` : ""}
        {lesson.title}
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">Lý thuyết</p>
        <button
          type="button"
          onClick={() =>
            askAboutLesson({ subject: lesson.subject_code, code: lesson.code, title: lesson.title })
          }
          className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
        >
          <Sparkles aria-hidden className="size-4" /> Hỏi Sao Nhí về bài này
        </button>
      </div>

      <div className="mt-6 space-y-5">
        {lesson.sections.map((section, i) => (
          <section
            key={section.title}
            id={`section-${i + 1}`}
            className="scroll-mt-24 rounded-[1.75rem] bg-white p-6 ring-1 ring-blue-100"
          >
            <h2 className="font-heading text-2xl font-bold text-slate-900">{section.title}</h2>
            <MathText md={section.body_md} className="mt-3" />
          </section>
        ))}
        {lesson.sections.length === 0 && (
          <p className="text-muted-foreground">
            Mục này không có phần Lý thuyết.{" "}
            <Link
              href={`/courses/${lesson.subject_code}/${lesson.code}/practice`}
              className="font-semibold text-blue-700 hover:underline"
            >
              Mở bộ câu hỏi
            </Link>
          </p>
        )}
      </div>
      {lesson.kind === "lesson" && <TheoryCheck subject={lesson.subject_code} code={lesson.code} />}
    </article>
  );
}
