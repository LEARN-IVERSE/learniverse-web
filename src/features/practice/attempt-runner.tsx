"use client";

import { Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import {
  type Activity,
  type AttemptOut,
  activitiesStartAttempt,
  activitiesSubmit,
  type ResultOut,
} from "@/lib/api-client";

import { errorCode } from "./activity-info";
import { type AnswerValue, QuestionField } from "./question-field";
import { ResultView } from "./result-view";

type State =
  | { step: "loading" }
  | { step: "closed"; reason: string }
  | { step: "error" }
  | { step: "doing"; attempt: AttemptOut }
  | { step: "result"; result: ResultOut };

const CLOSED: Record<string, string> = {
  activity_not_ready: "Chức năng này chưa mở: kho câu hỏi chưa đủ. Nhóm nội dung sẽ bổ sung sớm.",
  read_required: "Hãy đọc hết phần Lý thuyết trước khi làm 5 câu kiểm tra.",
  activity_not_available: "Mục này không có chức năng này.",
};

/**
 * Start (or resume) an attempt, answer it, submit and show the result. Answers live in memory only
 * (K5-D6): reloading keeps the same questions but clears the choices.
 */
export function AttemptRunner({
  subject,
  code,
  activity,
}: {
  subject: string;
  code: string;
  activity: Activity;
}) {
  const [state, setState] = useState<State>({ step: "loading" });
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void activitiesStartAttempt({ path: { subject, code }, body: { activity } }).then(({ data, error }) => {
      if (cancelled) return;
      if (data) {
        setAnswers({});
        setState({ step: "doing", attempt: data });
        return;
      }
      const reason = CLOSED[errorCode(error) ?? ""];
      setState(reason ? { step: "closed", reason } : { step: "error" });
    });
    return () => {
      cancelled = true;
    };
  }, [subject, code, activity, round]);

  const restart = useCallback(() => {
    setState({ step: "loading" });
    setConfirming(false);
    setRound((n) => n + 1);
  }, []);

  if (state.step === "loading") return <PageSkeleton />;
  if (state.step === "error") return <ErrorState onRetry={restart} />;
  if (state.step === "closed")
    return (
      <p
        role="status"
        className="rounded-[1.75rem] bg-slate-50 p-6 text-center text-slate-600 ring-1 ring-slate-200"
      >
        {state.reason}
      </p>
    );
  if (state.step === "result")
    return <ResultView result={state.result} subject={subject} code={code} onRetry={restart} />;

  const { attempt } = state;
  const done = attempt.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null).length;
  const blanks = attempt.total - done;

  const send = async () => {
    setSending(true);
    const body = {
      answers: attempt.questions.map((q) => ({ question_id: q.id, answer: answers[q.id] ?? null })),
    };
    const { data } = await activitiesSubmit({ path: { attempt_id: attempt.id }, body });
    setSending(false);
    setConfirming(false);
    if (data) {
      setState({ step: "result", result: data });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else setState({ step: "error" });
  };

  return (
    <form
      aria-label="Bài làm"
      onSubmit={(e) => {
        e.preventDefault();
        if (blanks > 0 && !confirming) setConfirming(true);
        else void send();
      }}
      className="space-y-4"
    >
      <div className="sticky top-[4.5rem] z-10 rounded-full bg-white/95 px-4 py-2 ring-1 ring-blue-100">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>
            Đã làm {done}/{attempt.total} câu
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Tiến độ làm bài"
          aria-valuemin={0}
          aria-valuemax={attempt.total}
          aria-valuenow={done}
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-blue-100"
        >
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${(done / attempt.total) * 100}%` }}
          />
        </div>
      </div>

      {attempt.questions.map((q, i) => (
        <QuestionField
          key={q.id}
          index={i}
          question={q}
          value={answers[q.id] ?? null}
          onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
        />
      ))}

      {confirming && (
        <p
          role="alert"
          className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200"
        >
          Còn {blanks} câu chưa làm (câu bỏ trống tính là sai). Bấm &quot;Vẫn nộp bài&quot; để nộp.
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none disabled:opacity-60"
      >
        <Send aria-hidden className="size-4" />
        {sending ? "Đang chấm..." : confirming ? "Vẫn nộp bài" : "Nộp bài"}
      </button>
    </form>
  );
}
