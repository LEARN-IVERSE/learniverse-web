"use client";

import { BookOpenText, Bot, ClipboardList, ListChecks, type LucideIcon, RefreshCw, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StarNode } from "@/components/art/subject-art";
import type { LessonRowOut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { StarMeter } from "./star-meter";

type Action = { label: string; icon: LucideIcon; href?: string; soon: string; earned: boolean };

function actionsFor(subject: string, lesson: LessonRowOut): Action[] {
  const base = `/courses/${subject}/${lesson.code}`;
  const has = (a: LessonRowOut["earned"][number]) => lesson.earned.includes(a);
  const open = (a: LessonRowOut["available"][number], href: string) =>
    lesson.available.includes(a) ? href : undefined;
  if (lesson.kind === "periodic") {
    return [{ label: "Làm bộ câu hỏi", icon: ListChecks, soon: "Mở ở K6", earned: false }];
  }
  if (lesson.kind === "practice") {
    return [
      {
        label: "Làm bộ câu hỏi",
        icon: ListChecks,
        href: open("practice", `${base}/practice`),
        soon: "Chưa mở",
        earned: has("practice"),
      },
    ];
  }
  // The four functions of a lesson (spec 1.3); "Chưa mở" while the question bank is incomplete.
  return [
    { label: "Lý thuyết", icon: BookOpenText, href: base, soon: "", earned: has("theory") },
    {
      label: "Bài tập",
      icon: ClipboardList,
      href: open("exercise", `${base}/exercise`),
      soon: "Chưa mở",
      earned: has("exercise"),
    },
    { label: "Dạy AI", icon: Bot, soon: "Mở ở K10", earned: has("ai_teaching") },
    {
      label: "Ôn tập",
      icon: RefreshCw,
      href: open("review", `${base}/review`),
      soon: "Chưa mở",
      earned: has("review"),
    },
  ];
}

const KIND_LABELS: Record<LessonRowOut["kind"], string> = {
  lesson: "",
  practice: "Luyện tập",
  periodic: "Định kỳ",
};

/**
 * One row of the lesson list. Its four function icons appear on hover (desktop), when the row is
 * tapped (phone, via the toggle) and when keyboard focus is inside the row.
 */
export function LessonRow({
  subject,
  lesson,
  color,
}: {
  subject: string;
  lesson: LessonRowOut;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `actions-${lesson.code}`;
  const name = [lesson.label, lesson.title].filter(Boolean).join(": ");

  return (
    <li className="relative">
      <div className="absolute top-1 -left-16">
        {lesson.kind === "lesson" ? (
          <StarNode
            stars={lesson.stars}
            no={lesson.label?.match(/\d+/)?.[0] ?? "•"}
            label={name}
            color={color}
            done={lesson.completed}
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              "grid size-[52px] place-items-center rounded-full ring-4 ring-white",
              lesson.earned.includes("practice") ? "bg-amber-400 text-white" : "bg-amber-100 text-amber-700",
            )}
          >
            {lesson.earned.includes("practice") ? (
              <Star className="size-5 fill-white" />
            ) : (
              <ListChecks className="size-5" />
            )}
          </span>
        )}
      </div>
      <div className="group rounded-2xl bg-white ring-1 ring-black/5 transition focus-within:ring-2 focus-within:ring-blue-300 hover:shadow-[0_14px_30px_-20px_rgba(37,99,235,.7)]">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left focus-visible:outline-none"
        >
          <span className="min-w-0 flex-1">
            {lesson.label && (
              <span className="mr-2 font-heading font-bold text-blue-700">{lesson.label}.</span>
            )}
            <span className="font-medium text-slate-800">{lesson.title}</span>
            {KIND_LABELS[lesson.kind] && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {KIND_LABELS[lesson.kind]}
              </span>
            )}
          </span>
          {lesson.kind === "lesson" && <StarMeter stars={lesson.stars} completed={lesson.completed} />}
          {lesson.kind === "practice" && lesson.earned.includes("practice") && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
              <Star aria-hidden className="size-3.5 fill-amber-400 text-amber-400" /> Đã đạt sao
            </span>
          )}
        </button>
        <ul
          id={panelId}
          aria-label={`Chức năng của ${name}`}
          className={cn(
            "hidden flex-wrap gap-2 px-4 pb-3 group-focus-within:flex group-hover:flex",
            open && "flex",
          )}
        >
          {actionsFor(subject, lesson).map(({ label, icon: Icon, href, soon, earned }) => (
            <li key={label}>
              {href ? (
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                  {earned && (
                    <Star aria-label="đã có sao" className="size-3.5 fill-amber-300 text-amber-300" />
                  )}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title={soon}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-400"
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                  <span className="text-[11px] font-medium">· {soon}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
