"use client";

import { Flag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { moderationReportContent, type ReportReason } from "@/lib/api-client";

import { apiErrorMessage } from "@/lib/api-error";

import { errorCode } from "../practice/activity-info";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam hoặc quảng cáo" },
  { value: "abuse", label: "Xúc phạm, lăng mạ" },
  { value: "inappropriate", label: "Nội dung không phù hợp" },
  { value: "other", label: "Lý do khác" },
];

/** Report a post or a comment: pick a reason, add a note, send it to the admins (spec 2.5). */
export function ReportDialog({
  targetType,
  targetId,
  onClose,
}: {
  targetType: "post" | "comment";
  targetId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done" | string>("form");
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async () => {
    setState("sending");
    const { error, response } = await moderationReportContent({
      body: { target_type: targetType, target_id: targetId, reason, note },
    });
    if (!error && response?.ok) return setState("done");
    const code = errorCode(error);
    setState(
      code === "already_reported"
        ? "Bạn đã báo cáo nội dung này rồi. Quản trị viên sẽ xem xét."
        : code === "cannot_report_own"
          ? "Bạn không thể báo cáo nội dung của chính mình."
          : (apiErrorMessage(error) ?? "Chưa gửi được báo cáo. Bạn thử lại nhé."),
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.75rem] bg-white p-6 shadow-2xl"
      >
        <h2 id="report-title" className="flex items-center gap-2 font-heading text-xl font-bold">
          <Flag aria-hidden className="size-5 text-rose-600" />
          Báo cáo {targetType === "post" ? "bài đăng" : "bình luận"}
        </h2>
        {state === "done" ? (
          <>
            <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Cảm ơn bạn. Quản trị viên sẽ xem xét nội dung này.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Đóng
            </button>
          </>
        ) : (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-slate-700">Lý do</legend>
              {REASONS.map((r, i) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 ring-1 ring-slate-200 has-[:checked]:bg-rose-50 has-[:checked]:ring-rose-300"
                >
                  <input
                    ref={i === 0 ? first : undefined}
                    type="radio"
                    name="reason"
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-rose-600"
                  />
                  {r.label}
                </label>
              ))}
            </fieldset>
            <label className="block text-sm font-semibold text-slate-700">
              Mô tả thêm (không bắt buộc)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                className="mt-1 w-full rounded-2xl bg-white p-3 text-sm font-normal ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
            {state !== "form" && state !== "sending" && (
              <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
                {state}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={state === "sending"}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {state === "sending" ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
