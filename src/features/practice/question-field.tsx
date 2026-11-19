"use client";

import type { QuestionOut } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { MathText } from "../learn/math-text";

export type AnswerValue = number | boolean | string | null;

const choice =
  "flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 transition hover:ring-blue-300 has-[:checked]:bg-blue-50 has-[:checked]:ring-2 has-[:checked]:ring-blue-500 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-200";

/** One question as a fieldset; the answer is lifted to the parent. */
export function QuestionField({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: QuestionOut;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  const name = `q-${question.id}`;
  return (
    <fieldset className="rounded-[1.75rem] bg-white/90 p-5 ring-1 ring-black/5 md:p-6">
      <legend className="sr-only">Câu {index + 1}</legend>
      <p aria-hidden className="text-xs font-bold tracking-wider text-blue-700 uppercase">
        Câu {index + 1}
      </p>
      <MathText md={question.prompt_md} className="mt-1 font-medium text-slate-900" />

      <div className="mt-4 grid gap-2">
        {question.type === "single_choice" &&
          (question.options ?? []).map((option, i) => (
            <label key={option} className={choice}>
              <input
                type="radio"
                name={name}
                checked={value === i}
                onChange={() => onChange(i)}
                className="size-4 accent-blue-600"
              />
              <span className="font-heading font-bold text-slate-500">{String.fromCharCode(65 + i)}.</span>
              <MathText md={option} />
            </label>
          ))}

        {question.type === "true_false" && (
          <div className="grid grid-cols-2 gap-2">
            {([true, false] as const).map((v) => (
              <label key={String(v)} className={cn(choice, "justify-center")}>
                <input
                  type="radio"
                  name={name}
                  checked={value === v}
                  onChange={() => onChange(v)}
                  className="size-4 accent-blue-600"
                />
                {v ? "Đúng" : "Sai"}
              </label>
            ))}
          </div>
        )}

        {question.type === "fill_blank" && (
          <label className="block">
            <span className="text-sm font-semibold text-slate-600">Câu trả lời</span>
            <input
              type="text"
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
              maxLength={200}
              autoComplete="off"
              className="mt-1 h-11 w-full max-w-xs rounded-xl bg-white px-4 ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}
