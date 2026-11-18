"use client";

import { Clock, Crown, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { InitialAvatar } from "../shared";
import { BigMedal, Confetti, RingsDecor, Sunburst } from "./art";
import { CONTRIBUTORS, ME, MY_CONTRIBUTION, STUDY_TIME } from "./data";
import { formatMinutes, rankByValue, type RankedRow } from "./ranking";

type Board = "contrib" | "time";

const MEDALS: Record<1 | 2 | 3, { label: string; color: string; height: string }> = {
  1: { label: "Vàng", color: "#f59e0b", height: "h-36 md:h-44" },
  2: { label: "Bạc", color: "#94a3b8", height: "h-28 md:h-32" },
  3: { label: "Đồng", color: "#c2773b", height: "h-20 md:h-24" },
};

/** "Bảng xếp hạng": medal hero, two all-time boards, a TOP-3 podium, ranks 4-10 and the user's own position. */
export function RankView() {
  const [board, setBoard] = useState<Board>("contrib");
  const rows = rankByValue(board === "contrib" ? CONTRIBUTORS : STUDY_TIME);
  const fmt = (v: number) => (board === "contrib" ? `${v} điểm` : formatMinutes(v));
  const leader = rows[0];
  const me = rows.find((r) => r.id === ME.id);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-blue-600 text-white">
        <Sunburst className="pointer-events-none absolute top-1/2 left-1/2 size-[60rem] -translate-x-1/2 -translate-y-1/2" />
        <Confetti />
        <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1fr_auto_1fr] md:p-10">
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold tracking-[.3em] text-blue-100 uppercase">Bảng vàng</p>
            <h1 className="mt-2 font-display text-3xl leading-tight font-bold md:text-4xl">
              Những ngôi sao của LEARNIVERSE
            </h1>
            <p className="mt-2 text-sm text-blue-100">TOP 10 toàn thời gian · cập nhật liên tục</p>
          </div>
          <BigMedal className="d-float mx-auto h-60 w-auto drop-shadow-[0_18px_30px_rgba(0,0,0,.28)] md:h-72" />
          <div className="mx-auto w-full max-w-xs rounded-3xl bg-white/10 p-4 ring-1 ring-white/25">
            <p className="text-[11px] font-semibold tracking-widest text-blue-100 uppercase">Đang dẫn đầu</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded-full bg-amber-300 p-1">
                <InitialAvatar name={leader.name} className="size-11" />
              </span>
              <div>
                <p className="font-display text-xl font-bold">{leader.name}</p>
                <p className="text-sm text-blue-100">{fmt(leader.value)}</p>
              </div>
              <Crown className="ml-auto size-7 fill-amber-300 text-amber-300" />
            </div>
          </div>
        </div>
      </section>

      <div
        role="tablist"
        aria-label="Chọn bảng xếp hạng"
        className="mx-auto flex w-fit gap-1 rounded-full bg-white p-1 ring-1 ring-black/5"
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

      <YouBar board={board} me={me} fmt={fmt} />

      <Podium key={board} rows={rows.slice(0, 3)} fmt={fmt} />

      <ol className="space-y-2" key={`list-${board}`}>
        {rows.slice(3, 10).map((r, i) => (
          <RankRow key={r.id} row={r} fmt={fmt} max={leader.value} isMe={r.id === ME.id} delay={i * 60} />
        ))}
      </ol>
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
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-blue-50",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

/** TOP 3 on a podium (2nd, 1st, 3rd). Ties keep the same rank and medal, marked "Đồng hạng". */
function Podium({ rows, fmt }: { rows: RankedRow[]; fmt: (v: number) => string }) {
  const order = [rows[1], rows[0], rows[2]].filter((r): r is RankedRow => Boolean(r));
  return (
    <section aria-label="Bục vinh danh TOP 3" className="grid grid-cols-3 items-end gap-2 pt-8 md:gap-4">
      {order.map((r, i) => {
        const medal = MEDALS[Math.min(r.rank, 3) as 1 | 2 | 3];
        return (
          <div key={r.id} className="flex min-w-0 flex-col items-center">
            <div className="relative mb-3 flex w-full flex-col items-center text-center">
              {r.rank === 1 && (
                <Crown className="d-float absolute -top-8 size-8 fill-amber-300 text-amber-500" />
              )}
              <span className="rounded-full p-1" style={{ background: medal.color }}>
                <InitialAvatar name={r.name} className="size-14 text-lg ring-2 ring-white md:size-16" />
              </span>
              <p className="mt-2 w-full truncate font-display text-base font-bold md:text-lg">{r.name}</p>
              <p className="text-xs text-muted-foreground md:text-sm">{fmt(r.value)}</p>
              {r.tied && (
                <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                  Đồng hạng
                </span>
              )}
            </div>
            <div
              className={cn("d-grow relative w-full overflow-hidden rounded-t-3xl", medal.height)}
              style={{
                background: `linear-gradient(180deg, ${medal.color}, ${medal.color}cc)`,
                animationDelay: `${i * 140}ms`,
              }}
            >
              <RingsDecor className="absolute top-2 left-1/2 size-16 -translate-x-1/2 text-white/25" />
              <span className="absolute inset-x-0 bottom-1 text-center font-display text-4xl font-black text-white md:text-5xl">
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
  row,
  fmt,
  max,
  isMe,
  delay,
}: {
  row: RankedRow;
  fmt: (v: number) => string;
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
      <span className="w-7 text-center font-display text-lg font-bold text-slate-400">{row.rank}</span>
      <InitialAvatar name={row.name} className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold">
          <span className="truncate">{row.name}</span>
          {isMe && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">BẠN</span>
          )}
          {row.tied && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
              Đồng hạng
            </span>
          )}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${Math.round((row.value / max) * 100)}%` }}
          />
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-600 tabular-nums">{fmt(row.value)}</span>
    </li>
  );
}

/** Always shows where the learner stands and the next reachable goal (not only people far ahead). */
function YouBar({ board, me, fmt }: { board: Board; me?: RankedRow; fmt: (v: number) => string }) {
  const info =
    board === "contrib"
      ? {
          rank: MY_CONTRIBUTION.rank,
          value: `${MY_CONTRIBUTION.value} điểm`,
          hint: `Còn ${MY_CONTRIBUTION.next.value - MY_CONTRIBUTION.value} điểm nữa để vượt ${MY_CONTRIBUTION.next.name} (hạng ${MY_CONTRIBUTION.next.rank})`,
          progress: MY_CONTRIBUTION.value / MY_CONTRIBUTION.next.value,
          cta: "Đăng câu hỏi (+5)",
        }
      : me
        ? {
            rank: me.rank,
            value: fmt(me.value),
            hint: "Bạn đang trong TOP 10, giữ vững phong độ nhé!",
            progress: 1,
            cta: "Học tiếp",
          }
        : null;
  if (!info) return null;
  return (
    <aside
      aria-label="Vị trí của bạn"
      className="flex flex-wrap items-center gap-3 rounded-[1.5rem] bg-slate-900 p-4 text-white shadow-lg"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-white/10 font-display text-lg font-bold">
        #{info.rank}
      </span>
      <InitialAvatar name={ME.name} className="size-9 ring-2 ring-white/40" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Vị trí của bạn · {info.value}</p>
        <p className="text-xs text-slate-300">{info.hint}</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: `${Math.round(info.progress * 100)}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
      >
        {info.cta}
      </button>
    </aside>
  );
}
