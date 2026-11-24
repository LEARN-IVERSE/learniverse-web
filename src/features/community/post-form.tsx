"use client";

import { FileText, ImageIcon, Paperclip, Send, X } from "lucide-react";
import { useRef, useState } from "react";

import { communityCreatePost, communityCreateUpload, type PostOut, type UploadOut } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";

import { errorCode } from "../practice/activity-info";
import { SafeMarkdown } from "./safe-markdown";
import { BOXES, type BoxCode } from "./boxes";

const LIMITS = { image: 5 << 20, file: 10 << 20 };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES = 4;
const MAX_FILES = 2;

type Picked = {
  key: string;
  file: File;
  kind: "image" | "file";
  progress: number; // 0..100
  mediaId?: string;
};

/** Browser-side check; the API counts bytes and checks the real file type before storing the file. */
export function checkFile(file: File, picked: Pick<Picked, "kind">[]): string | null {
  const kind = IMAGE_TYPES.includes(file.type) ? "image" : file.type === "application/pdf" ? "file" : null;
  if (!kind) return `“${file.name}”: chỉ nhận ảnh JPG, PNG, WebP hoặc tệp PDF.`;
  if (file.size > LIMITS[kind]) return `“${file.name}”: quá lớn (tối đa ${LIMITS[kind] >> 20} MB).`;
  const count = picked.filter((p) => p.kind === kind).length;
  if (kind === "image" && count >= MAX_IMAGES) return `Mỗi bài tối đa ${MAX_IMAGES} ảnh.`;
  if (kind === "file" && count >= MAX_FILES) return `Mỗi bài tối đa ${MAX_FILES} tệp PDF.`;
  return null;
}

