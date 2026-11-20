"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  communityMyNotifications,
  communityReadNotifications,
  type NotificationsOut,
} from "@/lib/api-client";
import { useVisibleInterval } from "@/lib/use-visible-interval";
import { cn } from "@/lib/utils";

import { useSession } from "../auth/session";
import { UserAvatar } from "../auth/user-avatar";
import { timeAgo } from "./time-ago";

const POLL_MS = 60_000; // K7-D7: ask again every minute, no live connection

/** Header bell: unread count, latest comments and replies, click to open the post. */
export function NotificationBell() {
  const signedIn = useSession()?.state.status === "signed-in";
  const [data, setData] = useState<NotificationsOut | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    void communityMyNotifications().then(({ data: next }) => next && setData(next));
  }, []);

  useEffect(() => {
    if (signedIn) load();
  }, [signedIn, load]);
  useVisibleInterval(load, POLL_MS, signedIn);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const unread = data?.unread ?? 0;
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      void communityReadNotifications().then(() =>
        setData((d) => d && { ...d, unread: 0, items: d.items.map((n) => ({ ...n, read: true })) }),
      );
    }
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Thông báo: ${unread} chưa đọc` : "Thông báo"}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
        className="relative rounded-full p-2 transition hover:bg-white focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
      >
        <Bell aria-hidden className="size-5" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] leading-4 font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="region"
          aria-label="Thông báo của bạn"
          className="d-enter absolute top-12 right-0 z-40 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          <h2 className="border-b border-slate-100 px-4 py-3 font-heading text-base font-bold">Thông báo</h2>
          {data && data.items.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto p-2">
              {data.items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/community/posts/${n.post_id}#comments`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 rounded-2xl px-3 py-2.5 text-sm hover:bg-blue-50",
                      !n.read && "bg-blue-50/60",
                    )}
                  >
                    <UserAvatar user={n.actor} className="size-8 text-sm" />
                    <span className="min-w-0">
                      <span className="block">
                        <strong>{n.actor.name}</strong>{" "}
                        {n.kind === "reply" ? "đã trả lời bình luận của bạn" : "đã bình luận bài của bạn"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {n.post_title} · {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">Chưa có thông báo nào.</p>
          )}
        </div>
      )}
    </div>
  );
}
