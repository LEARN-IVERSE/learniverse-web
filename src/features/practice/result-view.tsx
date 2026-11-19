"use client";

import { Check, RotateCcw, Star, X } from "lucide-react";
import Link from "next/link";

import type { ResultOut, ReviewedQuestionOut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { MathText } from "../learn/math-text";
import { ACTIVITY_INFO } from "./activity-info";

function show(q: ReviewedQuestionOut, value: unknown): string {
  if (value === null || value === undefined || value === "") return "(bỏ trống)";
  if (q.type === "single_choice" && typeof value === "number") {
    return `${String.fromCharCode(65 + value)}. ${q.options?.[value] ?? ""}`;
  }
  if (q.type === "true_false") return value === true ? "Đúng" : "Sai";
  if (Array.isArray(value)) return value.join(" hoặc ");
  return String(value);
}

/** Graded attempt: score, star, what to revise, and every question with its answer and explanation. */
export function ResultView({
  result,
  subject,
  code,
  onRetry,
}: {
  result: ResultOut;
  subject: string;
  code: string;
  onRetry: () => void;
}) {
  const info = ACTIVITY_INFO[result.activity];
  return (
    <section aria-labelledby="result-title" className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] bg-white p-6 ring-1 ring-blue-100 md:p-8">
        <p className="text-xs font-bold tracking-[.2em] text-blue-600 uppercase">{info.name}</p>
        <h2 id="result-title" className="mt-1 font-heading text-3xl font-bold text-slate-900">
          Kết quả: {result.score.toLocaleString("vi-VN")} điểm
        </h2>
        <dl className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="rounded-full bg-slate-100 px-3 py-1.5">
            <dt className="inline">Tổng số câu: </dt>
            <dd className="inline font-bold">{result.total}</dd>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">
            <dt className="inline">Đúng: </dt>
            <dd className="inline font-bold">{result.correct}</dd>
          </div>
          <div className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-800">
            <dt className="inline">Sai: </dt>
            <dd className="inline font-bold">{result.wrong}</dd>
          </div>
        </dl>

        <p
          role="status"
          className={cn(
            "mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold",
            result.star_awarded
              ? "bg-amber-50 text-amber-800"
              : result.passed
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-50 text-slate-700",
          )}
        >
          <Star
            aria-hidden
            className={cn(
              "size-7 shrink-0",
              result.passed ? "fill-amber-400 text-amber-400" : "text-slate-300",
              result.star_awarded && "d-star-pop",
            )}
          />
          {result.star_awarded
            ? "Tuyệt vời! Bạn vừa nhận được 1 sao."
            : result.passed
              ? "Đạt yêu cầu. Sao của chức năng này bạn đã có từ trước."
              : `Chưa đạt. ${info.rule}`}
        </p>
        {result.lesson_completed && (
          <p className="mt-3 font-heading text-lg font-bold text-amber-700">Hoàn thành bài học: đủ 4 sao!</p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
          >
            <RotateCcw aria-hidden className="size-4" /> Làm lại
          </button>
          <Link
            href={`/courses/${subject}`}
            className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"
          >
            Về danh sách bài
          </Link>
        </div>
      </div>

      {result.review_topics.length > 0 && (
        <div className="rounded-[1.75rem] bg-amber-50/70 p-5 ring-1 ring-amber-200">
          <h3 className="font-heading text-lg font-bold text-amber-900">Nên ôn thêm</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.review_topics.map((t) => (
              <li key={t.position}>
                <Link
                  href={`/courses/${subject}/${code}#section-${t.position}`}
                  className="inline-block rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="space-y-3" aria-label="Đáp án và lời giải">
        {result.questions.map((q, i) => (
          <li key={q.id} className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
            <p className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
              {q.is_correct ? (
                <Check aria-hidden className="size-4 text-emerald-600" />
              ) : (
                <X aria-hidden className="size-4 text-rose-600" />
              )}
              <span className={q.is_correct ? "text-emerald-700" : "text-rose-700"}>
                Câu {i + 1}: {q.is_correct ? "đúng" : "sai"}
              </span>
            </p>
            <MathText md={q.prompt_md} className="mt-1 text-slate-900" />
            <div className="mt-3 grid gap-1 text-sm">
              <div className="flex flex-wrap gap-1">
                <span className="text-slate-500">Bạn trả lời:</span>
                <MathText md={show(q, q.your_answer)} className="font-semibold" />
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-slate-500">Đáp án:</span>
                <MathText md={show(q, q.correct_answer)} className="font-semibold text-emerald-700" />
              </div>
            </div>
            <MathText
              md={q.explanation_md}
              className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
