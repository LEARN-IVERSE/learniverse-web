"use client";

import {
  ChevronLeft,
  ChevronRight,
  Flag,
  ImageIcon,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { SubjectId } from "../mock-data";
import { InitialAvatar } from "../shared";
import { NotebookPhoto, SocialScene } from "./art";
import { BOXES, FEED, ME, type FeedPost } from "./data";

/** "Mạng xã hội": themed banner, subject boxes as tabs, composer, newest-first feed and pagination. */
export function SocialView() {
  const [box, setBox] = useState<SubjectId | "all">("all");
  const posts = box === "all" ? FEED : FEED.filter((p) => p.box === box);
  const totalPosts = BOXES.reduce((sum, b) => sum + b.posts, 0);
  const totalWaiting = BOXES.reduce((sum, b) => sum + b.waiting, 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#eaf3ff] ring-1 ring-blue-100">
        <SocialScene className="absolute inset-0 h-full w-full opacity-50 md:opacity-100" />
        <div className="relative max-w-md p-6 md:p-8">
          <p className="text-[11px] font-bold tracking-[.25em] text-blue-700 uppercase">
            Mạng xã hội học tập
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">Góc hỏi đáp</h1>
          <p className="mt-1 text-sm text-slate-600">Một câu hỏi của bạn, cả lớp cùng giải.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">{totalPosts} bài đăng</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
              {totalWaiting} câu chờ lời giải
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
              <span className="d-twinkle size-2 rounded-full bg-emerald-500" /> 41 bạn đang online
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="tablist" aria-label="Chọn Box môn học">
        <BoxTab
          active={box === "all"}
          onClick={() => setBox("all")}
          glyph="✦"
          name="Tất cả"
          sub={`${totalPosts} bài`}
          color="#3b82f6"
        />
        {BOXES.map((b) => (
          <BoxTab
            key={b.id}
            active={box === b.id}
            onClick={() => setBox(b.id)}
            glyph={b.glyph}
            name={b.name}
            sub={`${b.posts} bài · ${b.waiting} chờ giải`}
            color={b.color}
          />
        ))}
      </div>

      <section className="flex items-start gap-3 rounded-[1.5rem] bg-white p-4 ring-1 ring-black/5">
        <InitialAvatar name={ME.name} />
        <div className="flex-1 space-y-3">
          <button
            type="button"
            className="w-full rounded-2xl bg-muted px-4 py-3 text-left text-sm text-muted-foreground transition hover:bg-blue-50"
          >
            {ME.name} ơi, bạn đang thắc mắc điều gì?
          </button>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              <ImageIcon className="size-4" /> Ảnh bài tập
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
              <Paperclip className="size-4" /> Tệp đính kèm
            </span>
            <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
              +5 điểm đóng góp mỗi bài đăng
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              <Send className="size-4" /> Đăng bài
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>

      <nav aria-label="Phân trang" className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white"
        >
          <ChevronLeft className="size-4" /> Trang trước
        </button>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            aria-current={n === 1 ? "page" : undefined}
            className={cn(
              "size-9 rounded-full text-sm font-semibold",
              n === 1 ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-white",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white"
        >
          Trang sau <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}

function BoxTab({
  active,
  onClick,
  glyph,
  name,
  sub,
  color,
}: {
  active: boolean;
  onClick: () => void;
  glyph: string;
  name: string;
  sub: string;
  color: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 transition",
        active ? "ring-2" : "ring-black/5 hover:ring-black/15",
      )}
      style={active ? { boxShadow: `0 0 0 2px ${color}`, background: `${color}0d` } : undefined}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white"
        style={{ background: color }}
      >
        {glyph}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

function PostCard({ post }: { post: FeedPost }) {
  const box = BOXES.find((b) => b.id === post.box) ?? BOXES[0];
  return (
    <article className="relative overflow-hidden rounded-[1.5rem] bg-white p-5 pl-6 ring-1 ring-black/5 transition hover:shadow-[0_16px_36px_-24px_rgba(15,23,42,.45)]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: box.color }} />
      <header className="flex items-center gap-3">
        <span className="relative">
          <InitialAvatar name={post.author} />
          {post.online && (
            <span
              className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white"
              aria-label="đang online"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{post.author}</p>
          <p className="text-xs text-muted-foreground">{post.time}</p>
        </div>
        <span
          className="hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline"
          style={{ color: box.color, background: `${box.color}14` }}
        >
          {box.glyph} {box.name}
        </span>
        <button
          type="button"
          aria-label="Báo cáo bài đăng"
          className="rounded-full p-2 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
        >
          <Flag className="size-4" />
        </button>
      </header>
      <h2 className="mt-3 font-display text-lg leading-snug font-bold">{post.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{post.body}</p>
      {post.hasImage && (
        <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-black/5">
          <NotebookPhoto className="h-auto w-full" />
        </div>
      )}
      <footer className="mt-4 flex flex-wrap items-center gap-3">
        {post.comments > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex">
              {post.commenters.slice(0, 3).map((n) => (
                <InitialAvatar
                  key={n}
                  name={n}
                  className="-ml-2 size-7 text-xs ring-2 ring-white first:ml-0"
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{post.comments} bình luận</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            <Sparkles className="size-3.5" /> Chưa có lời giải, trả lời đầu tiên nhé!
          </span>
        )}
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <MessageCircle className="size-4" /> BÌNH LUẬN
        </button>
      </footer>
    </article>
  );
}
