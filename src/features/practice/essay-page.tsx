"use client";

import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { Button } from "@/components/ui/button";
import { errorText } from "@/features/admin/content-labels";
import { SafeMarkdown } from "@/features/community/safe-markdown";
import {
  activitiesLessonEssays,
  activitiesSubmitEssay,
  type EssayAnswerOut,
  type EssayQuestionOut,
  type EssaysOut,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { MathText } from "../learn/math-text";
import { useApi } from "../learn/use-api";

const MAX = 5000;

export const ESSAY_STATUS: Record<string, { label: string; style: string }> = {
  pending: { label: "Chờ chấm", style: "bg-amber-50 text-amber-800 ring-amber-200" },
  passed: { label: "Đạt", style: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  failed: { label: "Chưa đạt", style: "bg-rose-50 text-rose-800 ring-rose-200" },
};

function StatusChip({ status }: { status: string }) {
  const Icon = status === "passed" ? CheckCircle2 : status === "failed" ? XCircle : Clock3;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
        ESSAY_STATUS[status].style,
      )}
    >
      <Icon aria-hidden className="size-3.5" /> {ESSAY_STATUS[status].label}
    </span>
  );
}

function Answer({ a }: { a: EssayAnswerOut }) {
  return (
    <li className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <StatusChip status={a.status} />
        <span>Nộp lúc {new Date(a.submitted_at).toLocaleString("vi-VN")}</span>
      </div>
      <SafeMarkdown md={a.body_md} />
      {a.comment && (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200">
          <b>{a.grader_name ?? "Giáo viên"}</b> nhận xét: {a.comment}
        </p>
      )}
    </li>
  );
}

function EssayCard({
  q,
  index,
  subject,
  code,
  onSent,
}: {
  q: EssayQuestionOut;
  index: number;
  subject: string;
  code: string;
  onSent: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    const { data, error: e } = await activitiesSubmitEssay({
      path: { subject, code, question_id: q.id },
      body: { body },
    });
    setBusy(false);
    if (!data) return setError(errorText(e));
    setBody("");
    onSent();
  }

  return (
    <li className="space-y-3 rounded-[1.75rem] bg-white p-6 ring-1 ring-blue-100">
      <h2 className="font-heading text-lg font-bold">Câu {index + 1}</h2>
      <MathText md={q.prompt_md} />
      {q.can_submit ? (
        <form
          aria-label={`Bài làm câu ${index + 1}`}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-2"
        >
          <label className="block text-sm font-semibold text-slate-700">
            Bài làm của bạn (viết công thức trong $…$)
            <textarea
              required
              rows={8}
              maxLength={MAX}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 w-full rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {body.length}/{MAX} ký tự
            </span>
            {error && (
              <span role="alert" className="text-sm text-rose-700">
                {error}
              </span>
            )}
          </div>
          {body.trim() && (
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <p className="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">Xem trước</p>
              <SafeMarkdown md={body} />
            </div>
          )}
          <Button type="submit" disabled={busy || !body.trim()}>
            Nộp bài
          </Button>
        </form>
      ) : (
        <p className="text-sm text-slate-600">
          {q.answers[0]?.status === "passed"
            ? "Bài làm của bạn đã đạt."
            : "Bài làm của bạn đang chờ giáo viên chấm."}
        </p>
      )}
      {q.answers.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-600">Các lần nộp</h3>
          <ul aria-label={`Các lần nộp câu ${index + 1}`} className="space-y-2">
            {q.answers.map((a) => (
              <Answer key={a.id} a={a} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

/** /courses/[subject]/[code]/essays: write and submit essay answers, see the teacher's verdict (K11c-1). */
export function EssayPage() {
  const { subject, code } = useParams<{ subject: string; code: string }>();
  const [state, retry] = useApi(`essays:${subject}/${code}`, () =>
    activitiesLessonEssays({ path: { subject, code } }),
  );
  // Keep showing the last list while it reloads after a submit, so the page does not flash and the
  // confirmation below stays on screen.
  const [last, setLast] = useState<EssaysOut | null>(null);
  const [notice, setNotice] = useState("");
  if (state.status === "ready" && state.data !== last) setLast(state.data);
  const data = state.status === "ready" ? state.data : last;

  if (!data) {
    if (state.status === "loading") return <PageSkeleton />;
    return state.status === "error" && state.notFound ? (
      <ErrorState title="Không tìm thấy bài học" description="Bài học này không có trong môn đã chọn." />
    ) : (
      <ErrorState onRetry={retry} />
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={`/courses/${subject}/${code}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" /> Về bài học
      </Link>
      <h1 className="font-heading text-3xl font-extrabold text-slate-900">Tự luận</h1>
      <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-100">
        Bài tự luận do giáo viên chấm <b>Đạt</b> hoặc <b>Chưa đạt</b>, kèm nhận xét. Bài này không tính sao.
        Nếu chưa đạt, bạn được nộp lại.
      </p>
      {notice && (
        <p
          role="status"
          className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200"
        >
          {notice}
        </p>
      )}
      {data.items.length === 0 && <p className="text-muted-foreground">Bài học này chưa có câu tự luận.</p>}
      <ol className="space-y-4">
        {data.items.map((q, i) => (
          <EssayCard
            key={q.id}
            q={q}
            index={i}
            subject={subject}
            code={code}
            onSent={() => {
              setNotice(`Đã nộp bài câu ${i + 1}. Giáo viên sẽ chấm và báo kết quả cho bạn.`);
              retry();
            }}
          />
        ))}
      </ol>
    </div>
  );
}
