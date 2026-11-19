"use client";

import { ArrowLeft, Play, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { type Activity, activitiesLessonActivities, catalogLesson } from "@/lib/api-client";

import { useApi } from "../learn/use-api";
import { useStudyTimer } from "../progress/use-study-timer";
import { ACTIVITY_INFO } from "./activity-info";
import { AttemptRunner } from "./attempt-runner";

// URL segment -> activity. Theory questions live on the theory page itself.
const ROUTES: Record<string, Activity> = {
  exercise: "exercise",
  review: "review",
  practice: "practice",
  periodic: "periodic",
};

/** /courses/[subject]/[code]/(exercise|review|practice): rules and status, then the attempt. */
export function ActivityPage() {
  const params = useParams<{ subject: string; code: string; activity: string }>();
  const { subject, code } = params;
  const activity = ROUTES[params.activity];
  const [lesson, retryLesson] = useApi(`lesson:${subject}/${code}`, () =>
    catalogLesson({ path: { subject, code } }),
  );
  const [status] = useApi(`activities:${subject}/${code}`, () =>
    activitiesLessonActivities({ path: { subject, code } }),
  );
  const [started, setStarted] = useState(false);
  useStudyTimer(subject, code, activity ?? "exercise", Boolean(activity));

  if (!activity)
    return <ErrorState title="Không tìm thấy trang" description="Chức năng này không tồn tại." />;
  if (lesson.status === "loading" || status.status === "loading") return <PageSkeleton />;
  if (lesson.status === "error")
    return lesson.notFound ? (
      <ErrorState title="Không tìm thấy bài học" description="Bài học này không có trong môn đã chọn." />
    ) : (
      <ErrorState onRetry={retryLesson} />
    );

  const info = ACTIVITY_INFO[activity];
  const state =
    status.status === "ready" ? status.data.activities.find((a) => a.activity === activity) : undefined;
  const l = lesson.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/courses/${subject}`}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" /> {l.subject_name}
      </Link>
      <header>
        <p className="text-xs font-bold tracking-[.2em] text-blue-600 uppercase">{info.name}</p>
        <h1 className="mt-1 font-heading text-3xl leading-tight font-extrabold text-slate-900 md:text-4xl">
          {l.label ? `${l.label}. ` : ""}
          {l.title}
        </h1>
      </header>

      {started ? (
        <AttemptRunner subject={subject} code={code} activity={activity} />
      ) : (
        <section className="rounded-[2rem] bg-white p-6 ring-1 ring-blue-100 md:p-8">
          {activity === "periodic" && status.status === "ready" && status.data.periodic ? (
            <p className="text-slate-700">
              {status.data.periodic.question_count} câu trong {status.data.periodic.time_limit_minutes} phút;
              đúng từ {status.data.periodic.pass_percent}% là đạt. Hết giờ bài sẽ tự nộp.
            </p>
          ) : (
            <p className="text-slate-700">{info.rule}</p>
          )}
          {state?.earned && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
              <Star aria-hidden className="size-4 fill-amber-400 text-amber-400" /> Bạn đã có sao của chức
              năng này
            </p>
          )}
          {state?.best_score != null && (
            <p className="mt-2 text-sm text-slate-500">
              Điểm cao nhất: {state.best_score.toLocaleString("vi-VN")}
            </p>
          )}
          {state && !state.available ? (
            <p
              role="status"
              className="mt-4 rounded-2xl bg-slate-50 p-4 text-slate-600 ring-1 ring-slate-200"
            >
              Chưa mở: kho câu hỏi của chức năng này chưa đủ.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
            >
              <Play aria-hidden className="size-4" />
              {state?.open_attempt_id ? "Làm tiếp" : "Bắt đầu"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