function putWithProgress(
  upload: UploadOut,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string | null> {
  return new Promise((resolve) => {
    const fallback = `Không tải được “${file.name}”. Bạn thử lại nhé.`;
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", upload.upload_url);
    xhr.responseType = "json";
    xhr.setRequestHeader("Authorization", `Bearer ${upload.upload_token}`);
    xhr.setRequestHeader("Content-Type", upload.content_type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () =>
      resolve(xhr.status >= 200 && xhr.status < 300 ? null : (apiErrorMessage(xhr.response) ?? fallback));
    xhr.onerror = () => resolve(fallback);
    xhr.send(file);
  });
}

/** New post: title, Box, Markdown body with a live preview, and image / PDF uploads with progress. */
export function PostForm({
  defaultBox,
  onCreated,
  onCancel,
}: {
  defaultBox: BoxCode | null;
  onCreated: (post: PostOut) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [box, setBox] = useState<BoxCode>(defaultBox ?? "math");
  const [body, setBody] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const update = (key: string, patch: Partial<Picked>) =>
    setPicked((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const add = (files: FileList | null) => {
    if (!files) return;
    let next = picked;
    for (const file of Array.from(files)) {
      const why = checkFile(file, next);
      if (why) {
        setProblem(why);
        continue;
      }
      setProblem(null);
      next = [
        ...next,
        {
          key: `${file.name}-${file.size}-${next.length}`,
          file,
          kind: IMAGE_TYPES.includes(file.type) ? "image" : "file",
          progress: 0,
        },
      ];
    }
    setPicked(next);
    if (input.current) input.current.value = "";
  };

  const submit = async () => {
    setSending(true);
    setProblem(null);
    const ids: string[] = [];
    for (const p of picked) {
      let mediaId = p.mediaId;
      if (!mediaId) {
        const { data, error } = await communityCreateUpload({
          body: { kind: p.kind, content_type: p.file.type, size: p.file.size, file_name: p.file.name },
        });
        const problem = data
          ? await putWithProgress(data, p.file, (pct) => update(p.key, { progress: pct }))
          : (apiErrorMessage(error) ?? `Không tải được “${p.file.name}”. Bạn thử lại nhé.`);
        if (problem !== null || !data) {
          setProblem(problem);
          setSending(false);
          return;
        }
        mediaId = data.id;
        update(p.key, { mediaId, progress: 100 });
      }
      ids.push(mediaId);
    }
    const { data, error } = await communityCreatePost({ body: { box, title, body, media_ids: ids } });
    setSending(false);
    if (data) return onCreated(data);
    const code = errorCode(error);
    setProblem(
      code === "media_invalid" || code === "media_not_found"
        ? "Có tệp không hợp lệ hoặc quá lớn. Hãy bỏ tệp đó và thử lại."
        : (apiErrorMessage(error) ??
            "Chưa đăng được bài. Bạn kiểm tra lại tiêu đề (từ 3 ký tự) và nội dung nhé."),
    );
  };

  return (
    <form
      aria-label="Đăng bài mới"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-4 rounded-[1.75rem] bg-white p-5 ring-1 ring-blue-200 md:p-6"
    >
      <h2 className="font-heading text-xl font-bold">Đăng bài mới</h2>
      <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
        <label className="block text-sm font-semibold text-slate-700">
          Tiêu đề
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            minLength={3}
            placeholder="Em chưa hiểu cách giải phương trình bậc hai"
            className="mt-1 h-11 w-full rounded-xl bg-white px-4 text-base font-normal ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Môn học
          <select
            value={box}
            onChange={(e) => setBox(e.target.value as BoxCode)}
            className="mt-1 h-11 w-full rounded-xl bg-white px-3 text-base font-normal ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
          >
            {BOXES.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="post-body" className="text-sm font-semibold text-slate-700">
            Nội dung
          </label>
          <button
            type="button"
            aria-pressed={preview}
            onClick={() => setPreview((v) => !v)}
            className="rounded-full px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            {preview ? "Sửa" : "Xem trước"}
          </button>
        </div>
        {preview ? (
          <div className="mt-1 min-h-32 rounded-2xl bg-slate-50 p-4">
            <SafeMarkdown md={body || "*Chưa có nội dung*"} />
          </div>
        ) : (
          <textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={10000}
            rows={6}
            placeholder="Em đã thử giải bài này nhưng không biết áp dụng công thức nghiệm. Công thức viết trong $...$ nhé."
            className="mt-1 w-full rounded-2xl bg-white p-4 text-base ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
          />
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          <Paperclip aria-hidden className="size-4" /> Ảnh bài tập / tệp PDF
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          aria-label="Chọn ảnh hoặc tệp PDF"
          className="sr-only"
          onChange={(e) => add(e.target.files)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Tối đa 4 ảnh (mỗi ảnh ≤ 5 MB) và 2 tệp PDF (mỗi tệp ≤ 10 MB).
        </p>
        {picked.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Tệp đã chọn">
            {picked.map((p) => (
              <li key={p.key} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5">
                {p.kind === "image" ? (
                  <ImageIcon aria-hidden className="size-5 shrink-0 text-emerald-600" />
                ) : (
                  <FileText aria-hidden className="size-5 shrink-0 text-blue-600" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.file.name}</span>
                  {sending && (
                    <span
                      role="progressbar"
                      aria-label={`Tải ${p.file.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={p.progress}
                      className="mt-1 block h-1.5 overflow-hidden rounded-full bg-blue-100"
                    >
                      <span
                        className="block h-full bg-blue-600 transition-all"
                        style={{ width: `${p.progress}%` }}
                      />
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  aria-label={`Bỏ ${p.file.name}`}
                  disabled={sending}
                  onClick={() => setPicked((prev) => prev.filter((x) => x.key !== p.key))}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-white"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {problem && (
        <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
          {problem}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none disabled:opacity-60"
        >
          <Send aria-hidden className="size-4" /> {sending ? "Đang đăng..." : "Đăng bài"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Hủy
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          +5 điểm đóng góp mỗi bài đăng (bảng xếp hạng)
        </span>
      </div>
    </form>
  );
}
