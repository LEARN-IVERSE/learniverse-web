"use client";

import { ArrowRight, BookOpen, Clock, Flame, Sparkles } from "lucide-react";
import Link from "next/link";

import { OrbitSystem, ProgressRing, SubjectScene } from "@/components/art/subject-art";
import { useSession } from "@/features/auth/session";
import { formatDuration, useMyProgress } from "@/features/progress/my-progress";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { catalogSubjects } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { artId, subjectTheme } from "./subject-theme";
import { useApi } from "./use-api";

function pick(code: string) {
  const t = subjectTheme(code);
  return { glyph: t.glyph, color: t.color };
}

/** Vietnamese given name is the last word of the full name ("Nguyễn Đức Lập" -> "Lập"). */
function givenName(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  return words[words.length - 1] ?? fullName;
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** "2026-11-19" (a Vietnam day from the API) -> "T5". Parsed as a plain calendar date. */
function weekday(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Greeting banner: welcome text next to the three subject planets orbiting a star. */
function Hero({ planets }: { planets: { id: string; glyph: string; color: string }[] }) {
  const session = useSession();
  const user = session?.state.status === "signed-in" ? session.state.user : null;
  const progress = useMyProgress(user !== null);
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-white ring-1 ring-blue-100">
      <div className="grid items-center md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4 p-6 md:p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Sparkles aria-hidden className="size-3.5" />
            {!progress
              ? "Học tập"
              : progress.streak_current > 0
                ? `Chuỗi ${progress.streak_current} ngày, giữ lửa nhé!`
                : "Hoàn thành 1 hoạt động hôm nay để bắt đầu chuỗi"}
          </p>
          <h1 className="font-heading text-3xl leading-tight font-bold md:text-4xl">
            {user ? `Chào ${givenName(user.name)}!` : "Chào bạn!"}
            <span className="block text-blue-600">Hôm nay mình bay tới hành tinh nào?</span>
          </h1>
          {progress && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <ProgressRing
                  value={Math.min(1, progress.goal_done / progress.goal_target)}
                  size={64}
                  stroke={7}
                  color="#2563eb"
                  label={`${Math.min(progress.goal_done, progress.goal_target)}/${progress.goal_target}`}
                />
                <div className="text-sm">
                  <p className="font-semibold">Mục tiêu hôm nay</p>
                  <p className="text-muted-foreground">
                    {progress.goal_done >= progress.goal_target
                      ? "Đã đạt, tuyệt vời!"
                      : `Hoàn thành ${progress.goal_target} hoạt động`}
                  </p>
                </div>
              </div>
              <ol className="flex gap-1.5" aria-label="Chuỗi học trong tuần">
                {progress.week.map((d, i) => {
                  const today = i === progress.week.length - 1;
                  return (
                    <li
                      key={d.day}
                      className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground"
                    >
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full",
                          d.learned ? "bg-orange-100 text-orange-600" : "bg-muted",
                          today && "ring-2 ring-orange-300 ring-offset-2",
                        )}
                      >
                        {d.learned ? (
                          <Flame aria-label="đã học" className="size-4" />
                        ) : (
                          <span aria-label="chưa học" className="size-1.5 rounded-full bg-slate-300" />
                        )}
                      </span>
                      {weekday(d.day)}
                    </li>
                  );
                })}
              </ol>
              <p className="flex w-full items-center gap-2 text-sm text-slate-600">
                <Clock aria-hidden className="size-4 text-blue-600" />
                Hôm nay học{" "}
                <strong className="text-slate-900">{formatDuration(progress.today_seconds)}</strong>
                <span className="text-slate-400">·</span> tổng {formatDuration(progress.total_seconds)}
              </p>
            </div>
          )}
        </div>
        <OrbitSystem className="mx-auto h-52 w-full max-w-md md:h-72" planets={planets} />
      </div>
    </section>
  );
}

/** /courses: one "planet" card per subject. */
export function SubjectGrid() {
  const [state, retry] = useApi("subjects", () => catalogSubjects());

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error") return <ErrorState onRetry={retry} />;

  return (
    <>
      <Hero planets={state.data.map((s) => ({ id: s.code, ...pick(s.code) }))} />
      <div className="mt-10 mb-4">
        <h2 className="font-heading text-2xl font-bold">Ba hành tinh môn học</h2>
        <p className="text-sm text-muted-foreground">
          Mỗi hành tinh là một lộ trình bài học, đi đúng thứ tự trong sách.
        </p>
      </div>
      {state.data.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có bài học nào"
          description="Nội dung các môn sẽ xuất hiện ở đây ngay khi được nạp vào hệ thống."
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-3">
          {state.data.map((subject) => {
            const theme = subjectTheme(subject.code);
            return (
              <li key={subject.code}>
                <Link
                  href={`/courses/${subject.code}`}
                  className="d-world group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white text-left ring-1 ring-black/5 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none"
                >
                  <div className="relative h-40 overflow-hidden">
                    <div className="d-world-art absolute inset-0">
                      <SubjectScene id={artId(subject.code)} className="h-full w-full" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h2 className={cn("font-heading text-2xl font-bold", theme.text)}>{subject.name}</h2>
                      <p className="text-sm text-muted-foreground">{theme.tagline}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{subject.textbook}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-3">
                      {/* Stars arrive with the progress system in K5, so every ring starts empty. */}
                      <ProgressRing value={0} size={44} stroke={5} color={theme.color} />
                      <div className="text-sm">
                        <p className="font-semibold">0 sao</p>
                        <p className="text-xs text-muted-foreground">{subject.lesson_count} mục</p>
                      </div>
                      <span
                        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white transition group-hover:gap-2"
                        style={{ background: theme.color }}
                      >
                        Vào học <ArrowRight aria-hidden className="size-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
