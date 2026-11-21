"use client";

import { AlertTriangle, Check, Eye, Pencil, Undo2, X } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { MathText } from "@/features/learn/math-text";
import { useApi } from "@/features/learn/use-api";
import {
  adminContentApproveRequest,
  adminContentListRequests,
  adminContentRejectRequest,
  adminContentReviseRequest,
  adminContentWithdrawRequest,
  type BulkItem,
  type ChangeIn,
  type ChangeOut,
  type ChangeStatus,
  type LessonData,
  type QuestionData,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import {
  ACTION_LABEL,
  ACTIVITY_LABEL,
  errorText,
  LEVEL_LABEL,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_STYLE,
  STATUS_LABEL,
  TYPE_LABEL,
} from "./content-labels";
import { LessonForm } from "./lesson-editor";
import { QuestionForm, QuestionPreview } from "./question-form";

type Data = Record<string, unknown>;

const FIELD_LABEL: Record<string, string> = {
  code: "Mã bài",
  unit_code: "Chương",
  kind: "Loại mục",
  label: "Nhãn",
  title: "Tên bài",
  status: "Trạng thái",
  teach_reference: "Đáp án tham chiếu Dạy AI",
  periodic: "Cấu hình đề định kỳ",
  activity: "Hoạt động",
  type: "Loại câu",
  prompt: "Đề bài",
  options: "Lựa chọn",
  answer: "Đáp án",
  explanation: "Giải thích",
  section: "Mục Lý thuyết liên quan",
  level: "Mức độ",
  index: "Vị trí trong chương",
};

function show(key: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (key === "status") return STATUS_LABEL[String(v)] ?? String(v);
  if (key === "activity") return ACTIVITY_LABEL[String(v)] ?? String(v);
  if (key === "type") return TYPE_LABEL[String(v)] ?? String(v);
  if (key === "level") return LEVEL_LABEL[String(v)] ?? String(v);
  if (key === "index" && typeof v === "number") return v > 999 ? "Cuối chương" : `Thứ ${v + 1}`;
  if (key === "answer" && typeof v === "boolean") return v ? "Đúng" : "Sai";
  if (key === "periodic" && typeof v === "object") {
    const p = v as { question_count: number; time_limit_minutes: number; pass_percent: number };
    return `${p.question_count} câu · ${p.time_limit_minutes} phút · đạt ${p.pass_percent}%`;
  }
  if (Array.isArray(v))
    return v
      .map((x, i) => (key === "options" ? `${String.fromCharCode(65 + i)}. ${x}` : String(x)))
      .join("\n");
  return String(v);
}

type Row = { label: string; before: string; after: string; changed: boolean };

/** Field-by-field comparison; theory sections are compared one by one. */
function rows(before: Data | null, after: Data | null): Row[] {
  const keys = Object.keys(FIELD_LABEL).filter((k) => (before && k in before) || (after && k in after));
  const out: Row[] = keys.map((k) => {
    const b = before ? show(k, before[k]) : "—";
    const a = after ? show(k, after[k]) : "—";
    return { label: FIELD_LABEL[k], before: b, after: a, changed: b !== a };
  });
  const bs = (before?.sections as { title: string; body: string }[] | undefined) ?? [];
  const as = (after?.sections as { title: string; body: string }[] | undefined) ?? [];
  for (let i = 0; i < Math.max(bs.length, as.length); i++) {
    const b = bs[i] ? `${bs[i].title}\n\n${bs[i].body}` : "—";
    const a = as[i] ? `${as[i].title}\n\n${as[i].body}` : "—";
    out.push({ label: `Lý thuyết · Mục ${i + 1}`, before: b, after: a, changed: b !== a });
  }
  return out;
}

/** A bulk import: every question with its lesson, as learners will see it. */
function BulkList({ items }: { items: BulkItem[] }) {
  return (
    <ol aria-label="Câu hỏi trong đợt nạp" className="max-h-[32rem] space-y-2 overflow-auto">
      {items.map((it, i) => (
        <li key={i} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="mb-1 text-xs font-bold text-slate-500">
            Câu {i + 1} · bài {it.lesson_code} · {ACTIVITY_LABEL[it.question.activity]} ·{" "}
            {TYPE_LABEL[it.question.type]}
          </p>
          <QuestionPreview q={it.question} />
        </li>
      ))}
    </ol>
  );
}

export function ChangeDiff({ change }: { change: ChangeOut }) {
  if (change.action === "question.bulk_create" && change.after)
    return <BulkList items={(change.after as { items: BulkItem[] }).items} />;
  return <FieldDiff change={change} />;
}

function FieldDiff({ change }: { change: ChangeOut }) {
  const [onlyChanged, setOnlyChanged] = useState(true);
  const [preview, setPreview] = useState(false);
  const deleting = change.action.endsWith(".delete");
  const all = rows(change.before ?? null, change.after ?? null);
  const shown = onlyChanged && !deleting ? all.filter((r) => r.changed) : all;
  const isQuestion = change.action.startsWith("question.");
  const after = change.after as Data | null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        {!deleting && change.before && (
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} />{" "}
            Chỉ hiện phần thay đổi
          </label>
        )}
        {after && change.action !== "lesson.move" && (
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200"
          >
            <Eye aria-hidden className="size-4" /> {preview ? "Xem so sánh" : "Xem như học sinh"}
          </button>
        )}
      </div>
      {preview && after ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
          {isQuestion ? (
            <QuestionPreview q={after as unknown as QuestionData} />
          ) : (
            <div className="space-y-4">
              <h3 className="font-heading text-xl font-bold">{String(after.title ?? "")}</h3>
              {((after.sections as { title: string; body: string }[] | undefined) ?? []).map((s, i) => (
                <section key={i}>
                  <h4 className="font-semibold">{s.title}</h4>
                  <MathText md={s.body} />
                </section>
              ))}
            </div>
          )}
        </div>
      ) : deleting ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {change.action === "lesson.delete"
            ? "Đề xuất xóa bài này. Nếu đã có học sinh học, bài chỉ bị ẩn."
            : "Đề xuất ngừng dùng câu hỏi này. Các lượt làm cũ vẫn giữ nguyên."}
        </p>
      ) : (
        <table className="w-full table-fixed border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="w-1/5 font-semibold">Mục</th>
              {change.before && <th className="font-semibold">Hiện tại</th>}
              <th className="font-semibold">{change.before ? "Đề xuất" : "Nội dung mới"}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.label} className="align-top">
                <td className="pr-2 font-semibold text-slate-600">{r.label}</td>
                {change.before && (
                  <td
                    className={cn(
                      "rounded-l-lg p-2 whitespace-pre-wrap break-words",
                      r.changed ? "bg-rose-50 text-rose-900" : "bg-slate-50",
                    )}
                  >
                    {r.before}
                  </td>
                )}
                <td
                  className={cn(
                    "rounded-r-lg p-2 whitespace-pre-wrap break-words",
                    r.changed ? "bg-emerald-50 text-emerald-900" : "bg-slate-50",
                  )}
                >
                  {r.after}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted-foreground">
                  Không có khác biệt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={cn("rounded-full px-2 py-0.5 text-xs font-semibold ring-1", REQUEST_STATUS_STYLE[status])}
    >
      {REQUEST_STATUS_LABEL[status]}
    </span>
  );
}

