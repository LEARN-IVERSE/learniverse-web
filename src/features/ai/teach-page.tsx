"use client";

import { ArrowLeft, GraduationCap, RefreshCw, Send, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Mascot } from "@/components/brand/mascot";
import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { SafeMarkdown } from "@/features/community/safe-markdown";
import {
  aiTeachingAnswer,
  aiTeachingGrade,
  aiTeachingOverview,
  aiTeachingStart,
  catalogLesson,
  type TeachSessionOut,
} from "@/lib/api-client";

import { useApi } from "../learn/use-api";
import { useStudyTimer } from "../progress/use-study-timer";
import { readSse } from "./sse";

const MAX_ANSWER = 2000;

const FALLBACK = "Có lỗi khi kết nối. Bạn thử lại nhé.";

/** The Vietnamese message of an API error returned by the generated client. */
function messageOf(error: unknown): string {
  const message = (error as { error?: { message?: unknown } } | undefined)?.error?.message;
  return typeof message === "string" && message ? message : FALLBACK;
}

async function errorMessage(res: Response | undefined): Promise<string> {
  try {
    const body = (await res?.json()) as { error?: { message?: string } } | undefined;
    if (body?.error?.message) return body.error.message;
  } catch {
    // not JSON
  }
  return "Có lỗi khi kết nối. Bạn thử lại nhé.";
}

function Progress({ answered }: { answered: number }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Đã giảng ${answered}/5 lượt`}>
      <div className="flex flex-1 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-2 flex-1 rounded-full ${n <= answered ? "bg-violet-500" : "bg-violet-100"}`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-violet-700">Lượt {Math.min(answered + 1, 5)}/5</span>
    </div>
  );
}

