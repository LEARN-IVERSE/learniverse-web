"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { catalogLesson } from "@/lib/api-client";

import { MathText } from "./math-text";
import { TheoryCheck } from "./theory-check";
import { useApi } from "./use-api";

/** /courses/[subject]/[code]: the theory of one lesson; math is $...$ / $$...$$ rendered by KaTeX. */
export function LessonTheory() {
  const { subject, code } = useParams<{ subject: string; code: string }>();
  const [state, retry] = useApi(`lesson:${subject}/${code}`, () =>
    catalogLesson({ path: { subject, code } }),
  );

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
      <p className="mt-1 text-sm text-muted-foreground">Lý thuyết</p>

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