function Header({ c }: { c: ChangeOut }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <StatusChip status={c.status} />
      <span className="font-semibold">{ACTION_LABEL[c.action]}</span>
      <span className="min-w-0 truncate text-slate-700">{c.summary}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        {c.author_name ?? "?"} · {new Date(c.updated_at).toLocaleString("vi-VN")}
      </span>
    </div>
  );
}

/** /admin/reviews: the admin's queue of teacher change requests (K11-D9). */
export function ReviewQueue() {
  const [status, setStatus] = useState<ChangeStatus>("pending");
  const [list, retry] = useApi(`admin:reviews:${status}`, () =>
    adminContentListRequests({ query: { status } }),
  );
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(run: () => Promise<{ data?: ChangeOut; error?: unknown }>, ok: string) {
    setBusy(true);
    const { data, error } = await run();
    setBusy(false);
    setNotice(data ? { ok: true, text: ok } : { ok: false, text: errorText(error) });
    if (data) {
      setOpen(null);
      setNote("");
      retry();
    }
  }

  return (
    <div className="space-y-3">
      <div role="tablist" className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold ring-1",
              status === s
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-700 ring-slate-200",
            )}
          >
            {REQUEST_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
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
      {list.status === "error" && <ErrorState onRetry={retry} />}
      {list.status === "loading" && <p className="text-sm text-muted-foreground">Đang tải…</p>}
      {list.status === "ready" && list.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Không có yêu cầu nào.</p>
      )}
      {list.status === "ready" && (
        <ul aria-label="Yêu cầu thay đổi" className="space-y-2">
          {list.data.items.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpen(open === c.id ? null : c.id)}
                aria-expanded={open === c.id}
              >
                <Header c={c} />
              </button>
              {c.review_note && <p className="mt-1 text-xs text-rose-700">Lý do từ chối: {c.review_note}</p>}
              {open === c.id && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  {c.stale && (
                    <p className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
                      <AlertTriangle aria-hidden className="size-4" /> Đã cũ: nội dung gốc đã đổi sau khi giáo
                      viên sửa. Hãy từ chối để giáo viên gửi lại.
                    </p>
                  )}
                  <ChangeDiff change={c} />
                  {c.status === "pending" && (
                    <div className="flex flex-wrap items-end gap-2">
                      <Button
                        type="button"
                        disabled={busy || c.stale}
                        onClick={() =>
                          void act(
                            () => adminContentApproveRequest({ path: { request_id: c.id } }),
                            "Đã duyệt. Thay đổi đã hiện với học sinh.",
                          )
                        }
                      >
                        <Check aria-hidden className="size-4" /> Duyệt
                      </Button>
                      <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">
                        Lý do từ chối
                        <input
                          className="w-full rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Ví dụ: Đáp án chưa đúng SGK"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy || note.trim().length < 3}
                        onClick={() =>
                          void act(
                            () => adminContentRejectRequest({ path: { request_id: c.id }, body: { note } }),
                            "Đã từ chối và gửi lý do cho giáo viên.",
                          )
                        }
                      >
                        <X aria-hidden className="size-4" /> Từ chối
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** /admin/my-changes: a teacher's own requests and what happened to them. */
export function MyChanges() {
  const [list, retry] = useApi("admin:my-changes", () => adminContentListRequests({ query: { mine: true } }));
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  async function revise(c: ChangeOut, patch: Partial<ChangeIn>) {
    setBusy(true);
    setError("");
    const { data, error: e } = await adminContentReviseRequest({
      path: { request_id: c.id },
      body: { action: c.action, ...patch },
    });
    setBusy(false);
    if (!data) return setError(errorText(e));
    setEditing(null);
    setSaved("Đã cập nhật yêu cầu. Quản trị viên sẽ thấy bản mới.");
    retry();
  }

  if (list.status === "error") return <ErrorState onRetry={retry} />;
  if (list.status === "loading") return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  if (list.data.items.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Bạn chưa gửi yêu cầu nào. Hãy vào mục Nội dung để soạn bài.
      </p>
    );
  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-emerald-700">
          {saved}
        </p>
      )}
      <ul aria-label="Yêu cầu của tôi" className="space-y-2">
        {list.data.items.map((c) => (
          <li key={c.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setOpen(open === c.id ? null : c.id)}
              aria-expanded={open === c.id}
            >
              <Header c={c} />
            </button>
            {c.status === "rejected" && c.review_note && (
              <p className="mt-1 text-sm text-rose-800">
                <b>{c.reviewer_name ?? "Quản trị viên"}</b> từ chối: {c.review_note}
              </p>
            )}
            {c.stale && (
              <p className="mt-1 text-xs text-amber-800">
                Nội dung gốc đã đổi; yêu cầu này có thể bị từ chối. Hãy rút lại và sửa trên bản mới.
              </p>
            )}
            {open === c.id && (
              <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                {editing === c.id ? (
                  <ReviseForm
                    c={c}
                    busy={busy}
                    onSave={(patch) => void revise(c, patch)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <ChangeDiff change={c} />
                )}
                {c.status === "pending" && editing !== c.id && EDITABLE.has(c.action) && (
                  <Button type="button" className="mr-2" onClick={() => setEditing(c.id)}>
                    <Pencil aria-hidden className="size-4" /> Sửa yêu cầu
                  </Button>
                )}
                {c.status === "pending" && editing !== c.id && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const { data, error: e } = await adminContentWithdrawRequest({
                        path: { request_id: c.id },
                      });
                      if (data) retry();
                      else setError(errorText(e));
                    }}
                  >
                    <Undo2 aria-hidden className="size-4" /> Rút lại yêu cầu
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const EDITABLE = new Set(["lesson.create", "lesson.update", "question.create", "question.update"]);

/** Edit what a pending request proposes; its target stays the same. */
function ReviseForm({
  c,
  busy,
  onSave,
  onCancel,
}: {
  c: ChangeOut;
  busy: boolean;
  onSave: (patch: Partial<ChangeIn>) => void;
  onCancel: () => void;
}) {
  if (c.action.startsWith("lesson.")) {
    const lesson = c.after as unknown as LessonData;
    return (
      <div className="space-y-2">
        <LessonForm
          initial={lesson}
          creating={c.action === "lesson.create"}
          isAdmin={false}
          busy={busy}
          onSubmit={(data) => onSave({ lesson: data })}
        />
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy sửa
        </Button>
      </div>
    );
  }
  const q = c.after as unknown as QuestionData;
  return (
    <QuestionForm
      initial={q}
      activities={[q.activity]}
      sectionCount={Math.max(q.section ?? 0, 10)}
      submitLabel="Lưu yêu cầu"
      busy={busy}
      onSubmit={(data) => onSave({ question: data })}
      onCancel={onCancel}
    />
  );
}
