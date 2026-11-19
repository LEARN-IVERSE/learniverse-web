"use client";

import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

import { OrbitSystem, ProgressRing, SubjectScene } from "@/components/art/subject-art";
import { useSession } from "@/features/auth/session";
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

/** Greeting banner: welcome text next to the three subject planets orbiting a star. */
function Hero({ planets }: { planets: { id: string; glyph: string; color: string }[] }) {
  const session = useSession();
  const user = session?.state.status === "signed-in" ? session.state.user : null;
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-white ring-1 ring-blue-100">
      <div className="grid items-center md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4 p-6 md:p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Sparkles aria-hidden className="size-3.5" /> Học tập
          </p>
          <h1 className="font-heading text-3xl leading-tight font-bold md:text-4xl">
            {user ? `Chào ${givenName(user.name)}!` : "Chào bạn!"}
            <span className="block text-blue-600">Hôm nay mình bay tới hành tinh nào?</span>
          </h1>
          <p className="text-muted-foreground">Chọn một môn bên dưới để bắt đầu hành trình hôm nay.</p>
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
