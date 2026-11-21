"use client";

import Link from "next/link";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { useApi } from "@/features/learn/use-api";
import { adminCommunityPoints } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** /admin/points: look up one account and read every line of its contribution points (K11c-2). */
export function PointsAdmin() {
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [data, retry] = useApi(`admin:points:${q}:${userId}`, () =>
    adminCommunityPoints({ query: { q, user_id: userId ?? undefined } }),
  );

  return (
    <div className="space-y-4">
      <form
        aria-label="Tìm tài khoản"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(draft);
          setUserId(null);
        }}
      >
        <input
          type="search"
          aria-label="Tên hoặc email"
          placeholder="Tìm theo tên hoặc email…"
          className="min-w-0 flex-1 rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Tìm
        </button>
      </form>
      {data.status === "error" && <ErrorState onRetry={retry} />}
      {data.status === "ready" && (
        <>
          {!userId && data.data.users.length > 0 && (
            <ul aria-label="Kết quả tìm kiếm" className="space-y-1">
              {data.data.users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => setUserId(u.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-2.5 text-left text-sm ring-1 ring-slate-100 hover:bg-blue-50"
                  >
                    <span className="font-semibold">{u.name}</span>
                    <span className="text-muted-foreground">{u.email}</span>
                    <span className="ml-auto font-bold">{u.total} điểm</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!userId && q && data.data.users.length === 0 && (
            <p className="text-sm text-muted-foreground">Không tìm thấy tài khoản nào.</p>
          )}
          {data.data.selected && (
            <section className="space-y-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-100">
              <header className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-bold">{data.data.selected.name}</h2>
                <span className="text-sm text-muted-foreground">{data.data.selected.email}</span>
                <span className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                  Tổng: {data.data.selected.total} điểm
                </span>
                <button
                  type="button"
                  onClick={() => setUserId(null)}
                  className="text-sm font-semibold text-blue-700"
                >
                  Chọn tài khoản khác
                </button>
              </header>
              <p className="text-xs text-muted-foreground">
                Chỉ để xem. Muốn điều chỉnh điểm, hãy Ẩn hoặc Xóa nội dung ở mục Cộng đồng.
              </p>
              {data.data.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tài khoản này chưa có dòng điểm nào.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500">
                        <th className="p-2">Lúc</th>
                        <th className="p-2">Điểm</th>
                        <th className="p-2">Lý do</th>
                        <th className="p-2">Nội dung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.rows.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100 align-top">
                          <td className="p-2 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td
                            className={cn(
                              "p-2 font-bold",
                              r.delta < 0 ? "text-rose-700" : "text-emerald-700",
                            )}
                          >
                            {r.delta > 0 ? `+${r.delta}` : r.delta}
                          </td>
                          <td className="p-2">{r.reason_text}</td>
                          <td className="p-2">
                            {r.post_id ? (
                              <Link
                                href={`/community/posts/${r.post_id}`}
                                className="text-blue-700 hover:underline"
                              >
                                {r.target_type === "post" ? "Bài: " : "Bình luận: "}
                                {r.excerpt}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">(nội dung không còn)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
