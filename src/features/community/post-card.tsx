"use client";

import { FileText, Flag, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { MediaOut, PostOut } from "@/lib/api-client";

import { UserAvatar } from "../auth/user-avatar";
import { boxOf } from "./boxes";
import { ReportDialog } from "./report-dialog";
import { SafeMarkdown } from "./safe-markdown";
import { timeAgo } from "./time-ago";

export function MediaGallery({ media }: { media: MediaOut[] }) {
  const images = media.filter((m) => m.kind === "image");
  const files = media.filter((m) => m.kind === "file");
  return (
    <>
      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2" aria-label="Ảnh đính kèm">
          {images.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-2xl ring-1 ring-black/5">
              <a href={m.url} target="_blank" rel="noopener noreferrer" aria-label={`Mở ảnh ${m.file_name}`}>
                {/* Signed storage URLs expire, so next/image optimisation is not used here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.file_name} loading="lazy" className="h-48 w-full object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tệp đính kèm">
          {files.map((m) => (
            <li key={m.id}>
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <FileText aria-hidden className="size-4" /> {m.file_name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** One post in the feed: author, time, Box, excerpt, pictures, comment count and a report button. */
export function PostCard({ post }: { post: PostOut }) {
  const box = boxOf(post.box.code);
  const [reporting, setReporting] = useState(false);
  return (
    <article className="relative overflow-hidden rounded-[1.5rem] bg-white p-5 pl-6 ring-1 ring-black/5 transition hover:shadow-[0_16px_36px_-24px_rgba(15,23,42,.45)]">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: box.color }} />
      <header className="flex items-center gap-3">
        <UserAvatar user={post.author} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">
            {timeAgo(post.created_at)}
            {post.edited && " · đã sửa"}
          </p>
        </div>
        <span
          className="hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline"
          style={{ color: box.color, background: `${box.color}14` }}
        >
          {box.glyph} {post.box.name}
        </span>
        {!post.mine && (
          <button
            type="button"
            aria-label={`Báo cáo bài đăng: ${post.title}`}
            onClick={() => setReporting(true)}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Flag aria-hidden className="size-4" />
          </button>
        )}
      </header>
      <h2 className="mt-3 font-heading text-lg leading-snug font-bold">
        <Link href={`/community/posts/${post.id}`} className="hover:text-blue-700 hover:underline">
          {post.title}
        </Link>
      </h2>
      <SafeMarkdown md={post.body_md} className="mt-1 line-clamp-4 text-sm text-slate-600" />
      <MediaGallery media={post.media} />
      <footer className="mt-4 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MessageCircle aria-hidden className="size-4" />
          <span>{post.comment_count} bình luận</span>
        </span>
        <Link
          href={`/community/posts/${post.id}#comments`}
          className="ml-auto rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          BÌNH LUẬN
        </Link>
      </footer>
      {reporting && <ReportDialog targetType="post" targetId={post.id} onClose={() => setReporting(false)} />}
    </article>
  );
}
