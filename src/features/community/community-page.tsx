"use client";

import { MessagesSquare, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SocialScene } from "@/components/art/social-art";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { communityListPosts, communityNewPosts } from "@/lib/api-client";
import { useVisibleInterval } from "@/lib/use-visible-interval";
import { cn } from "@/lib/utils";

import { useSession } from "../auth/session";
import { UserAvatar } from "../auth/user-avatar";
import { useApi } from "../learn/use-api";
import { BOXES, type BoxCode } from "./boxes";
import { Pagination } from "./pagination";
import { PostCard } from "./post-card";
import { PostForm } from "./post-form";

const NEW_POSTS_POLL_MS = 60_000;

function BoxTab({
  active,
  onClick,
  glyph,
  name,
  color,
}: {
  active: boolean;
  onClick: () => void;
  glyph: string;
  name: string;
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
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-xl font-heading text-lg font-bold text-white"
        style={{ background: color }}
      >
        {glyph}
      </span>
      <span className="min-w-0 truncate text-sm font-bold">{name}</span>
    </button>
  );
}

/** /community: banner, Box tabs, search, composer, newest-first feed, pagination, "N new posts". */
export function CommunityPage() {
  const session = useSession();
  const me = session?.state.status === "signed-in" ? session.state.user : null;

  const [box, setBox] = useState<BoxCode | null>(null);
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [author, setAuthor] = useState("");
  const [noComments, setNoComments] = useState(false);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [composing, setComposing] = useState(false);
  // The count belongs to the (box, version) it was measured for; any other view starts at zero.
  const [newPosts, setNewPosts] = useState({ scope: "", count: 0 });
  const scope = `${box}:${version}`;
  const loadedAt = useRef(new Date().toISOString());

  // Type-ahead search: commit what was typed 300 ms after the last key. Only a changed query goes
  // back to page 1; an unchanged one must not undo a page the learner has just chosen.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = typed.trim();
      if (next === q) return;
      setQ(next);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [typed, q]);

  const key = JSON.stringify({ box, q, author, noComments, page, version });
  const [state, retry] = useApi(`posts:${key}`, () => {
    loadedAt.current = new Date().toISOString();
    return communityListPosts({
      query: {
        page,
        box: box ?? undefined,
        q: q || undefined,
        author: author.trim() || undefined,
        no_comments: noComments,
      },
    });
  });

  // New posts never jump into the list being read: count them and let the learner reload (K7-D5).
  useVisibleInterval(() => {
    void communityNewPosts({ query: { since: loadedAt.current, box: box ?? undefined } }).then(({ data }) => {
      if (data) setNewPosts({ scope: `${box}:${version}`, count: data.count });
    });
  }, NEW_POSTS_POLL_MS);

  const reload = () => {
    setPage(1);
    setVersion((v) => v + 1);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#eaf3ff] ring-1 ring-blue-100">
        <SocialScene className="absolute inset-0 h-full w-full opacity-50 md:opacity-100" />
        <div className="relative max-w-md p-6 md:p-8">
          <p className="text-[11px] font-bold tracking-[.25em] text-blue-700 uppercase">
            Mạng xã hội học tập
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold md:text-4xl">Góc hỏi đáp</h1>
          <p className="mt-1 text-sm text-slate-600">Một câu hỏi của bạn, cả lớp cùng giải.</p>
          {state.status === "ready" && (
            <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">
              {state.data.total} bài đăng
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="tablist" aria-label="Chọn Box môn học">
        <BoxTab
          active={box === null}
          onClick={() => {
            setBox(null);
            setPage(1);
          }}
          glyph="✦"
          name="Tất cả"
          color="#3b82f6"
        />
        {BOXES.map((b) => (
          <BoxTab
            key={b.code}
            active={box === b.code}
            onClick={() => {
              setBox(b.code);
              setPage(1);
            }}
            glyph={b.glyph}
            name={b.name}
            color={b.color}
          />
        ))}
      </div>

      <search aria-label="Tìm bài đăng" className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Tìm theo tên bài hoặc nội dung</span>
          <Search
            aria-hidden
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Tìm theo tên bài, từ khóa (có dấu hay không dấu)..."
            className="h-11 w-full rounded-full bg-white pr-4 pl-11 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>
        <label className="w-44">
          <span className="sr-only">Tìm theo người đăng</span>
          <input
            type="search"
            value={author}
            onChange={(e) => {
              setAuthor(e.target.value);
              setPage(1);
            }}
            placeholder="Người đăng..."
            className="h-11 w-full rounded-full bg-white px-4 text-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-black/10 has-[:checked]:bg-amber-50 has-[:checked]:ring-amber-300">
          <input
            type="checkbox"
            checked={noComments}
            onChange={(e) => {
              setNoComments(e.target.checked);
              setPage(1);
            }}
            className="accent-amber-600"
          />
          Chưa có bình luận
        </label>
      </search>

      {composing ? (
        <PostForm
          defaultBox={box}
          onCancel={() => setComposing(false)}
          onCreated={() => {
            setComposing(false);
            reload();
          }}
        />
      ) : (
        <section className="flex items-center gap-3 rounded-[1.5rem] bg-white p-4 ring-1 ring-black/5">
          {me && <UserAvatar user={me} />}
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex-1 rounded-2xl bg-muted px-4 py-3 text-left text-sm text-muted-foreground transition hover:bg-blue-50"
          >
            {me
              ? `${me.name.split(" ").at(-1)} ơi, bạn đang thắc mắc điều gì?`
              : "Bạn đang thắc mắc điều gì?"}
          </button>
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="hidden rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:inline-flex"
          >
            Đăng bài
          </button>
        </section>
      )}

      {newPosts.scope === scope && newPosts.count > 0 && (
        <button
          type="button"
          onClick={reload}
          className="mx-auto flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
        >
          <Sparkles aria-hidden className="size-4" /> Có {newPosts.count} bài mới, bấm để xem
        </button>
      )}

      {state.status === "loading" && <PageSkeleton />}
      {state.status === "error" && <ErrorState onRetry={retry} />}
      {state.status === "ready" &&
        (state.data.items.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title={q || author || noComments ? "Không có bài nào khớp" : "Chưa có bài viết nào"}
            description={
              q || author || noComments
                ? "Thử đổi từ khóa hoặc bỏ bớt bộ lọc nhé."
                : "Hãy là người đầu tiên đặt câu hỏi trong Box này."
            }
          />
        ) : (
          <>
            <div className="space-y-4" aria-label="Danh sách bài đăng">
              {state.data.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <Pagination page={state.data.page} pages={state.data.pages} onPage={setPage} />
          </>
        ))}
    </div>
  );
}
