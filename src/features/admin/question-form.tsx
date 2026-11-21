"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MathText } from "@/features/learn/math-text";
import type { QuestionData } from "@/lib/api-client";

import { ACTIVITY_LABEL, LEVEL_LABEL, TYPE_LABEL } from "./content-labels";

const field =
  "w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400";

export function blankQuestion(activity: string): QuestionData {
  return {
    activity: activity as QuestionData["activity"],
    type: "single_choice",
    prompt: "",
    options: ["", ""],
    answer: 0,
    explanation: "",
    section: null,
    level: null,
  };
}

/** What a learner sees for this question (answer highlighted for the editor). */
export function QuestionPreview({ q }: { q: QuestionData }) {
  return (
    <div className="space-y-2 text-sm">
      <MathText md={q.prompt || "_(chưa có đề)_"} />
      {q.type === "single_choice" && (
        <ol className="space-y-1">
          {(q.options ?? []).map((o, i) => (
            <li
              key={i}
              className={
                i === q.answer
                  ? "rounded-lg bg-emerald-50 px-2 py-1 ring-1 ring-emerald-200"
                  : "rounded-lg bg-slate-50 px-2 py-1"
              }
            >
              <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>{" "}
              <MathText md={o || "…"} className="inline" />
            </li>
          ))}
        </ol>
      )}
      {q.type === "true_false" && (
        <p>
          Đáp án: <b>{q.answer === true ? "Đúng" : q.answer === false ? "Sai" : "?"}</b>
        </p>
      )}
      {q.type === "fill_blank" && (
        <p>
          Đáp án chấp nhận: <b>{Array.isArray(q.answer) ? q.answer.join(" | ") : ""}</b>
        </p>
      )}
      {q.explanation && (
        <div className="rounded-lg bg-blue-50 px-2 py-1">
          <span className="text-xs font-semibold text-blue-700">Giải thích</span>
          <MathText md={q.explanation} />
        </div>
      )}
    </div>
  );
}

/** Edit one question with a live preview beside it. */
export function QuestionForm({
  initial,
  activities,
  sectionCount,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  initial: QuestionData;
  activities: string[];
  sectionCount: number;
  submitLabel: string;
  busy: boolean;
  onSubmit: (q: QuestionData) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState<QuestionData>(initial);
  const set = (patch: Partial<QuestionData>) => setQ((cur) => ({ ...cur, ...patch }));

  function changeType(type: QuestionData["type"]) {
    if (type === "single_choice") set({ type, options: q.options?.length ? q.options : ["", ""], answer: 0 });
    else if (type === "true_false") set({ type, options: null, answer: true });
    else if (type === "fill_blank") set({ type, options: null, answer: [""] });
    else set({ type, options: null, answer: null });
  }

  const options = q.options ?? [];
  const accepted = Array.isArray(q.answer) ? (q.answer as string[]) : [];

  return (
    <form
      aria-label="Soạn câu hỏi"
      className="grid gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...q,
          options: q.type === "single_choice" ? options.map((o) => o.trim()) : null,
          answer: q.type === "fill_blank" ? accepted.map((a) => a.trim()).filter(Boolean) : q.answer,
        });
      }}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Hoạt động
            <select
              className={field}
              value={q.activity}
              onChange={(e) => set({ activity: e.target.value as QuestionData["activity"] })}
            >
              {activities.map((a) => (
                <option key={a} value={a}>
                  {ACTIVITY_LABEL[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Loại câu
            <select
              className={field}
              value={q.type}
              onChange={(e) => changeType(e.target.value as QuestionData["type"])}
            >
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Mức độ
            <select
              className={field}
              value={q.level ?? ""}
              onChange={(e) => set({ level: (e.target.value || null) as QuestionData["level"] })}
            >
              <option value="">—</option>
              {Object.entries(LEVEL_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs font-semibold text-slate-600">
          Đề bài (Markdown, công thức trong $…$)
          <textarea
            required
            rows={3}
            className={field}
            value={q.prompt}
            onChange={(e) => set({ prompt: e.target.value })}
          />
        </label>

        {q.type === "single_choice" && (
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-slate-600">
              Lựa chọn (bấm vòng tròn để chọn đáp án đúng)
            </legend>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  aria-label={`Đáp án đúng là ${String.fromCharCode(65 + i)}`}
                  checked={q.answer === i}
                  onChange={() => set({ answer: i })}
                />
                <input
                  aria-label={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                  className={field}
                  value={o}
                  onChange={(e) => set({ options: options.map((x, j) => (j === i ? e.target.value : x)) })}
                />
                <button
                  type="button"
                  aria-label={`Bỏ lựa chọn ${String.fromCharCode(65 + i)}`}
                  disabled={options.length <= 2}
                  onClick={() =>
                    set({
                      options: options.filter((_, j) => j !== i),
                      answer:
                        q.answer === i
                          ? 0
                          : typeof q.answer === "number" && q.answer > i
                            ? q.answer - 1
                            : q.answer,
                    })
                  }
                  className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {options.length < 8 && (
              <button
                type="button"
                onClick={() => set({ options: [...options, ""] })}
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
              >
                <Plus className="size-4" /> Thêm lựa chọn
              </button>
            )}
          </fieldset>
        )}
        {q.type === "true_false" && (
          <fieldset className="flex gap-4 text-sm">
            <legend className="text-xs font-semibold text-slate-600">Đáp án</legend>
            <label>
              <input type="radio" checked={q.answer === true} onChange={() => set({ answer: true })} /> Đúng
            </label>
            <label>
              <input type="radio" checked={q.answer === false} onChange={() => set({ answer: false })} /> Sai
            </label>
          </fieldset>
        )}
        {q.type === "fill_blank" && (
          <label className="block text-xs font-semibold text-slate-600">
            Các đáp án chấp nhận (mỗi dòng một đáp án)
            <textarea
              rows={2}
              className={field}
              value={accepted.join("\n")}
              onChange={(e) => set({ answer: e.target.value.split("\n") })}
            />
          </label>
        )}
        {q.type !== "essay" && (
          <label className="block text-xs font-semibold text-slate-600">
            Giải thích (hiện sau khi nộp bài)
            <textarea
              rows={2}
              className={field}
              value={q.explanation ?? ""}
              onChange={(e) => set({ explanation: e.target.value })}
            />
          </label>
        )}
        {sectionCount > 0 && (
          <label className="block text-xs font-semibold text-slate-600">
            Mục Lý thuyết liên quan (gợi ý ôn lại khi làm sai)
            <select
              className={field}
              value={q.section ?? ""}
              onChange={(e) => set({ section: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">—</option>
              {Array.from({ length: sectionCount }, (_, i) => (
                <option key={i} value={i + 1}>
                  Mục {i + 1}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        </div>
      </div>
      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
        <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">Xem trước</p>
        <QuestionPreview q={q} />
      </div>
    </form>
  );
}
