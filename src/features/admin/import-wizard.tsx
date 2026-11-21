"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileUp,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { adminContentImportCheck, adminContentImportRead, type RowOut, type SheetIn } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { errorText } from "./content-labels";
import { type Notice, NoticeBar, useSubmit } from "./lesson-editor";
import { QuestionPreview } from "./question-form";

type Row = Record<string, string>;
type Step = "source" | "check" | "preview" | "done";

const LETTERS = "ABCDEFGH".split("");
const STEPS: [Step, string][] = [
  ["source", "Chọn nguồn"],
  ["check", "Kiểm tra"],
  ["preview", "Xem trước"],
  ["done", "Gửi"],
];
// Columns shown in the table; the rest are edited under "Thêm".
const MAIN: [string, string, string][] = [
  ["lesson", "Mã bài", "w-28"],
  ["activity", "Hoạt động", "w-28"],
  ["type", "Loại câu", "w-32"],
  ["prompt", "Đề bài", "min-w-64"],
  ["answer", "Đáp án", "w-24"],
];
const EXTRA: [string, string][] = [
  ...LETTERS.map((c) => [`option_${c}`, `Lựa chọn ${c}`] as [string, string]),
  ["level", "Mức độ"],
  ["explanation", "Giải thích"],
  ["section", "Mục lý thuyết"],
];
const cell =
  "w-full rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** /admin/content/import: bulk question import in four steps; nothing is saved before "Gửi" (K11-D10). */
