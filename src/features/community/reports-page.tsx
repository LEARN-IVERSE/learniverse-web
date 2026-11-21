"use client";

import { Check, Eye, EyeOff, Lock, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import {
  adminLockUser,
  moderationAdminReports,
  moderationAdminResolve,
  moderationAdminReview,
  type ReportOut,
  type ReportStatus,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { useApi } from "../learn/use-api";
import { timeAgo } from "./time-ago";

const REASONS = { spam: "Spam", abuse: "Xúc phạm", inappropriate: "Không phù hợp", other: "Khác" } as const;
const STATUS_LABEL: Record<ReportStatus, string> = { new: "Mới", reviewed: "Đã xem", resolved: "Đã xử lý" };
const ACTION_LABEL = { keep: "Giữ nội dung", hide: "Đã ẩn", delete: "Đã xóa" } as const;
const STATE_LABEL: Record<string, string> = {
  visible: "Đang hiển thị",
  hidden: "Đang bị ẩn",
  deleted: "Đã bị xóa",
  gone: "Không còn",
};

function ReportCard({ report, onChanged }: { report: ReportOut; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const run = async (job: () => Promise<unknown>) => {
    setBusy(true);
    await job();
    setBusy(false);
    onChanged();
  };
  const path = { report_id: report.id };
  const btn =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition disabled:opacity-50";
  const done = report.status === "resolved";

  return (
    <li className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span
          className={cn(
            "rounded-full px-2.5 py-1",
            report.status === "new" && "bg-rose-100 text-rose-700",
            report.status === "reviewed" && "bg-amber-100 text-amber-800",
            done && "bg-emerald-100 text-emerald-700",
          )}
        >
          {STATUS_LABEL[report.status]}
          {report.action && ` · ${ACTION_LABEL[report.action]}`}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          {report.target_type === "post" ? "Bài đăng" : "Bình luận"} · {REASONS[report.reason]}
        </span>
        {report.report_count > 1 && (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-700">
            {report.report_count} người báo cáo
          </span>
        )}
        <span className="ml-auto font-normal text-muted-foreground">{timeAgo(report.created_at)}</span>
      </div>
      <p className="mt-3 text-sm text-slate-800">{report.target_excerpt || "(nội dung không còn)"}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Người đăng: <strong>{report.target_author_name ?? "?"}</strong>
        {report.target_author_locked && " (đã bị khóa)"} · Người báo cáo: {report.reporter_name} ·{" "}
        {STATE_LABEL[report.target_state]}
      </p>
      {report.note && (
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">“{report.note}”</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {report.post_id && report.target_state !== "gone" && (
          <Link
            href={`/community/posts/${report.post_id}`}
            className={cn(btn, "bg-blue-50 text-blue-700 hover:bg-blue-100")}
          >
            <Eye aria-hidden className="size-4" /> Mở nội dung
          </Link>
        )}
        {report.status === "new" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => moderationAdminReview({ path }))}
            className={cn(btn, "bg-amber-50 text-amber-800 hover:bg-amber-100")}
          >
            <Check aria-hidden className="size-4" /> Đã xem
          </button>
        )}
        {!done && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => moderationAdminResolve({ path, body: { action: "keep" } }))}
              className={cn(btn, "bg-emerald-50 text-emerald-800 hover:bg-emerald-100")}
            >
              <ShieldCheck aria-hidden className="size-4" /> Giữ
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => moderationAdminResolve({ path, body: { action: "hide" } }))}
              className={cn(btn, "bg-slate-100 text-slate-800 hover:bg-slate-200")}
            >
              <EyeOff aria-hidden className="size-4" /> Ẩn
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => moderationAdminResolve({ path, body: { action: "delete" } }))}
              className={cn(btn, "bg-rose-50 text-rose-700 hover:bg-rose-100")}
            >
              <Trash2 aria-hidden className="size-4" /> Xóa
            </button>
          </>
        )}
        {report.target_author_id && !report.target_author_locked && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(() =>
                adminLockUser({
                  path: { user_id: report.target_author_id as string },
                  body: { reason: "Vi phạm nội quy (từ báo cáo vi phạm)" },
                }),
              )
            }
            className={cn(btn, "ml-auto text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50")}
          >
            <Lock aria-hidden className="size-4" /> Khóa tài khoản người đăng
          </button>
        )}
      </div>
    </li>
  );
}

const FILTERS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "new", label: "Mới" },
  { value: "reviewed", label: "Đã xem" },
  { value: "resolved", label: "Đã xử lý" },
];

/** /admin/reports: every report with the content, the reason and the admin's decision (K7-D6). */
export function ReportsPage() {
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [version, setVersion] = useState(0);
  const [state, retry] = useApi(`reports:${filter}:${version}`, () =>
    moderationAdminReports({ query: { status: filter === "all" ? undefined : filter } }),
  );

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Lọc báo cáo" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-black/10 hover:bg-blue-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {state.status === "loading" && <PageSkeleton />}
      {state.status === "error" && <ErrorState onRetry={retry} />}
      {state.status === "ready" &&
        (state.data.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Không có báo cáo nào"
            description="Khi có người báo cáo, nội dung sẽ hiện ở đây."
          />
        ) : (
          <ul className="space-y-4" aria-label="Danh sách báo cáo">
            {state.data.map((r) => (
              <ReportCard key={r.id} report={r} onChanged={() => setVersion((v) => v + 1)} />
            ))}
          </ul>
        ))}
    </div>
  );
}
