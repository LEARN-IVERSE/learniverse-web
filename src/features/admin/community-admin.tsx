"use client";

import { Eye, EyeOff, Flag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { Pagination } from "@/features/community/pagination";
import { ReportsPage } from "@/features/community/reports-page";
import { timeAgo } from "@/features/community/time-ago";
import { useApi } from "@/features/learn/use-api";
import {
  adminCommunityCommunityAct,
  adminCommunityCommunityItems,
  type CommunityItemOut,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { errorText } from "./content-labels";

type Tab = "post" | "comment" | "reports";
type State = "" | "visible" | "hidden" | "deleted";

const STATE_LABEL: Record<string, { text: string; style: string }> = {
  visible: { text: "Đang hiện", style: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  hidden: { text: "Đã ẩn", style: "bg-amber-50 text-amber-800 ring-amber-200" },
  deleted: { text: "Đã xóa", style: "bg-slate-100 text-slate-600 ring-slate-200" },
};

const CONFIRM = {
  hide: "Ẩn nội dung này? Học sinh sẽ không thấy nữa và điểm đóng góp của nó bị thu lại.",
  delete: "Xóa nội dung này? Không hoàn tác được; điểm đóng góp của nó bị thu lại.",
  unhide: "Hiện lại nội dung này? Điểm đã thu lại sẽ KHÔNG được trả.",
} as const;

/** /admin/community: moderate posts and comments; reports are a tab of the same section (K11c-2). */
export function CommunityAdmin() {
  const [tab, setTab] = useState<Tab>("post");
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Loại nội dung" className="flex flex-wrap gap-2">
        {(
          [
            ["post", "Bài đăng"],
            ["comment", "Bình luận"],
            ["reports", "Báo cáo vi phạm"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold ring-1",
              tab === key
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-700 ring-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "reports" ? <ReportsPage /> : <ItemList key={tab} kind={tab} />}
    </div>
  );
}

function ItemList({ kind }: { kind: "post" | "comment" }) {
  const [box, setBox] = useState("");
  const [state, setState] = useState<State>("");
  const [reported, setReported] = useState(false);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [list, retry] = useApi(
    `admin:community:${kind}:${box}:${state}:${reported}:${q}:${page}:${version}`,
    () =>
      adminCommunityCommunityItems({
        query: { kind, box: box || undefined, state: state || undefined, reported, q, page },
      }),
  );

  async function act(item: CommunityItemOut, action: "hide" | "unhide" | "delete", done: string) {
    if (!window.confirm(CONFIRM[action])) return;
    const { data, error } = await adminCommunityCommunityAct({
      path: { kind: item.kind, target_id: item.id, action },
    });
    setNotice(data ? { ok: true, text: done } : { ok: false, text: errorText(error) });
    if (data) setVersion((v) => v + 1);
  }

  const field = "rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200";
  return (
    <div className="space-y-3">
      <form
        aria-label="Bộ lọc"
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(draft);
          setPage(1);
        }}
      >
        <select
          aria-label="Box (môn học)"
          className={field}
          value={box}
          onChange={(e) => {
            setBox(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Mọi Box</option>
          {list.status === "ready" &&
            list.data.boxes.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
        </select>
        <select
          aria-label="Trạng thái"
          className={field}
          value={state}
          onChange={(e) => {
            setState(e.target.value as State);
            setPage(1);
          }}
        >
          <option value="">Mọi trạng thái</option>
          <option value="visible">Đang hiện</option>
          <option value="hidden">Đã ẩn</option>
          <option value="deleted">Đã xóa</option>
        </select>
        <label className="inline-flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={reported}
            onChange={(e) => {
              setReported(e.target.checked);
              setPage(1);
            }}
          />{" "}
          Chỉ nội dung đang bị báo cáo
        </label>
        <input
          type="search"
          aria-label="Tìm theo chữ hoặc tác giả"
          placeholder="Tìm theo chữ hoặc tác giả…"
          className={cn(field, "min-w-48 flex-1")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </form>
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
      {list.status === "ready" && (
        <>
          <p className="text-xs text-muted-foreground">{list.data.total} kết quả</p>
          {list.data.items.length === 0 && (
            <p className="text-sm text-muted-foreground">Không có nội dung nào.</p>
          )}
          <ul aria-label={kind === "post" ? "Bài đăng" : "Bình luận"} className="space-y-2">
            {list.data.items.map((item) => (
              <ItemRow key={item.id} item={item} onAct={(a, d) => void act(item, a, d)} />
            ))}
          </ul>
          <Pagination page={list.data.page} pages={list.data.pages} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function ItemRow({
  item,
  onAct,
}: {
  item: CommunityItemOut;
  onAct: (action: "hide" | "unhide" | "delete", done: string) => void;
}) {
  const st = STATE_LABEL[item.state];
  const btn =
    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-50";
  return (
    <li className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
          {item.box_name}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 font-semibold ring-1", st.style)}>{st.text}</span>
        {item.open_reports > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 ring-1 ring-rose-200">
            <Flag aria-hidden className="size-3" /> {item.open_reports} báo cáo
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {item.author_name} · {timeAgo(item.created_at)}
        </span>
      </div>
      <p className="font-semibold text-slate-900">
        {item.kind === "comment" && <span className="font-normal text-muted-foreground">Dưới bài: </span>}
        {item.title}
      </p>
      <p className="text-sm break-words whitespace-pre-wrap text-slate-700">{item.excerpt}</p>
      <div className="flex flex-wrap gap-2">
        <Link href={`/community/posts/${item.post_id}`} className={btn}>
          Mở bài
        </Link>
        {item.state === "visible" && (
          <button type="button" className={btn} onClick={() => onAct("hide", "Đã ẩn nội dung.")}>
            <EyeOff aria-hidden className="size-4" /> Ẩn
          </button>
        )}
        {item.state === "hidden" && (
          <button type="button" className={btn} onClick={() => onAct("unhide", "Đã hiện lại nội dung.")}>
            <Eye aria-hidden className="size-4" /> Hiện lại
          </button>
        )}
        {item.state !== "deleted" && (
          <button
            type="button"
            className={cn(btn, "text-rose-700")}
            onClick={() => onAct("delete", "Đã xóa nội dung.")}
          >
            <Trash2 aria-hidden className="size-4" /> Xóa
          </button>
        )}
      </div>
    </li>
  );
}
