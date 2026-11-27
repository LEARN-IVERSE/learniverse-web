"use client";

import { ArrowDown, ArrowUp, Check, FolderPlus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  adminContentCreateUnit,
  adminContentDeleteUnit,
  adminContentMoveUnit,
  adminContentRenameUnit,
  type ContentUnitOut,
} from "@/lib/api-client";

import { errorText } from "./content-labels";
import { type Notice } from "./lesson-editor";

type Done = (notice: Notice) => void;

const input = "rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-400";

/** Admin form that adds an empty lesson group (e.g. "Giữa học kì I") after a chosen group. */
export function AddUnitForm({
  subject,
  units,
  onDone,
}: {
  subject: string;
  units: ContentUnitOut[];
  onDone: Done;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [after, setAfter] = useState<string>(units.at(-1)?.code ?? "");
  const [busy, setBusy] = useState(false);

  if (!open)
    return (
      <button
        type="button"
        onClick={() => {
          setAfter(units.at(-1)?.code ?? "");
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"
      >
        <FolderPlus aria-hidden className="size-4" /> Thêm nhóm bài
      </button>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await adminContentCreateUnit({
      path: { code: subject },
      body: { title, after: after || null },
    });
    setBusy(false);
    if (!data) return onDone({ ok: false, text: errorText(error) });
    setOpen(false);
    setTitle("");
    onDone({ ok: true, text: `Đã thêm nhóm “${data.title}”.` });
  }

  return (
    <form
      aria-label="Thêm nhóm bài"
      onSubmit={submit}
      className="flex w-full flex-wrap items-end gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200"
    >
      <label className="flex min-w-56 flex-1 flex-col text-xs font-semibold text-slate-600">
        Tên nhóm
        <input
          required
          maxLength={300}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Giữa học kì I"
          className={`mt-1 ${input}`}
        />
      </label>
      <label className="flex flex-col text-xs font-semibold text-slate-600">
        Đặt sau
        <select value={after} onChange={(e) => setAfter(e.target.value)} className={`mt-1 ${input}`}>
          <option value="">(Đầu danh sách)</option>
          {units.map((u) => (
            <option key={u.code} value={u.code}>
              {u.title}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={busy || !title.trim()}>
        Thêm
      </Button>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
        Hủy
      </Button>
    </form>
  );
}

/** Admin title of a lesson group with rename, move up/down and delete (empty groups only). */
export function UnitTitle({
  subject,
  unit,
  index,
  count,
  isAdmin,
  onDone,
}: {
  subject: string;
  unit: ContentUnitOut;
  index: number;
  count: number;
  isAdmin: boolean;
  onDone: Done;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(unit.title);
  const [busy, setBusy] = useState(false);
  const path = { code: subject, unit_code: unit.code };

  async function run(call: () => Promise<{ error?: unknown }>, ok: string) {
    setBusy(true);
    const { error } = await call();
    setBusy(false);
    onDone(error ? { ok: false, text: errorText(error) } : { ok: true, text: ok });
    return !error;
  }

  if (!isAdmin) return <h2 className="font-heading text-lg font-bold text-slate-900">{unit.title}</h2>;

  if (editing)
    return (
      <form
        className="flex flex-1 flex-wrap items-center gap-1"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(
            () => adminContentRenameUnit({ path, body: { title } }),
            `Đã đổi tên nhóm thành “${title.trim()}”.`,
          );
          if (ok) setEditing(false);
        }}
      >
        <input
          aria-label={`Tên mới cho ${unit.title}`}
          autoFocus
          required
          maxLength={300}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`min-w-56 flex-1 font-heading text-base font-bold ${input}`}
        />
        <button
          type="submit"
          aria-label="Lưu tên nhóm"
          disabled={busy || !title.trim()}
          className="rounded p-1 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Hủy đổi tên"
          onClick={() => {
            setTitle(unit.title);
            setEditing(false);
          }}
          className="rounded p-1 text-slate-500 hover:bg-slate-100"
        >
          <X className="size-4" />
        </button>
      </form>
    );

  const empty = unit.lessons.length === 0;
  const icon = "rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-700 disabled:opacity-20";
  return (
    <div className="flex flex-wrap items-center gap-1">
      <h2 className="font-heading text-lg font-bold text-slate-900">{unit.title}</h2>
      <button
        type="button"
        aria-label={`Đổi tên ${unit.title}`}
        disabled={busy}
        onClick={() => {
          setTitle(unit.title);
          setEditing(true);
        }}
        className={icon}
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Đưa nhóm ${unit.title} lên`}
        disabled={busy || index === 0}
        onClick={() =>
          void run(() => adminContentMoveUnit({ path, body: { direction: "up" } }), "Đã đổi thứ tự nhóm.")
        }
        className={icon}
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Đưa nhóm ${unit.title} xuống`}
        disabled={busy || index === count - 1}
        onClick={() =>
          void run(() => adminContentMoveUnit({ path, body: { direction: "down" } }), "Đã đổi thứ tự nhóm.")
        }
        className={icon}
      >
        <ArrowDown className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Xóa nhóm ${unit.title}`}
        title={empty ? undefined : "Chuyển hết bài sang nhóm khác rồi mới xóa được"}
        disabled={busy || !empty}
        onClick={() => {
          if (window.confirm(`Xóa nhóm “${unit.title}”?`))
            void run(() => adminContentDeleteUnit({ path }), `Đã xóa nhóm “${unit.title}”.`);
        }}
        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-20"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
