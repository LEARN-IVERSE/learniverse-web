"use client";

import { Clock, Crown, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BigMedal, Confetti, RingsDecor, Sunburst } from "@/components/art/rank-art";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import {
  type ContributionRowOut,
  leaderboardContributions,
  leaderboardStudyTime,
  type MyRankOut,
  type TimeRowOut,
} from "@/lib/api-client";
import { useVisibleInterval } from "@/lib/use-visible-interval";
import { cn } from "@/lib/utils";

import { useSession } from "../auth/session";
import { UserAvatar } from "../auth/user-avatar";
import { useApi } from "../learn/use-api";
import { formatDuration } from "../progress/my-progress";

const REFRESH_MS = 60_000;

type Board = "contrib" | "time";
type Row = (ContributionRowOut | TimeRowOut) & { value: number };

const MEDALS: Record<1 | 2 | 3, { label: string; color: string; height: string }> = {
  1: { label: "Vàng", color: "#f59e0b", height: "h-36 md:h-44" },
  2: { label: "Bạc", color: "#94a3b8", height: "h-28 md:h-32" },
  3: { label: "Đồng", color: "#c2773b", height: "h-20 md:h-24" },
};

/** "dưới 1 phút", "12 phút", "1 giờ 5 phút": the study-time format of the product spec (hours / minutes). */
export function formatStudy(seconds: number): string {
  return seconds < 60 ? "dưới 1 phút" : formatDuration(seconds);
}

const fmt = (board: Board, value: number) => (board === "contrib" ? `${value} điểm` : formatStudy(value));

function toRows(board: Board, items: (ContributionRowOut | TimeRowOut)[]): Row[] {
  return items.map((r) => ({ ...r, value: "points" in r ? r.points : r.seconds }));
}