/** /courses/[subject]/[code]/teach: "Dạy AI" (K10). The learner explains; the AI asks; the server grades. */
export function TeachPage() {
  const { subject, code } = useParams<{ subject: string; code: string }>();
  const [lesson, retryLesson] = useApi(`lesson:${subject}/${code}`, () =>
    catalogLesson({ path: { subject, code } }),
  );
  const [overview, retryOverview] = useApi(`teach:${subject}/${code}`, () =>
    aiTeachingOverview({ path: { subject, code } }),
  );
  const [session, setSession] = useState<TeachSessionOut | null>(null);
  const [asking, setAsking] = useState<string | null>(null); // the AI question being written
  const [busy, setBusy] = useState<"start" | "ask" | "answer" | "grade" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  useStudyTimer(subject, code, "ai_teaching", lesson.status === "ready");

  if (lesson.status === "loading" || overview.status === "loading") return <PageSkeleton />;
  if (lesson.status === "error")
    return lesson.notFound ? (
      <ErrorState title="Không tìm thấy bài học" description="Bài học này không có trong môn đã chọn." />
    ) : (
      <ErrorState onRetry={retryLesson} />
    );
  if (overview.status === "error") return <ErrorState onRetry={retryOverview} />;

  const l = lesson.data;
  const current = session ?? overview.data.session;
  const sessionsLeft = left ?? overview.data.sessions_left;
  const paused = overview.data.enabled === false; // an admin switched AI off (K11c-3)
  const earned = overview.data.earned || Boolean(current?.result?.star_earned);
  const open = current && (current.status === "in_progress" || current.status === "grading_failed");
  const pending = current?.turns.at(-1)?.answer === null ? current.turns.at(-1) : undefined;

  async function ask(id: string) {
    setBusy("ask");
    setNotice(null);
    setAsking("");
    let failed: string | null = null;
    try {
      const res = await fetch(`/api/v1/ai-teaching/sessions/${id}/question`, {
        method: "POST",
        headers: { Accept: "text/event-stream" },
      });
      if (!res.ok || !res.body) failed = await errorMessage(res);
      else
        await readSse(res.body, (e) => {
          if (e.event === "delta") setAsking((t) => (t ?? "") + e.data.text);
          else if (e.event === "error") failed = e.data.message;
        });
    } catch {
      failed = "Mất kết nối. Bạn thử lại nhé.";
    }
    const { data } = await fetch(`/api/v1/ai-teaching/sessions/${id}`)
      .then(async (r) => ({ data: r.ok ? ((await r.json()) as TeachSessionOut) : undefined }))
      .catch(() => ({ data: undefined }));
    if (data) setSession(data);
    setAsking(null);
    setNotice(failed);
    setBusy(null);
  }

  async function start() {
    setBusy("start");
    setNotice(null);
    const { data, error } = await aiTeachingStart({ body: { subject, code } });
    if (!data) {
      setNotice(messageOf(error));
      setBusy(null);
      return;
    }
    setSession(data);
    setLeft(Math.max(sessionsLeft - 1, 0));
    await ask(data.id);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!current || !draft.trim()) return;
    setBusy(current.answered === 4 ? "grade" : "answer");
    setNotice(null);
    const { data, error } = await aiTeachingAnswer({
      path: { session_id: current.id },
      body: { text: draft.trim() },
    });
    if (!data) {
      setNotice(messageOf(error));
      setBusy(null);
      return;
    }
    setDraft("");
    setSession(data);
    if (data.status === "in_progress") await ask(data.id);
    else setBusy(null);
  }

  async function regrade() {
    if (!current) return;
    setBusy("grade");
    setNotice(null);
    const { data, error } = await aiTeachingGrade({ path: { session_id: current.id } });
    if (data) setSession(data);
    else setNotice(messageOf(error));
    setBusy(null);
  }

  const result = current?.status === "completed" ? current.result : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/courses/${subject}`}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" /> {l.subject_name}
      </Link>

      <header className="rounded-[1.75rem] bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white">
        <p className="flex items-center gap-2 text-xs font-bold tracking-[.2em] uppercase">
          <GraduationCap aria-hidden className="size-4" /> Dạy AI
        </p>
        <h1 className="mt-2 font-heading text-3xl leading-tight font-extrabold">
          {l.label ? `${l.label}. ` : ""}
          {l.title}
        </h1>
        <p className="mt-2 text-sm text-violet-100">
          Bạn là thầy/cô giáo, Sao Nhí là học sinh chưa hiểu bài. Giảng lại cho Sao Nhí qua 5 lượt hỏi–đáp;
          đạt từ 7/10 được 1 sao.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {earned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold">
              <Star aria-hidden className="size-4 fill-amber-300 text-amber-300" /> Đã có sao Dạy AI
            </span>
          )}
          <span aria-live="polite">Hôm nay còn {sessionsLeft} lượt Dạy AI</span>
        </p>
      </header>

      {notice && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {notice}
        </p>
      )}

      {open && current && (
        <section
          aria-label="Buổi dạy"
          className="space-y-4 rounded-[1.75rem] bg-white p-5 ring-1 ring-violet-100"
        >
          <Progress answered={current.answered} />
          <ol className="space-y-3">
            {current.turns.map((t) => (
              <li key={t.n} className="space-y-2">
                <div className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-violet-100"
                  >
                    <Mascot className="size-7" />
                  </span>
                  <div className="rounded-2xl rounded-tl-sm bg-violet-50 p-3">
                    <p className="text-xs font-semibold text-violet-700">Sao Nhí hỏi (lượt {t.n})</p>
                    <SafeMarkdown md={t.question} className="text-base" />
                  </div>
                </div>
                {t.answer !== null && (
                  <p className="ml-10 rounded-2xl rounded-tr-sm bg-blue-600 p-3 text-base whitespace-pre-wrap text-white">
                    {t.answer}
                  </p>
                )}
              </li>
            ))}
            {asking !== null && (
              <li className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-violet-100"
                >
                  <Mascot className="size-7" />
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-violet-50 p-3 text-base">
                  {asking ? (
                    <SafeMarkdown md={asking} />
                  ) : (
                    <p className="text-muted-foreground">Sao Nhí đang nghĩ câu hỏi…</p>
                  )}
                </div>
              </li>
            )}
          </ol>

          {current.status === "in_progress" && pending && busy === null && (
            <form onSubmit={submit} className="space-y-2">
              <label htmlFor="teach-answer" className="text-sm font-semibold">
                Lời giảng của bạn
              </label>
              <textarea
                id="teach-answer"
                value={draft}
                maxLength={MAX_ANSWER}
                rows={4}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Giải thích cho Sao Nhí bằng lời của bạn, có thể kèm ví dụ…"
                className="w-full resize-y rounded-2xl bg-muted px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {draft.length}/{MAX_ANSWER}
                </span>
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Send aria-hidden className="size-4" />{" "}
                  {current.answered === 4 ? "Gửi và chấm bài" : "Gửi lời giảng"}
                </button>
              </div>
            </form>
          )}
          {current.status === "in_progress" && !pending && busy === null && asking === null && (
            <button
              type="button"
              onClick={() => void ask(current.id)}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white"
            >
              <RefreshCw aria-hidden className="size-4" />{" "}
              {current.answered === 0 ? "Bắt đầu" : "Tiếp tục buổi dạy"}
            </button>
          )}
          {busy === "grade" && (
            <p className="text-sm font-semibold text-violet-700">Sao Nhí đang chấm bài…</p>
          )}
          {current.status === "grading_failed" && busy === null && (
            <div className="space-y-2 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p className="text-sm font-semibold text-amber-900">
                Chưa chấm được bài lần này. Bạn bấm “Chấm lại” nhé, không cần dạy lại từ đầu.
              </p>
              <button
                type="button"
                onClick={() => void regrade()}
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white"
              >
                Chấm lại
              </button>
            </div>
          )}
        </section>
      )}

      {result && (
        <section
          aria-label="Kết quả Dạy AI"
          className="space-y-4 rounded-[1.75rem] bg-white p-6 ring-1 ring-violet-100"
        >
          <div className="flex items-center gap-4">
            <p
              className={`font-heading text-5xl font-extrabold ${result.passed ? "text-emerald-600" : "text-amber-600"}`}
            >
              {result.score}/10
            </p>
            <div>
              <p className="font-semibold">{result.passed ? "Đạt yêu cầu!" : "Chưa đạt 7/10"}</p>
              <p className="text-sm text-muted-foreground">
                {result.star_earned
                  ? "Bạn nhận được 1 sao Dạy AI."
                  : result.passed
                    ? "Bạn đã có sao Dạy AI của bài này từ trước."
                    : "Dạy lại để nhận sao nhé."}
              </p>
            </div>
          </div>
          <p className="text-base">{result.feedback}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-800">Kiến thức đã nắm</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-800">Kiến thức cần cải thiện</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {result.improvements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Kết quả của AI chỉ để tham khảo và có thể chưa chính xác.
          </p>
        </section>
      )}

      {!open && (
        <div className="space-y-3 rounded-[1.75rem] bg-white p-6 ring-1 ring-violet-100">
          {!result && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Sao Nhí sẽ hỏi 5 câu về bài này; bạn giảng lại bằng lời của mình.</li>
              <li>Hết 5 lượt, Sao Nhí chấm theo thang 10: đúng, đủ, giải thích rõ và có ví dụ.</li>
              <li>Mỗi lời giảng tối đa {MAX_ANSWER} ký tự.</li>
            </ul>
          )}
          <button
            type="button"
            disabled={busy !== null || sessionsLeft === 0 || paused}
            onClick={() => void start()}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            <GraduationCap aria-hidden className="size-5" /> {result ? "Dạy lại" : "Bắt đầu dạy"}
          </button>
          {paused && (
            <p role="status" className="text-sm text-amber-800">
              AI đang tạm nghỉ. Bạn quay lại sau nhé!
            </p>
          )}
          {!paused && sessionsLeft === 0 && (
            <p className="text-sm text-muted-foreground">
              Hôm nay bạn đã dùng hết lượt Dạy AI. Mai quay lại nhé!
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Để bảo vệ dữ liệu cá nhân, bạn đừng gửi tên, email, ảnh cá nhân hay bạn bè cho Sao Nhí nhé.
      </p>
    </div>
  );
}
