"use client";

import { BookOpenText, Bot, ClipboardList, ListChecks, type LucideIcon, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StarNode } from "@/components/art/subject-art";
import type { LessonRowOut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { StarMeter } from "./star-meter";

type Action = { label: string; icon: LucideIcon; href?: string; soon: string };

function actionsFor(subject: string, lesson: LessonRowOut): Action[] {
  if (lesson.kind !== "lesson") {
    return [{ label: "Làm bộ câu hỏi", icon: ListChecks, soon: "Mở ở K5" }];
  }
  // The four functions of a lesson (spec 1.3). Only the theory exists in K4.
  return [
    { label: "Lý thuyết", icon: BookOpenText, href: `/courses/${subject}/${lesson.code}`, soon: "" },
    { label: "Bài tập", icon: ClipboardList, soon: "Mở ở K5" },
    { label: "Dạy AI", icon: Bot, soon: "Mở ở K10" },
    { label: "Ôn tập", icon: RefreshCw, soon: "Mở ở K5" },
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
            className="grid size-[52px] place-items-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-white"
          >
            <ListChecks className="size-5" />
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
        </button>
        <ul
          id={panelId}
          aria-label={`Chức năng của ${name}`}
          className={cn(
            "hidden flex-wrap gap-2 px-4 pb-3 group-focus-within:flex group-hover:flex",
            open && "flex",
          )}
        >
          {actionsFor(subject, lesson).map(({ label, icon: Icon, href, soon }) => (
            <li key={label}>
              {href ? (
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title={soon}
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-400"
                >
                  <Icon aria-hidden className="size-4" />
                  {label}
                  <span className="sr-only"> ({soon})</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
