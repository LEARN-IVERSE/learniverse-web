"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { MathText } from "@/features/learn/math-text";
import { useApi } from "@/features/learn/use-api";
import {
  adminContentLessonForEdit,
  adminContentSubmitChange,
  type ChangeIn,
  type ContentQuestionOut,
  type LessonData,
  type LessonEditOut,
  type QuestionData,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import {
  ACTIVITIES_OF,
  ACTIVITY_LABEL,
  errorText,
  KIND_LABEL,
  LEVEL_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
} from "./content-labels";
import { blankQuestion, QuestionForm, QuestionPreview } from "./question-form";

const field =
  "w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400";

type Notice = { ok: boolean; text: string } | null;

/** Send one change. Admins see it live at once; teachers get a pending request (K11-D9). */
function useSubmit(isAdmin: boolean, onDone: () => void, setNotice: (n: Notice) => void) {
  const [busy, setBusy] = useState(false);
  async function send(body: ChangeIn, okAdmin = "Đã lưu. Học sinh thấy ngay thay đổi.") {
    setBusy(true);
    setNotice(null);
    const { data, error } = await adminContentSubmitChange({ body });
    setBusy(false);
    if (!data) {
      setNotice({ ok: false, text: errorText(error) });
      return false;
    }
    setNotice({
      ok: true,
      text: isAdmin ? okAdmin : "Đã gửi yêu cầu. Thay đổi sẽ hiện sau khi quản trị viên duyệt.",
    });
    onDone();
    return true;
  }
  return { busy, send };
}

function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role={notice.ok ? "status" : "alert"}
      className={cn(
        "rounded-2xl px-4 py-2 text-sm ring-1",
        notice.ok
          ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
          : "bg-rose-50 text-rose-900 ring-rose-200",
      )}
    >
      {notice.text}
    </p>
  );
}

/** /admin/content/new: a new lesson in a chapter. */
export function NewLesson({ subject, unit, isAdmin }: { subject: string; unit: string; isAdmin: boolean }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const { busy, send } = useSubmit(isAdmin, () => undefined, setNotice);
  const initial: LessonData = {
    code: "",
    unit_code: unit,
    kind: "lesson",
    label: "",
    title: "",
    status: "draft",
    sections: [],
  };
  return (
    <div className="space-y-4">
      <BackLink />
      <NoticeBar notice={notice} />
      <LessonForm
        initial={initial}
        creating
        isAdmin={isAdmin}
        busy={busy}
        onSubmit={async (data) => {
          if (await send({ action: "lesson.create", subject, lesson: data }, "Đã thêm bài.")) {
            setTimeout(() => router.push(isAdmin ? "/admin/content" : "/admin/my-changes"), 800);
          }
        }}
      />
    </div>
  );
}

