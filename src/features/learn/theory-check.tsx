"use client";

import { Clock, ListChecks } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { activitiesReadComplete, activitiesReadStart, type ReadStatusOut } from "@/lib/api-client";

import { AttemptRunner } from "../practice/attempt-runner";

function mmss(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * End of the theory page (K5-D2): the 5-question check opens once the learner has scrolled to the
 * end AND the theory has been open for 5 minutes. The server keeps the clock; this only counts down.
 */
export function TheoryCheck({ subject, code }: { subject: string; code: string }) {
  const [read, setRead] = useState<ReadStatusOut | null>(null);
  const [left, setLeft] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void activitiesReadStart({ path: { subject, code } }).then(({ data }) => {
      if (data) {
        setRead(data);
        setLeft(data.remaining_seconds);
      }
    });
  }, [subject, code]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setReachedEnd(true));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const completed = read?.completed ?? false;
  // Count down only while the page is visible, like the server (hidden time is not reading time).
  useEffect(() => {
    if (!read || completed || left <= 0) return;
    const t = window.setTimeout(() => {
      if (document.visibilityState === "visible") setLeft((s) => s - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [read, completed, left]);

  useEffect(() => {
    if (completed || !reachedEnd || !read || left > 0) return;
    void activitiesReadComplete({ path: { subject, code } }).then(({ data }) => {
      if (!data) return;
      setRead(data);
      // The server only counts confirmed heartbeats, so it may still want a little more time.
      setLeft(data.completed ? 0 : Math.max(data.remaining_seconds, 15));
    });
  }, [completed, reachedEnd, read, left, subject, code]);

  return (
    <section aria-labelledby="theory-check" className="mt-8 space-y-4">
      <div ref={sentinel} aria-hidden className="h-px" />
      <div className="rounded-[2rem] bg-white p-6 ring-1 ring-blue-100">
        <h2
          id="theory-check"
          className="flex items-center gap-2 font-heading text-2xl font-bold text-slate-900"
        >
          <ListChecks aria-hidden className="size-6 text-blue-600" /> Kiểm tra Lý thuyết: 5 câu
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Đọc hết bài rồi làm đúng cả 5/5 câu để nhận sao Lý thuyết.
        </p>
        {completed ? (
          !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
            >
              Làm 5 câu kiểm tra
            </button>
          )
        ) : (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"
          >
            <Clock aria-hidden className="size-4 shrink-0 text-blue-600" />
            {read === null
              ? "Đang ghi nhận thời gian đọc..."
              : left > 0
                ? `Hãy đọc kĩ bài: 5 câu kiểm tra mở sau ${mmss(left)} nữa.`
                : "Kéo xuống hết bài để mở 5 câu kiểm tra."}
          </p>
        )}
      </div>
      {open && <AttemptRunner subject={subject} code={code} activity="theory" />}
    </section>
  );
}
