"use client";

import { Power } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { useApi } from "@/features/learn/use-api";
import {
  adminAiGetAiSettings,
  adminAiPutAiSettings,
  type AiFieldOut,
  type AiSettingsOut,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { errorText } from "./content-labels";

type Key =
  | "chat_model"
  | "grader_model"
  | "chat_thinking_level"
  | "grader_thinking_level"
  | "region"
  | "daily_messages"
  | "daily_images"
  | "daily_teach_sessions"
  | "price_input_per_m"
  | "price_output_per_m";

type Field = {
  key: Key;
  label: string;
  hint: string;
} & (
  { kind: "text" | "int" | "price" } | { kind: "select"; options: readonly (readonly [string, string])[] }
);

const THINKING_LEVELS = [
  ["MINIMAL", "Tối thiểu (MINIMAL)"],
  ["LOW", "Thấp (LOW)"],
  ["MEDIUM", "Vừa (MEDIUM)"],
  ["HIGH", "Cao (HIGH)"],
  ["XHIGH", "Rất cao (XHIGH)"],
] as const;

const FIELDS: Field[] = [
  {
    key: "chat_model",
    label: "Model trả lời (trợ lý AI và Dạy AI hỏi)",
    hint: "Ví dụ gemini-3.5-flash-lite",
    kind: "text",
  },
  {
    key: "chat_thinking_level",
    label: "Mức suy luận của model trả lời",
    hint: "Dùng khi trợ lý trả lời và khi Dạy AI đặt câu hỏi.",
    kind: "select",
    options: THINKING_LEVELS,
  },
  {
    key: "grader_model",
    label: "Model chấm Dạy AI",
    hint: "Để trống để dùng cùng model trả lời.",
    kind: "text",
  },
  {
    key: "grader_thinking_level",
    label: "Mức suy luận của model chấm",
    hint: "Chỉnh riêng được cả khi chấm bằng cùng model trả lời.",
    kind: "select",
    options: THINKING_LEVELS,
  },
  {
    key: "region",
    label: "Vùng gọi Gemini",
    hint: "Chọn Toàn cầu cho Gemini 3.8 Flash hoặc Gemini 4 Hydrogen.",
    kind: "select",
    options: [
      ["global", "Toàn cầu (global)"],
      ["asia-southeast1", "Singapore (asia-southeast1)"],
      ["asia-northeast1", "Tokyo (asia-northeast1)"],
      ["us", "Mỹ (đa vùng)"],
      ["eu", "Liên minh châu Âu (đa vùng)"],
      ["europe-west2", "London (europe-west2)"],
      ["northamerica-northeast1", "Montréal (northamerica-northeast1)"],
    ],
  },
  { key: "daily_messages", label: "Số tin nhắn mỗi học sinh mỗi ngày", hint: "0 đến 1000", kind: "int" },
  { key: "daily_images", label: "Số ảnh mỗi học sinh mỗi ngày", hint: "0 đến 100", kind: "int" },
  {
    key: "daily_teach_sessions",
    label: "Số phiên Dạy AI mỗi học sinh mỗi ngày",
    hint: "0 đến 50",
    kind: "int",
  },
  {
    key: "price_input_per_m",
    label: "Giá token vào (USD cho 1 triệu token)",
    hint: "Chỉ để ước tính chi phí",
    kind: "price",
  },
  {
    key: "price_output_per_m",
    label: "Giá token ra (USD cho 1 triệu token)",
    hint: "Chỉ để ước tính chi phí",
    kind: "price",
  },
];

type Draft = Record<Key, string>;

const show = (v: AiFieldOut["value"]) => (v === null || v === undefined ? "" : String(v));

/** What the form starts with: only the values the admin set; the rest stay empty ("use the default"). */
function fromServer(s: AiSettingsOut): Draft {
  return Object.fromEntries(
    FIELDS.map(({ key }) => [key, s[key]?.custom ? show(s[key].value) : ""]),
  ) as Draft;
}

/** /admin/ai: model, daily allowances, token prices and the AI off switch. The API key is not here (K11c-3). */
export function AiSettingsAdmin() {
  const [data, retry] = useApi("admin:ai-settings", () => adminAiGetAiSettings());
  if (data.status === "error") return <ErrorState onRetry={retry} />;
  if (data.status === "loading") return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  return <Form initial={data.data} />;
}

function Form({ initial: first }: { initial: AiSettingsOut }) {
  // The server answers a save with the new settings, so the form keeps its own copy (and its message).
  const [initial, setInitial] = useState(first);
  const [draft, setDraft] = useState<Draft>(fromServer(first));
  const [enabled, setEnabled] = useState(first.enabled);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const availableFields = FIELDS.filter(({ key }) => initial[key] !== undefined);

  async function save() {
    setBusy(true);
    const body: Record<string, unknown> = { enabled };
    for (const { key, kind } of availableFields) {
      const raw = draft[key].trim();
      body[key] = raw === "" ? null : kind === "int" || kind === "price" ? Number(raw) : raw;
    }
    const { data, error } = await adminAiPutAiSettings({ body: body as never });
    setBusy(false);
    if (data) {
      setInitial(data);
      setDraft(fromServer(data));
      setEnabled(data.enabled);
      setNotice({ ok: true, text: "Đã lưu. Cấu hình mới có hiệu lực từ lần gọi AI tiếp theo." });
    } else setNotice({ ok: false, text: errorText(error) });
  }

  const field =
    "w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400";
  return (
    <form
      aria-label="Cấu hình AI"
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <section
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-[1.5rem] p-5 ring-1",
          enabled ? "bg-white ring-slate-100" : "bg-amber-50 ring-amber-200",
        )}
      >
        <Power aria-hidden className={cn("size-6", enabled ? "text-emerald-600" : "text-amber-700")} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg font-bold">{enabled ? "AI đang bật" : "AI đang tạm tắt"}</p>
          <p className="text-sm text-muted-foreground">
            Khi tắt, học sinh thấy “AI đang tạm nghỉ”; hệ thống không gọi Gemini và không trừ lượt của các em.
          </p>
          {!initial.env_enabled && (
            <p role="alert" className="mt-1 text-sm text-rose-700">
              Máy chủ đang tắt AI bằng cấu hình môi trường (AI_ENABLED). Nút này không bật lại được.
            </p>
          )}
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Bật AI
        </label>
      </section>

      <section className="space-y-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-100">
        <p className="text-sm text-muted-foreground">
          Để trống một ô nghĩa là dùng giá trị mặc định của máy chủ (ghi bên dưới ô). Nhà cung cấp:{" "}
          <b>{initial.provider}</b> · Khóa API:{" "}
          <b>{initial.key_configured ? "đã cấu hình" : "chưa cấu hình"}</b> (khóa chỉ nằm trong máy chủ, không
          hiện và không sửa ở đây).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {availableFields.map(({ key, label, hint, ...control }) => (
            <label key={key} className="block text-xs font-semibold text-slate-600">
              {label}
              {control.kind === "select" ? (
                <select
                  className={field}
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                >
                  <option value="">Dùng mặc định máy chủ</option>
                  {control.options.map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={control.kind === "text" ? "text" : "number"}
                  min={0}
                  step={control.kind === "price" ? "0.01" : control.kind === "int" ? "1" : undefined}
                  className={field}
                  value={draft[key]}
                  placeholder={show(initial[key].default) || "(không có)"}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                />
              )}
              <span className="mt-0.5 block font-normal text-muted-foreground">
                Mặc định:{" "}
                {show(initial[key].default) || (control.kind === "select" ? "Tự động" : "(không có)")} ·{" "}
                {hint}
                {draft[key] !== "" && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      className="font-semibold text-blue-700 underline"
                      onClick={() => setDraft({ ...draft, [key]: "" })}
                    >
                      Về mặc định
                    </button>
                  </>
                )}
              </span>
            </label>
          ))}
        </div>
      </section>

      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={cn(
            "rounded-2xl px-4 py-2 text-sm ring-1",
            notice.ok ? "bg-emerald-50 ring-emerald-200" : "bg-rose-50 ring-rose-200",
          )}
        >
          {notice.text}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          Lưu cấu hình
        </Button>
        {initial.updated_at && (
          <span className="text-xs text-muted-foreground">
            Sửa lần cuối: {new Date(initial.updated_at).toLocaleString("vi-VN")}
            {initial.updated_by ? ` bởi ${initial.updated_by}` : ""}
          </span>
        )}
      </div>
    </form>
  );
}