export function ImportWizard({ subject, isAdmin }: { subject: string; isAdmin: boolean }) {
  const [step, setStep] = useState<Step>("source");
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<RowOut[]>([]);
  const [dirty, setDirty] = useState(false);
  const [force, setForce] = useState<Set<number>>(new Set());
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [pasted, setPasted] = useState("");
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const { busy, send } = useSubmit(isAdmin, () => setStep("done"), setNotice);

  async function check(next: Row[]) {
    setWorking(true);
    const { data, error } = await adminContentImportCheck({ body: { subject, rows: next } });
    setWorking(false);
    if (!data) return setNotice({ ok: false, text: errorText(error) });
    setRows(next);
    setResults(data.rows);
    setDirty(false);
    setForce(new Set());
    setNotice(null);
    setStep("check");
  }

  async function read(body: SheetIn) {
    setWorking(true);
    setNotice(null);
    const { data, error } = await adminContentImportRead({ body });
    setWorking(false);
    if (!data) return setNotice({ ok: false, text: errorText(error) });
    await check(data.rows);
  }

  function edit(i: number, key: string, value: string) {
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
    setDirty(true);
  }

  function remove(i: number) {
    setRows((cur) => cur.filter((_, j) => j !== i));
    setResults((cur) => cur.filter((_, j) => j !== i));
    setForce(new Set([...force].filter((j) => j !== i).map((j) => (j > i ? j - 1 : j))));
  }

  const counts = { ok: 0, duplicate: 0, error: 0 };
  results.forEach((r) => counts[r.status]++);
  const included = results
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => r.question && (r.status === "ok" || (r.status === "duplicate" && force.has(i))));
  const lessonCount = new Set(included.map(({ r }) => r.lesson_code)).size;

  function submit() {
    void send(
      {
        action: "question.bulk_create",
        subject,
        bulk: { items: included.map(({ r }) => ({ lesson_code: r.lesson_code, question: r.question! })) },
      },
      `Đã thêm ${included.length} câu hỏi. Học sinh thấy ngay.`,
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
      >
        <ArrowLeft aria-hidden className="size-4" /> Về cây nội dung
      </Link>
      <ol aria-label="Các bước" className="flex flex-wrap gap-2 text-sm">
        {STEPS.map(([key, label], i) => (
          <li
            key={key}
            aria-current={step === key ? "step" : undefined}
            className={cn(
              "rounded-full px-3 py-1 font-semibold ring-1",
              step === key
                ? "bg-blue-600 text-white ring-blue-600"
                : "bg-white text-slate-500 ring-slate-200",
            )}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <NoticeBar notice={notice} />

      {step === "source" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-100">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
              <FileUp aria-hidden className="size-5 text-blue-600" /> Tải file Excel hoặc CSV
            </h3>
            <p className="text-sm text-slate-600">
              Dùng đúng dòng tiêu đề như file mẫu. Mỗi dòng là một câu hỏi; tối đa 500 câu, 2 MB.
            </p>
            <a
              href="/api/v1/admin/content/import/template"
              download
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 underline"
            >
              <Download aria-hidden className="size-4" /> Tải file mẫu (.xlsx)
            </a>
            <label className="block text-xs font-semibold text-slate-600">
              Chọn file
              <input
                type="file"
                accept=".xlsx,.csv"
                disabled={working}
                className="mt-1 block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024)
                    return setNotice({ ok: false, text: "File quá lớn (tối đa 2 MB)." });
                  await read({ file_name: file.name, content_base64: await toBase64(file) });
                }}
              />
            </label>
          </section>
          <section className="space-y-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-slate-100">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
              <ClipboardPaste aria-hidden className="size-5 text-blue-600" /> Dán từ Excel / Google Sheets
            </h3>
            <p className="text-sm text-slate-600">
              Bôi đen cả dòng tiêu đề và các dòng câu hỏi, sao chép rồi dán vào đây.
            </p>
            <textarea
              aria-label="Bảng dán vào"
              rows={6}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              className="w-full rounded-xl px-3 py-2 font-mono text-xs ring-1 ring-slate-200"
              placeholder={"Mã bài\tHoạt động\tLoại câu\tĐề bài\t…"}
            />
            <Button
              type="button"
              disabled={working || !pasted.trim()}
              onClick={() => void read({ text: pasted })}
            >
              Đọc bảng
            </Button>
          </section>
        </div>
      )}

      {step === "check" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 aria-hidden className="size-4" /> {counts.ok} hợp lệ
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-200">
              <AlertTriangle aria-hidden className="size-4" /> {counts.duplicate} trùng
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-rose-800 ring-1 ring-rose-200">
              <XCircle aria-hidden className="size-4" /> {counts.error} lỗi
            </span>
            <label className="ml-auto inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={onlyProblems}
                onChange={(e) => setOnlyProblems(e.target.checked)}
              />{" "}
              Chỉ hiện dòng có vấn đề
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Sửa thẳng trong bảng rồi bấm “Kiểm tra lại”. Dòng lỗi sẽ bị bỏ qua; dòng trùng chỉ được thêm nếu
            bạn tích “Vẫn thêm”.
          </p>
          <div className="overflow-x-auto rounded-[1.5rem] bg-white ring-1 ring-slate-100">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="p-2">Dòng</th>
                  <th className="p-2">Kết quả</th>
                  {MAIN.map(([k, label]) => (
                    <th key={k} className="p-2">
                      {label}
                    </th>
                  ))}
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const r = results[i];
                  if (onlyProblems && r?.status === "ok") return null;
                  const tone =
                    r?.status === "error"
                      ? "bg-rose-50/60"
                      : r?.status === "duplicate"
                        ? "bg-amber-50/60"
                        : "";
                  return (
                    <tr
                      key={i}
                      aria-label={`Dòng ${i + 2}`}
                      className={cn("border-t border-slate-100 align-top", tone)}
                    >
                      <td className="p-2 text-xs text-slate-500">{i + 2}</td>
                      <td className="w-56 p-2 text-xs">
                        {r?.status === "ok" && (
                          <span className="font-semibold text-emerald-700">✅ Hợp lệ</span>
                        )}
                        {r?.status === "duplicate" && (
                          <label className="block font-semibold text-amber-800">
                            ⚠️ Trùng{" "}
                            <input
                              type="checkbox"
                              aria-label={`Vẫn thêm dòng ${i + 2}`}
                              checked={force.has(i)}
                              onChange={(e) => {
                                const next = new Set(force);
                                if (e.target.checked) next.add(i);
                                else next.delete(i);
                                setForce(next);
                              }}
                            />{" "}
                            Vẫn thêm
                          </label>
                        )}
                        {r?.status === "error" && <span className="font-semibold text-rose-700">❌ Lỗi</span>}
                        {r?.messages.map((m) => (
                          <p key={m} className="text-slate-600">
                            {m}
                          </p>
                        ))}
                      </td>
                      {MAIN.map(([k, label, width]) => (
                        <td key={k} className={cn("p-2", width)}>
                          {k === "prompt" ? (
                            <textarea
                              aria-label={`Dòng ${i + 2} ${label}`}
                              rows={2}
                              className={cell}
                              value={row[k] ?? ""}
                              onChange={(e) => edit(i, k, e.target.value)}
                            />
                          ) : (
                            <input
                              aria-label={`Dòng ${i + 2} ${label}`}
                              className={cell}
                              value={row[k] ?? ""}
                              onChange={(e) => edit(i, k, e.target.value)}
                            />
                          )}
                        </td>
                      ))}
                      <td className="w-40 p-2">
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-blue-700">
                            Thêm
                          </summary>
                          <div className="mt-1 space-y-1">
                            {EXTRA.map(([k, label]) => (
                              <input
                                key={k}
                                aria-label={`Dòng ${i + 2} ${label}`}
                                placeholder={label}
                                className={cell}
                                value={row[k] ?? ""}
                                onChange={(e) => edit(i, k, e.target.value)}
                              />
                            ))}
                          </div>
                        </details>
                        <button
                          type="button"
                          aria-label={`Bỏ dòng ${i + 2}`}
                          onClick={() => remove(i)}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-700"
                        >
                          <Trash2 aria-hidden className="size-3.5" /> Bỏ dòng
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="sticky bottom-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <Button type="button" variant="outline" onClick={() => setStep("source")}>
              Chọn nguồn khác
            </Button>
            <Button
              type="button"
              variant={dirty ? "default" : "outline"}
              disabled={working}
              onClick={() => void check(rows)}
            >
              Kiểm tra lại
            </Button>
            <Button
              type="button"
              className="ml-auto"
              disabled={dirty || included.length === 0}
              onClick={() => setStep("preview")}
            >
              Tiếp: Xem trước ({included.length} câu)
            </Button>
            {dirty && (
              <p className="w-full text-xs text-amber-800">Bạn vừa sửa bảng, hãy bấm “Kiểm tra lại”.</p>
            )}
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-100">
            Sẽ thêm <b>{included.length}</b> câu hỏi vào <b>{lessonCount}</b> bài
            {counts.error > 0 && `; bỏ qua ${counts.error} dòng lỗi`}
            {counts.duplicate - (included.length - counts.ok) > 0 &&
              `; bỏ qua ${counts.duplicate - (included.length - counts.ok)} dòng trùng`}
            .{" "}
            {isAdmin
              ? "Câu hỏi hiện với học sinh ngay khi bạn bấm Thêm."
              : "Cả đợt sẽ thành một yêu cầu gửi quản trị viên duyệt."}
          </p>
          <ol aria-label="Xem trước câu hỏi" className="space-y-2">
            {included.map(({ r, i }, n) => (
              <li key={i} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                <p className="mb-2 text-xs font-bold text-slate-500">
                  Câu {n + 1} · {r.lesson_title} · dòng {i + 2}
                </p>
                <QuestionPreview q={r.question!} />
              </li>
            ))}
          </ol>
          <div className="sticky bottom-3 flex flex-wrap gap-2 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <Button type="button" variant="outline" onClick={() => setStep("check")}>
              Quay lại sửa
            </Button>
            <Button type="button" className="ml-auto" disabled={busy} onClick={submit}>
              {isAdmin ? `Thêm ${included.length} câu` : `Gửi duyệt ${included.length} câu`}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              setRows([]);
              setResults([]);
              setPasted("");
              setNotice(null);
              setStep("source");
            }}
          >
            Nạp đợt khác
          </Button>
          <Link
            href={isAdmin ? "/admin/content" : "/admin/my-changes"}
            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-200"
          >
            {isAdmin ? "Về cây nội dung" : "Xem Yêu cầu của tôi"}
          </Link>
        </div>
      )}
    </div>
  );
}
