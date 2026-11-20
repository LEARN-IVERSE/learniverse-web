"use client";

import { ArrowLeft, EyeOff, Flag, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import {
  communityDeletePost,
  communityEditPost,
  communityGetPost,
  communityListComments,
  type PostOut,
} from "@/lib/api-client";

import { UserAvatar } from "../auth/user-avatar";
import { useApi } from "../learn/use-api";
import { boxOf } from "./boxes";
import { CommentTree } from "./comment-tree";
import { MediaGallery } from "./post-card";
import { ReportDialog } from "./report-dialog";
import { SafeMarkdown } from "./safe-markdown";
import { timeAgo } from "./time-ago";

function EditForm({ post, onDone }: { post: PostOut; onDone: (changed: boolean) => void }) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body_md);
  const [failed, setFailed] = useState(false);
  return (
    <form
      aria-label="Sửa bài đăng"
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const { data } = await communityEditPost({ path: { post_id: post.id }, body: { title, body } });
        if (data) onDone(true);
        else setFailed(true);
      }}
    >
      <input
        aria-label="Tiêu đề"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        minLength={3}
        maxLength={200}
        required
        className="h-11 w-full rounded-xl bg-white px-4 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
      />
      <textarea
        aria-label="Nội dung"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        required
        maxLength={10000}
        className="w-full rounded-2xl bg-white p-4 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
      />
      {failed && (
        <p role="alert" className="text-sm text-rose-600">
          Chưa lưu được. Bạn thử lại nhé.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Lưu
        </button>
        <button
          type="button"
          onClick={() => onDone(false)}
          className="rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

/** /community/posts/[id]: the whole post, its pictures, comments, and owner tools. */
export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const [post, retry] = useApi(`post:${id}:${version}`, () => communityGetPost({ path: { post_id: id } }));
  const [comments] = useApi(`comments:${id}:${version}`, () =>
    communityListComments({ path: { post_id: id } }),
  );
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reporting, setReporting] = useState(false);
  const refresh = () => setVersion((v) => v + 1);

  if (post.status === "loading") return <PageSkeleton />;
  if (post.status === "error")
    return post.notFound ? (
      <ErrorState title="Không tìm thấy bài đăng" description="Bài đăng này không còn hoặc đã bị ẩn." />
    ) : (
      <ErrorState onRetry={retry} />
    );
  const p = post.data;
  const box = boxOf(p.box.code);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" /> Góc hỏi đáp
      </Link>

      <article className="relative overflow-hidden rounded-[2rem] bg-white p-6 pl-8 ring-1 ring-black/5 md:p-8 md:pl-10">
        <span aria-hidden className="absolute inset-y-0 left-0 w-2" style={{ background: box.color }} />
        {p.hidden && (
          <p className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            <EyeOff aria-hidden className="size-4" /> Quản trị viên đang ẩn bài đăng này; chỉ bạn nhìn thấy
            nó.
          </p>
        )}
        <header className="flex items-center gap-3">
          <UserAvatar user={p.author} className="size-11 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{p.author.name}</p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(p.created_at)}
              {p.edited && " · đã sửa"}
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ color: box.color, background: `${box.color}14` }}
          >
            {box.glyph} {p.box.name}
          </span>
        </header>

        {editing ? (
          <div className="mt-4">
            <EditForm
              post={p}
              onDone={(changed) => {
                setEditing(false);
                if (changed) refresh();
              }}
            />
          </div>
        ) : (
          <>
            <h1 className="mt-4 font-heading text-2xl leading-snug font-bold md:text-3xl">{p.title}</h1>
            <SafeMarkdown md={p.body_md} className="mt-3 text-slate-800" />
            <MediaGallery media={p.media} />
          </>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {p.mine ? (
            confirming ? (
              <>
                <span className="text-sm font-semibold text-rose-700">Xóa bài đăng này?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await communityDeletePost({ path: { post_id: p.id } });
                    router.replace("/community");
                  }}
                  className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Xác nhận xóa
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
              </>
            ) : (
              !editing && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil aria-hidden className="size-4" /> Sửa bài
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 aria-hidden className="size-4" /> Xóa bài
                  </button>
                </>
              )
            )
          ) : (
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600"
            >
              <Flag aria-hidden className="size-4" /> Báo cáo bài đăng
            </button>
          )}
        </div>
      </article>

      {comments.status === "ready" ? (
        <CommentTree postId={p.id} comments={comments.data} onChanged={refresh} />
      ) : comments.status === "error" ? (
        <ErrorState title="Chưa tải được bình luận" />
      ) : (
        <PageSkeleton />
      )}
      {reporting && <ReportDialog targetType="post" targetId={p.id} onClose={() => setReporting(false)} />}
    </div>
  );
}