/** /leaderboard: medal hero, the two all-time boards, a TOP-3 podium, the rest of the list, and "you". */
export function RankPage() {
  const me = useSession();
  const myId = me?.state.status === "signed-in" ? me.state.user.id : null;
  const [board, setBoard] = useState<Board>("contrib");
  const [version, setVersion] = useState(0);

  // The server recomputes the boards on request; ask again every minute (K8-D5).
  useVisibleInterval(() => setVersion((v) => v + 1), REFRESH_MS);

  const [contrib, retryContrib] = useApi(`contrib:${version}`, () => leaderboardContributions());
  const [time, retryTime] = useApi(`time:${version}`, () => leaderboardStudyTime());
  const current = board === "contrib" ? contrib : time;
  const retry = board === "contrib" ? retryContrib : retryTime;

  const rows: Row[] = current.status === "ready" ? toRows(board, current.data.items) : [];
  const mine: MyRankOut | null = current.status === "ready" ? current.data.me : null;
  const leader = rows[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-blue-600 text-white">
        <Sunburst className="pointer-events-none absolute top-1/2 left-1/2 size-[60rem] -translate-x-1/2 -translate-y-1/2" />
        <Confetti />
        <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1fr_auto_1fr] md:p-10">
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold tracking-[.3em] text-blue-100 uppercase">Bảng vàng</p>
            <h1 className="mt-2 font-heading text-3xl leading-tight font-bold md:text-4xl">
              Những ngôi sao của LEARNIVERSE
            </h1>
            <p className="mt-2 text-sm text-blue-100">Toàn thời gian · cập nhật mỗi phút</p>
          </div>
          <BigMedal className="d-float mx-auto h-60 w-auto drop-shadow-[0_18px_30px_rgba(0,0,0,.28)] md:h-72" />
          <div className="mx-auto w-full max-w-xs rounded-3xl bg-white/10 p-4 ring-1 ring-white/25">
            <p className="text-[11px] font-semibold tracking-widest text-blue-100 uppercase">Đang dẫn đầu</p>
            {leader ? (
              <div className="mt-2 flex items-center gap-3">
                <span className="rounded-full bg-amber-300 p-1">
                  <UserAvatar user={leader.user} className="size-11" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-xl font-bold">{leader.user.name}</p>
                  <p className="text-sm text-blue-100">{fmt(board, leader.value)}</p>
                </div>
                <Crown aria-hidden className="ml-auto size-7 shrink-0 fill-amber-300 text-amber-300" />
              </div>
            ) : (
              <p className="mt-2 text-sm text-blue-100">Chưa có ai trên bảng. Hãy là người đầu tiên!</p>
            )}
          </div>
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Chọn bảng xếp hạng"
        className="mx-auto flex w-full max-w-lg gap-1 rounded-full bg-white p-1 ring-1 ring-black/5"
      >
        <BoardTab
          active={board === "contrib"}
          onClick={() => setBoard("contrib")}
          icon={Users}
          label="Thành viên tích cực"
        />
        <BoardTab
          active={board === "time"}
          onClick={() => setBoard("time")}
          icon={Clock}
          label="Thời gian học tập"
        />
      </div>

      {current.status === "loading" && <PageSkeleton />}
      {current.status === "error" && <ErrorState onRetry={retry} />}
      {current.status === "ready" && (
        <>
          <YouBar board={board} mine={mine} user={me?.state.status === "signed-in" ? me.state.user : null} />
          {rows.length === 0 ? (
            <EmptyState
              icon={board === "contrib" ? Users : Clock}
              title="Bảng xếp hạng đang trống"
              description={
                board === "contrib"
                  ? "Đăng bài và giúp đỡ bạn bè để có tên trên bảng nhé."
                  : "Học bài đều đặn để có tên trên bảng nhé."
              }
            />
          ) : (
            <>
              <Podium key={board} board={board} rows={rows.slice(0, 3)} />
              <ol className="space-y-2" key={`list-${board}`} aria-label="Các hạng tiếp theo">
                {rows.slice(3).map((r, i) => (
                  <RankRow
                    key={r.user.id}
                    board={board}
                    row={r}
                    max={leader.value}
                    isMe={r.user.id === myId}
                    delay={i * 60}
                  />
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </div>
  );
}

function BoardTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-center text-sm leading-tight font-semibold transition",
        active ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-blue-50",
      )}
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </button>
  );
}

function Tied() {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
      Đồng hạng
    </span>
  );
}

function Detail({ board, row }: { board: Board; row: Row }) {
  return board === "contrib" && "posts" in row ? (
    <p className="text-xs text-muted-foreground">
      {row.posts} bài đăng · {row.comments} bình luận
    </p>
  ) : null;
}

/** TOP 3 on a podium (2nd, 1st, 3rd). Ties keep the same rank and medal, marked "Đồng hạng". */
function Podium({ board, rows }: { board: Board; rows: Row[] }) {
  const order = [rows[1], rows[0], rows[2]].filter((r): r is Row => Boolean(r));
  return (
    <section aria-label="Bục vinh danh TOP 3" className="flex items-end justify-center gap-2 pt-8 md:gap-4">
      {order.map((r, i) => {
        const medal = MEDALS[Math.min(r.rank, 3) as 1 | 2 | 3];
        return (
          <div key={r.user.id} className="flex w-1/3 max-w-72 min-w-0 flex-col items-center">
            <div className="relative mb-3 flex w-full flex-col items-center text-center">
              {r.rank === 1 && (
                <Crown aria-hidden className="d-float absolute -top-8 size-8 fill-amber-300 text-amber-500" />
              )}
              <span className="rounded-full p-1" style={{ background: medal.color }}>
                <UserAvatar user={r.user} className="size-14 text-lg ring-2 ring-white md:size-16" />
              </span>
              <p className="mt-2 w-full truncate font-heading text-base font-bold md:text-lg">
                {r.user.name}
              </p>
              <p className="text-xs font-semibold text-slate-600 md:text-sm">{fmt(board, r.value)}</p>
              <Detail board={board} row={r} />
              {r.tied && (
                <span className="mt-1">
                  <Tied />
                </span>
              )}
            </div>
            <div
              aria-label={`Hạng ${r.rank}, huy chương ${medal.label}`}
              className={cn("d-grow relative w-full overflow-hidden rounded-t-3xl", medal.height)}
              style={{
                background: `linear-gradient(180deg, ${medal.color}, ${medal.color}cc)`,
                animationDelay: `${i * 140}ms`,
              }}
            >
              <RingsDecor className="absolute top-2 left-1/2 size-16 -translate-x-1/2 text-white/25" />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 text-center font-heading text-4xl font-black text-white md:text-5xl"
              >
                {r.rank}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function RankRow({
  board,
  row,
  max,
  isMe,
  delay,
}: {
  board: Board;
  row: Row;
  max: number;
  isMe: boolean;
  delay: number;
}) {
  return (
    <li
      className={cn(
        "d-enter flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1",
        isMe ? "ring-2 ring-blue-400" : "ring-black/5",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="w-7 text-center font-heading text-lg font-bold text-slate-400">
        <span className="sr-only">Hạng </span>
        {row.rank}
      </span>
      <UserAvatar user={row.user} className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          <span className="truncate">{row.user.name}</span>
          {isMe && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">BẠN</span>
          )}
          {row.tied && <Tied />}
        </p>
        <Detail board={board} row={row} />
        <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${Math.max(2, Math.round((row.value / max) * 100))}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-600 tabular-nums">{fmt(board, row.value)}</span>
    </li>
  );
}

/** Where the learner stands on this board, even outside the TOP 10 (K8-D6). */
function YouBar({
  board,
  mine,
  user,
}: {
  board: Board;
  mine: MyRankOut | null;
  user: { avatar_initial: string; avatar_color: number } | null;
}) {
  if (!user) return null;
  const empty = mine === null;
  return (
    <aside
      aria-label="Vị trí của bạn"
      className="flex flex-wrap items-center gap-3 rounded-[1.5rem] bg-slate-900 p-4 text-white shadow-lg"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-white/10 font-heading text-lg font-bold">
        {empty ? "–" : `#${mine.rank}`}
      </span>
      <UserAvatar user={user} className="size-9 ring-2 ring-white/40" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {empty ? "Bạn chưa có tên trên bảng này" : `Vị trí của bạn · ${fmt(board, mine.value)}`}
        </p>
        <p className="text-xs text-slate-300">
          {empty
            ? board === "contrib"
              ? "Mỗi bài đăng hoặc bình luận được +5 điểm."
              : "Mở bài học và để trang mở để cộng thời gian học."
            : mine.rank <= 10
              ? "Bạn đang trong TOP 10, giữ vững phong độ nhé!"
              : "Cố lên, bạn sắp vào TOP 10 rồi!"}
        </p>
      </div>
      <Link
        href={board === "contrib" ? "/community" : "/courses"}
        className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
      >
        {board === "contrib" ? "Đăng câu hỏi (+5)" : "Học tiếp"}
      </Link>
    </aside>
  );
}