/** /admin/content/lessons/[id]: theory and question bank of one lesson. */
export function LessonEditor({ lessonId, isAdmin }: { lessonId: string; isAdmin: boolean }) {
  const [state, retry] = useApi(`admin:content:lesson:${lessonId}`, () =>
    adminContentLessonForEdit({ path: { lesson_id: lessonId } }),
  );
  const [tab, setTab] = useState<"info" | "questions">("info");
  // Kept here so the message survives the reload that follows an admin's save.
  const [notice, setNotice] = useState<Notice>(null);
  if (state.status === "error") return <ErrorState onRetry={retry} />;
  if (state.status === "loading")
    return (
      <div className="space-y-3">
        <NoticeBar notice={notice} />
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  const lesson = state.data;
  const reload = isAdmin ? retry : () => undefined;
  return (
    <div className="space-y-4">
      <BackLink />
      <NoticeBar notice={notice} />
      <h2 className="font-heading text-2xl font-bold text-slate-900">
        {lesson.data.label ? `${lesson.data.label}: ` : ""}
        {lesson.data.title}
        <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
          {KIND_LABEL[lesson.data.kind ?? "lesson"]} · {STATUS_LABEL[lesson.data.status ?? "draft"]}
        </span>
      </h2>
      <div role="tablist" className="flex gap-2">
        {(
          [
            ["info", "Thông tin & Lý thuyết"],
            ["questions", `Câu hỏi (${lesson.questions.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold ring-1",
              tab === key
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-700 ring-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "info" ? (
        <LessonInfo lesson={lesson} isAdmin={isAdmin} onSaved={reload} setNotice={setNotice} />
      ) : (
        <QuestionBank lesson={lesson} isAdmin={isAdmin} onSaved={reload} setNotice={setNotice} />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/content"
      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
    >
      <ArrowLeft aria-hidden className="size-4" /> Về cây nội dung
    </Link>
  );
}

function LessonInfo({
  lesson,
  isAdmin,
  onSaved,
  setNotice,
}: {
  lesson: LessonEditOut;
  isAdmin: boolean;
  onSaved: () => void;
  setNotice: (n: Notice) => void;
}) {
  const { busy, send } = useSubmit(isAdmin, onSaved, setNotice);
  return (
    <div className="space-y-3">
      <LessonForm
        key={lesson.version}
        initial={lesson.data}
        isAdmin={isAdmin}
        busy={busy}
        onSubmit={(data) =>
          void send({
            action: "lesson.update",
            lesson_id: lesson.id,
            base_version: lesson.version,
            lesson: data,
          })
        }
        onDelete={() => {
          const msg = "Xóa bài này? Nếu đã có học sinh học, bài chỉ bị ẩn để giữ sao và kết quả của các em.";
          if (window.confirm(msg))
            void send({ action: "lesson.delete", lesson_id: lesson.id }, "Đã xóa (hoặc ẩn) bài.");
        }}
      />
    </div>
  );
}

/** Lesson fields and theory sections; each section has a live preview. */
function LessonForm({
  initial,
  creating = false,
  isAdmin,
  busy,
  onSubmit,
  onDelete,
}: {
  initial: LessonData;
  creating?: boolean;
  isAdmin: boolean;
  busy: boolean;
  onSubmit: (data: LessonData) => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<LessonData>({ ...initial, sections: initial.sections ?? [] });
  const [preview, setPreview] = useState(true);
  const set = (patch: Partial<LessonData>) => setD((cur) => ({ ...cur, ...patch }));
  const sections = d.sections ?? [];
  const setSection = (i: number, patch: Partial<{ title: string; body: string }>) =>
    set({ sections: sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const move = (i: number, by: number) => {
    const next = [...sections];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    set({ sections: next });
  };

  return (
    <form
      aria-label="Thông tin bài"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(d);
      }}
    >
      <div className="grid gap-3 rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-100 sm:grid-cols-2">
        {creating && (
          <>
            <label className="text-xs font-semibold text-slate-600">
              Mã bài (chữ thường, không dấu, ví dụ <code>lesson-7</code>)
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={field}
                value={d.code ?? ""}
                onChange={(e) => set({ code: e.target.value })}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Loại mục
              <select
                className={field}
                value={d.kind}
                onChange={(e) => {
                  const kind = e.target.value as LessonData["kind"];
                  set({
                    kind,
                    periodic:
                      kind === "periodic"
                        ? { question_count: 20, time_limit_minutes: 45, pass_percent: 50 }
                        : null,
                  });
                }}
              >
                {Object.entries(KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label className="text-xs font-semibold text-slate-600">
          Nhãn (ví dụ “Bài 1”, “Unit 1”)
          <input className={field} value={d.label ?? ""} onChange={(e) => set({ label: e.target.value })} />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Tên bài
          <input
            required
            className={field}
            value={d.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Trạng thái
          <select
            className={field}
            value={d.status}
            onChange={(e) => set({ status: e.target.value as LessonData["status"] })}
          >
            <option value="draft">Nháp (học sinh chưa thấy)</option>
            <option value="published">Xuất bản</option>
            {!creating && <option value="hidden">Ẩn</option>}
          </select>
        </label>
        {d.kind === "periodic" && d.periodic && (
          <div className="grid grid-cols-3 gap-2 sm:col-span-2">
            {(
              [
                ["question_count", "Số câu"],
                ["time_limit_minutes", "Thời gian (phút)"],
                ["pass_percent", "% đạt"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="text-xs font-semibold text-slate-600">
                {label}
                <input
                  type="number"
                  min={1}
                  className={field}
                  value={d.periodic?.[k] ?? 1}
                  onChange={(e) => set({ periodic: { ...d.periodic!, [k]: Number(e.target.value) } })}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <h3 className="font-heading text-lg font-bold">Lý thuyết</h3>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm ring-1 ring-slate-200"
          >
            <Eye aria-hidden className="size-4" /> {preview ? "Ẩn xem trước" : "Hiện xem trước"}
          </button>
        </header>
        {sections.map((s, i) => (
          <div key={i} className="rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-100">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500">Mục {i + 1}</span>
              <input
                aria-label={`Tiêu đề mục ${i + 1}`}
                required
                className={field}
                value={s.title}
                onChange={(e) => setSection(i, { title: e.target.value })}
              />
              <button
                type="button"
                aria-label="Lên"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Xuống"
                disabled={i === sections.length - 1}
                onClick={() => move(i, 1)}
                className="disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Xóa mục ${i + 1}`}
                onClick={() => set({ sections: sections.filter((_, j) => j !== i) })}
                className="text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className={cn("grid gap-3", preview && "lg:grid-cols-2")}>
              <textarea
                aria-label={`Nội dung mục ${i + 1}`}
                required
                rows={8}
                className={cn(field, "font-mono")}
                value={s.body}
                onChange={(e) => setSection(i, { body: e.target.value })}
              />
              {preview && (
                <div className="max-h-80 overflow-auto rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <MathText md={s.body || "_(trống)_"} />
                </div>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set({ sections: [...sections, { title: "", body: "" }] })}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700"
        >
          <Plus aria-hidden className="size-4" /> Thêm mục Lý thuyết
        </button>
        <p className="text-xs text-muted-foreground">
          Gợi ý: công thức viết trong <code>$…$</code>, bảng dùng cú pháp Markdown <code>| a | b |</code>.
        </p>
      </section>

      {d.kind === "lesson" && (
        <label className="block text-xs font-semibold text-slate-600">
          Đáp án tham chiếu cho “Dạy AI” (không bắt buộc)
          <textarea
            rows={4}
            className={field}
            value={d.teach_reference ?? ""}
            onChange={(e) => set({ teach_reference: e.target.value })}
          />
        </label>
      )}

      <div className="sticky bottom-3 flex flex-wrap gap-2 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
        <Button type="submit" disabled={busy}>
          {isAdmin ? (creating ? "Thêm bài" : "Lưu") : "Gửi duyệt"}
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onDelete}
            className="text-rose-700"
          >
            <Trash2 aria-hidden className="size-4" /> {isAdmin ? "Xóa bài" : "Đề xuất xóa bài"}
          </Button>
        )}
      </div>
    </form>
  );
}

function QuestionBank({
  lesson,
  isAdmin,
  onSaved,
  setNotice,
}: {
  lesson: LessonEditOut;
  isAdmin: boolean;
  onSaved: () => void;
  setNotice: (n: Notice) => void;
}) {
  const kind = lesson.data.kind ?? "lesson";
  const activities = ACTIVITIES_OF[kind];
  const [filter, setFilter] = useState(activities[0]);
  const [editing, setEditing] = useState<ContentQuestionOut | "new" | null>(null);
  const { busy, send } = useSubmit(
    isAdmin,
    () => {
      setEditing(null);
      onSaved();
    },
    setNotice,
  );
  const shown = lesson.questions.filter((q) => q.data.activity === filter);
  const sectionCount = lesson.data.sections?.length ?? 0;

  function save(q: QuestionData) {
    if (editing === "new") void send({ action: "question.create", lesson_id: lesson.id, question: q });
    else if (editing)
      void send({
        action: "question.update",
        question_id: editing.id,
        base_version: editing.version,
        question: q,
      });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {activities.map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={filter === a}
            onClick={() => setFilter(a)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-semibold ring-1",
              filter === a
                ? "bg-blue-600 text-white ring-blue-600"
                : "bg-white text-slate-700 ring-slate-200",
            )}
          >
            {ACTIVITY_LABEL[a]} ({lesson.questions.filter((q) => q.data.activity === a).length})
          </button>
        ))}
        <Button type="button" className="ml-auto" onClick={() => setEditing("new")}>
          <Plus aria-hidden className="size-4" /> Thêm câu hỏi
        </Button>
      </div>
      {editing && (
        <QuestionForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? blankQuestion(filter) : editing.data}
          activities={activities}
          sectionCount={sectionCount}
          submitLabel={isAdmin ? "Lưu câu hỏi" : "Gửi duyệt"}
          busy={busy}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}
      {shown.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có câu hỏi cho hoạt động này.</p>
      )}
      <ol className="space-y-2">
        {shown.map((q, i) => (
          <li key={q.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Câu {i + 1}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{TYPE_LABEL[q.data.type]}</span>
              {q.data.level && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">
                  {LEVEL_LABEL[q.data.level]}
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditing(q)}
                className="ml-auto inline-flex items-center gap-1 font-semibold text-blue-700"
              >
                <Pencil aria-hidden className="size-3.5" /> Sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Ngừng dùng câu hỏi này? Các lượt làm cũ vẫn giữ nguyên."))
                    void send({ action: "question.delete", question_id: q.id }, "Đã ngừng dùng câu hỏi.");
                }}
                className="inline-flex items-center gap-1 font-semibold text-rose-700"
              >
                <Trash2 aria-hidden className="size-3.5" /> Xóa
              </button>
            </div>
            <QuestionPreview q={q.data} />
          </li>
        ))}
      </ol>
    </div>
  );
}
