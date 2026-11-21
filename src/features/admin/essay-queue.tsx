"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { SafeMarkdown } from "@/features/community/safe-markdown";
import { MathText } from "@/features/learn/math-text";
import { useApi } from "@/features/learn/use-api";
import { ESSAY_STATUS } from "@/features/practice/essay-page";
import { adminEssaysEssayQueue, adminEssaysGradeEssay, type EssayRowOut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { errorText } from "./content-labels";

type Status = "pending" | "passed" | "failed";

/** /admin/essays: essays waiting for a hand grade, newest first within each tab (K11c-1). */
export function EssayQueue() {
  const [status, setStatus] = useState<Status>("pending");
  const [subject, setSubject] = useState("");
  const [list, retry] = useApi(`admin:essays:${status}:${subject}`, () =>
    adminEssaysEssayQueue({ query: { status, subject: subject || undefined } }),
  );
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex gap-2">
          {(["pending", "passed", "failed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold ring-1",
                status === s
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-200",
              )}
            >
              {s === "pending" ? "Chờ chấm" : ESSAY_STATUS[s].label}
            </button>
          ))}
        </div>
        {list.status === "ready" && list.data.subjects.length > 1 && (
          <label className="ml-auto text-sm">
            <span className="sr-only">Môn học</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200"
            >
              <option value="">Tất cả các môn</option>
              {list.data.subjects.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={cn(
            "rounded-2xl px-4 py-2 text-sm ring-1",
            notice.ok ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200",
          )}
        >
          {notice.text}
        </p>
      )}
      {list.status === "error" && <ErrorState onRetry={retry} />}
      {list.status === "loading" && <p className="text-sm text-muted-foreground">Đang tải…</p>}
      {list.status === "ready" && list.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Không có bài nào.</p>
      )}
      {list.status === "ready" && (
        <ul aria-label="Bài tự luận" className="space-y-3">
          {list.data.items.map((e) => (
            <EssayItem
              key={e.id}
              e={e}
              onDone={(text) => {
                setNotice({ ok: true, text });
                retry();
              }}
              onError={(text) => setNotice({ ok: false, text })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EssayItem({
  e,
  onDone,
  onError,
}: {
  e: EssayRowOut;
  onDone: (text: string) => void;
  onError: (text: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function grade(passed: boolean) {
    setBusy(true);
    const { data, error } = await adminEssaysGradeEssay({
      path: { essay_id: e.id },
      body: { passed, comment },
    });
    setBusy(false);
    if (data) onDone(passed ? "Đã chấm Đạt và báo cho học sinh." : "Đã chấm Chưa đạt và gửi nhận xét.");
    else onError(errorText(error));
  }

  return (
    <li className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          {e.subject_name}
        </span>
        <span className="font-semibold">
          {e.lesson_label ? `${e.lesson_label}: ` : ""}
          {e.lesson_title}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {e.student_name} · {new Date(e.submitted_at).toLocaleString("vi-VN")}
        </span>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
        <p className="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">Đề bài</p>
        <MathText md={e.prompt_md} />
      </div>
      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
        <p className="mb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">Bài làm</p>
        <SafeMarkdown md={e.body_md} />
      </div>
      {e.status === "pending" ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">
            Nhận xét (bắt buộc khi Chưa đạt)
            <input
              className="w-full rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200"
              value={comment}
              onChange={(ev) => setComment(ev.target.value)}
              placeholder="Ví dụ: Thiếu bước chuyển vế"
            />
          </label>
          <Button type="button" disabled={busy} onClick={() => void grade(true)}>
            <Check aria-hidden className="size-4" /> Đạt
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || comment.trim().length < 3}
            onClick={() => void grade(false)}
          >
            <X aria-hidden className="size-4" /> Chưa đạt
          </Button>
        </div>
      ) : (
        <p className="text-sm text-slate-700">
          <b>{e.grader_name ?? "Giáo viên"}</b> chấm <b>{ESSAY_STATUS[e.status].label}</b>
          {e.comment ? `: ${e.comment}` : "."}
        </p>
      )}
    </li>
  );
}
