"use client";

import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { useApi } from "@/features/learn/use-api";
import { adminAudit } from "@/lib/api-client";

const ACTION_LABEL: Record<string, string> = {
  "user.lock": "Khóa tài khoản",
  "user.unlock": "Mở khóa tài khoản",
  "user.role": "Đổi vai trò / quyền",
};

/** /admin/audit: every change made in the admin area, newest first (K11-D7). */
export function AuditAdmin() {
  const [page, setPage] = useState(1);
  const [state, retry] = useApi(`admin:audit:${page}`, () => adminAudit({ query: { page } }));
  if (state.status === "error") return <ErrorState onRetry={retry} />;
  if (state.status === "loading") return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  const { items, pages } = state.data;
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-muted-foreground">Chưa có thao tác nào.</p>}
      <ol aria-label="Nhật ký quản trị" className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-100">
            <p>
              <span className="font-semibold">{i.actor_name ?? "Tài khoản đã xóa"}</span> ·{" "}
              {ACTION_LABEL[i.action] ?? i.action}
              <span className="ml-2 text-xs text-muted-foreground">
                {new Date(i.created_at).toLocaleString("vi-VN")}
              </span>
            </p>
            <p className="mt-1 text-xs break-all text-slate-500">
              {i.target_type} {i.target_id}
              {i.after ? ` → ${JSON.stringify(i.after)}` : ""}
            </p>
          </li>
        ))}
      </ol>
      {pages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 disabled:opacity-50"
          >
            Trang trước
          </button>
          <span>
            Trang {page}/{pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
