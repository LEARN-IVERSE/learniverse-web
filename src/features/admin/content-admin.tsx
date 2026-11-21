"use client";

import { ArrowDown, ArrowUp, ChevronRight, Clock3, FileUp, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { useApi } from "@/features/learn/use-api";
import {
  adminContentEditableSubjects,
  adminContentSubjectTree,
  type ContentLessonOut,
  type ContentUnitOut,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { ACTIVITY_LABEL, KIND_LABEL, STATUS_LABEL, STATUS_STYLE } from "./content-labels";
import { type Notice, NoticeBar, useSubmit } from "./lesson-editor";

/** /admin/content: subject -> chapter -> lesson tree with status, question counts and moves (K11b). */
export function ContentAdmin({ isAdmin }: { isAdmin: boolean }) {
  const [subjects, retry] = useApi("admin:content:subjects", () => adminContentEditableSubjects());
  const [picked, setPicked] = useState<string | null>(null);
  if (subjects.status === "error") return <ErrorState onRetry={retry} />;
  if (subjects.status === "loading") return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  if (subjects.data.length === 0)
    return <p className="text-sm text-muted-foreground">Bạn chưa được cấp quyền soạn môn nào.</p>;
  const code = picked ?? subjects.data[0].code;
  return (
    <div className="space-y-4">
      {!isAdmin && (
        <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-100">
          Mỗi thay đổi của bạn sẽ được gửi cho quản trị viên duyệt rồi mới hiện với học sinh. Theo dõi ở mục{" "}
          <Link href="/admin/my-changes" className="font-semibold underline">
            Yêu cầu của tôi
          </Link>
          .
        </p>
      )}
      <div role="tablist" aria-label="Môn học" className="flex flex-wrap gap-2">
        {subjects.data.map((s) => (
          <button
            key={s.code}
            type="button"
            role="tab"
            aria-selected={s.code === code}
            onClick={() => setPicked(s.code)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold ring-1",
              s.code === code
                ? "bg-blue-600 text-white ring-blue-600"
                : "bg-white text-slate-700 ring-slate-200",
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      <SubjectTree key={code} code={code} isAdmin={isAdmin} />
    </div>
  );
}

function SubjectTree({ code, isAdmin }: { code: string; isAdmin: boolean }) {
  const [tree, retry] = useApi(`admin:content:tree:${code}`, () =>
    adminContentSubjectTree({ path: { code } }),
  );
  const [notice, setNotice] = useState<Notice>(null);
  const { busy, send } = useSubmit(isAdmin, isAdmin ? retry : () => undefined, setNotice);
  if (tree.status === "error") return <ErrorState onRetry={retry} />;
  if (tree.status === "loading")
    return (
      <div className="space-y-3">
        <NoticeBar notice={notice} />
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  const units = tree.data.units;
  const move = (lesson: ContentLessonOut, unit_code: string, index: number) =>
    void send(
      {
        action: "lesson.move",
        lesson_id: lesson.id,
        base_version: lesson.version,
        move: { unit_code, index },
      },
      "Đã chuyển bài.",
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/content/import?subject=${code}`}
          className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <FileUp aria-hidden className="size-4" /> Nạp câu hỏi hàng loạt
        </Link>
      </div>
      <NoticeBar notice={notice} />
      {units.map((u) => (
        <section key={u.code} className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-100">
          <header className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-slate-900">{u.title}</h2>
            <Link
              href={`/admin/content/new?subject=${code}&unit=${u.code}`}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Plus aria-hidden className="size-4" /> Thêm bài
            </Link>
          </header>
          <ul className="divide-y divide-slate-100">
            {u.lessons.map((l, i) => (
              <LessonRow
                key={l.id}
                lesson={l}
                unit={u}
                units={units}
                index={i}
                busy={busy}
                onMove={(unit, index) => move(l, unit, index)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function LessonRow({
  lesson,
  unit,
  units,
  index,
  busy,
  onMove,
}: {
  lesson: ContentLessonOut;
  unit: ContentUnitOut;
  units: ContentUnitOut[];
  index: number;
  busy: boolean;
  onMove: (unitCode: string, index: number) => void;
}) {
  const name = `${lesson.label ? `${lesson.label}: ` : ""}${lesson.title}`;
  return (
    <li className="flex items-center gap-1">
      <span className="flex flex-col">
        <button
          type="button"
          aria-label={`Đưa ${name} lên`}
          disabled={busy || index === 0}
          onClick={() => onMove(unit.code, index - 1)}
          className="rounded p-0.5 text-slate-400 hover:text-blue-700 disabled:opacity-20"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Đưa ${name} xuống`}
          disabled={busy || index === unit.lessons.length - 1}
          onClick={() => onMove(unit.code, index + 1)}
          className="rounded p-0.5 text-slate-400 hover:text-blue-700 disabled:opacity-20"
        >
          <ArrowDown className="size-4" />
        </button>
      </span>
      <Link
        href={`/admin/content/lessons/${lesson.id}`}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-2 py-2.5 hover:bg-slate-50"
      >
        <span className="min-w-0 flex-1">
          <span className="font-semibold text-slate-900">
            {lesson.label ? `${lesson.label}: ` : ""}
            {lesson.title}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">{KIND_LABEL[lesson.kind]}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {Object.entries(lesson.needed).map(([activity, need]) => {
              const have = lesson.counts[activity] ?? 0;
              const short = need > 0 && have < need;
              return (
                <span
                  key={activity}
                  title={short ? `Cần ít nhất ${need} câu để mở hoạt động này` : undefined}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs ring-1",
                    short
                      ? "bg-rose-50 text-rose-700 ring-rose-200"
                      : "bg-slate-50 text-slate-600 ring-slate-200",
                  )}
                >
                  {ACTIVITY_LABEL[activity]} {have}/{need}
                  {short ? ` · thiếu ${need - have}` : ""}
                </span>
              );
            })}
          </span>
        </span>
        {lesson.pending > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            <Clock3 aria-hidden className="size-3.5" /> {lesson.pending} chờ duyệt
          </span>
        )}
        <span
          className={cn("rounded-full px-2 py-0.5 text-xs font-semibold ring-1", STATUS_STYLE[lesson.status])}
        >
          {STATUS_LABEL[lesson.status]}
        </span>
        <ChevronRight aria-hidden className="size-4 text-slate-400" />
      </Link>
      {units.length > 1 && (
        <select
          aria-label={`Chuyển ${name} sang chương`}
          disabled={busy}
          value=""
          onChange={(e) => e.target.value && onMove(e.target.value, Number.MAX_SAFE_INTEGER)}
          className="w-28 shrink-0 rounded-lg bg-white px-1 py-1 text-xs ring-1 ring-slate-200"
        >
          <option value="">Chuyển chương…</option>
          {units
            .filter((u) => u.code !== unit.code)
            .map((u) => (
              <option key={u.code} value={u.code}>
                {u.title}
              </option>
            ))}
        </select>
      )}
    </li>
  );
}
