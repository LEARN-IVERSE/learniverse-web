"use client";

import { History, ImagePlus, MessageCircle, Plus, Send, Square, Trash2, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { SafeMarkdown } from "@/features/community/safe-markdown";
import {
  aiCreateConversation,
  aiDeleteConversation,
  aiGetConversation,
  aiGetQuota,
  aiListConversations,
  communityCreateUpload,
  type ConversationOut,
  type QuotaOut,
} from "@/lib/api-client";

import { apiErrorMessage } from "@/lib/api-error";

import type { LessonAsk } from "./ask-ai";
import { readSse } from "./sse";

const SUGGESTIONS = [
  "Giải thích phương trình bậc hai",
  "Tạo 5 câu trắc nghiệm ôn bài",
  "Cách viết mở bài nghị luận",
];
const LESSON_SUGGESTIONS = ["Tóm tắt bài này giúp em", "Cho em một ví dụ dễ hiểu", "Em hay sai ở đâu?"];
const MAX_IMAGES = 3;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 << 20;

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  status: "complete" | "incomplete" | "streaming";
  images: string[]; // URLs (presigned, or local previews right after sending)
  error?: string;
};

type Picked = { key: string; file: File; preview: string };

let nextKey = 0;
const localId = () => `local-${++nextKey}`;

async function uploadImage(file: File): Promise<{ id: string } | { error: string }> {
  const fallback = `Không tải được ảnh “${file.name}”. Bạn thử lại nhé.`;
  try {
    const { data, error } = await communityCreateUpload({
      body: { kind: "image", content_type: file.type, size: file.size, file_name: file.name },
    });
    if (!data) return { error: apiErrorMessage(error) ?? fallback };
    const put = await fetch(data.upload_url, {
      method: "PUT",
      body: file,
      credentials: "omit",
      headers: { "Content-Type": data.content_type, Authorization: `Bearer ${data.upload_token}` },
    });
    if (put.ok) return { id: data.id };
    return { error: apiErrorMessage(await put.json().catch(() => null)) ?? fallback };
  } catch {
    return { error: fallback };
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // not JSON
  }
  return "Trợ lý AI tạm thời không dùng được. Bạn thử lại sau nhé.";
}

/** The chat inside the floating panel: one conversation at a time, plus the list of past ones. */
export function AiChat({
  lesson,
  onClearLesson,
  large = false,
}: {
  lesson: LessonAsk | null;
  onClearLesson: () => void;
  /** Bigger panel and text, for easier reading. */
  large?: boolean;
}) {
  const [view, setView] = useState<"chat" | "history">("chat");
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatLesson, setChatLesson] = useState<LessonAsk | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaOut | null>(null);
  const [history, setHistory] = useState<ConversationOut[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const topic = chatId ? chatLesson : lesson;

  useEffect(() => {
    let cancelled = false;
    void aiGetQuota().then(({ data }) => !cancelled && data && setQuota(data));
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages]);

  const patchLast = (patch: (m: ChatMessage) => ChatMessage) =>
    setMessages((all) => (all.length ? [...all.slice(0, -1), patch(all[all.length - 1])] : all));

  function startNew() {
    abortRef.current?.abort();
    setChatId(null);
    setChatLesson(null);
    setMessages([]);
    setNotice(null);
    setView("chat");
  }

  function pickFiles(files: FileList | null) {
    setNotice(null);
    const next = [...picked];
    for (const file of Array.from(files ?? [])) {
      if (next.length >= MAX_IMAGES) {
        setNotice(`Mỗi tin nhắn tối đa ${MAX_IMAGES} ảnh.`);
        break;
      }
      if (!IMAGE_TYPES.includes(file.type)) setNotice("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
      else if (file.size > MAX_IMAGE_BYTES) setNotice("Ảnh quá lớn: tối đa 5 MB.");
      else next.push({ key: localId(), file, preview: URL.createObjectURL(file) });
    }
    setPicked(next);
  }

  function unpick(key: string) {
    setPicked((all) => all.filter((p) => p.key !== key));
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setBusy(true);
    setNotice(null);
    const images = picked;
    setDraft("");
    setPicked([]);
    setMessages((all) => [
      ...all,
      {
        id: localId(),
        role: "user",
        text: question,
        status: "complete",
        images: images.map((p) => p.preview),
      },
    ]);

    let id = chatId;
    if (!id) {
      const ref = lesson ? { subject: lesson.subject, code: lesson.code } : null;
      const { data } = await aiCreateConversation({ body: { lesson: ref } });
      if (!data) {
        setNotice("Không mở được cuộc trò chuyện. Bạn thử lại nhé.");
        setBusy(false);
        return;
      }
      id = data.id;
      setChatId(id);
      setChatLesson(lesson);
      onClearLesson();
    }

    const mediaIds: string[] = [];
    for (const p of images) {
      const uploaded = await uploadImage(p.file);
      if ("error" in uploaded) {
        setNotice(uploaded.error);
        setBusy(false);
        return;
      }
      mediaIds.push(uploaded.id);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setMessages((all) => [
      ...all,
      { id: localId(), role: "model", text: "", status: "streaming", images: [] },
    ]);
    try {
      const res = await fetch(`/api/v1/ai/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ text: question, media_ids: mediaIds }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const message = await errorMessage(res);
        setMessages((all) => all.slice(0, -1));
        setNotice(message);
        if (res.status === 429) void aiGetQuota().then(({ data }) => data && setQuota(data));
        return;
      }
      await readSse(res.body, (e) => {
        if (e.event === "delta") patchLast((m) => ({ ...m, text: m.text + e.data.text }));
        else if (e.event === "error") patchLast((m) => ({ ...m, error: e.data.message }));
        else {
          patchLast((m) => ({ ...m, id: e.data.message_id ?? m.id, status: e.data.status }));
          setQuota((q) => (q ? { ...q, messages_left: e.data.messages_left } : q));
        }
      });
      patchLast((m) => (m.status === "streaming" ? { ...m, status: m.text ? "incomplete" : "complete" } : m));
      setMessages((all) => all.filter((m) => m.role === "user" || m.text || m.error));
    } catch {
      // Stopped by the learner, or the connection dropped: keep what arrived (the server keeps it too).
      patchLast((m) => ({ ...m, status: "incomplete" }));
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setBusy(false);
      if (images.length) void aiGetQuota().then(({ data }) => data && setQuota(data));
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  async function openHistory() {
    setView("history");
    setHistory(null);
    const { data } = await aiListConversations();
    setHistory(data ?? []);
  }

  async function openChat(c: ConversationOut) {
    abortRef.current?.abort();
    const { data } = await aiGetConversation({ path: { conversation_id: c.id } });
    if (!data) return;
    setChatId(data.id);
    setChatLesson(
      data.lesson
        ? { subject: data.lesson.subject_code, code: data.lesson.code, title: data.lesson.title }
        : null,
    );
    setMessages(
      data.messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        status: m.status,
        images: m.images.map((i) => i.url),
      })),
    );
    setNotice(null);
    setView("chat");
  }

  async function removeChat(id: string) {
    const { response } = await aiDeleteConversation({ path: { conversation_id: id } });
    setConfirmDelete(null);
    if (!response?.ok) return;
    setHistory((all) => all?.filter((c) => c.id !== id) ?? null);
    if (id === chatId) {
      // Stay on the list; the next message starts a fresh chat.
      setChatId(null);
      setChatLesson(null);
      setMessages([]);
    }
  }

  const left = quota?.messages_left;
  const paused = quota?.enabled === false; // an admin switched AI off (K11c-3)
  const outOfMessages = left === 0 || paused;
  const box = large ? "h-[min(48rem,85svh)]" : "max-h-[min(32rem,70svh)]";
  const text = large ? "text-base" : "text-sm";

  if (view === "history")
    return (
      <div className={`flex ${box} flex-col`}>
        <div className="flex items-center justify-between border-b px-4 py-2">
          <p className="font-semibold">Lịch sử trò chuyện</p>
          <button
            type="button"
            onClick={() => setView("chat")}
            className="text-sm font-semibold text-blue-700"
          >
            Quay lại
          </button>
        </div>
        <ul aria-label="Các cuộc trò chuyện" className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
          {history === null && <li className="p-3 text-sm text-muted-foreground">Đang tải…</li>}
          {history?.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào.</li>
          )}
          {history?.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 hover:ring-blue-300"
            >
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700"
              >
                <MessageCircle className="size-4" />
              </span>
              <button
                type="button"
                onClick={() => void openChat(c)}
                className="min-w-0 flex-1 py-1 text-left"
              >
                <span className={`block truncate font-semibold text-slate-900 ${text}`}>{c.title}</span>
                {c.lesson && (
                  <span className="block truncate text-xs text-blue-700">Bài: {c.lesson.title}</span>
                )}
              </button>
              {confirmDelete === c.id ? (
                <button
                  type="button"
                  onClick={() => void removeChat(c.id)}
                  className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Xác nhận xóa
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={`Xóa cuộc trò chuyện ${c.title}`}
                  onClick={() => setConfirmDelete(c.id)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div className={`flex ${box} flex-col`}>
      <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs">
        <button
          type="button"
          onClick={startNew}
          className="flex items-center gap-1.5 rounded-full bg-blue-50/25 px-3 py-1.5 font-semibold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50/60 hover:ring-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
        >
          <Plus aria-hidden className="size-3.5" /> Trò chuyện mới
        </button>
        <button
          type="button"
          onClick={() => void openHistory()}
          className="flex items-center gap-1.5 rounded-full bg-blue-50/25 px-3 py-1.5 font-semibold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50/60 hover:ring-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
        >
          <History aria-hidden className="size-3.5" /> Lịch sử
        </button>
        {left !== undefined && (
          <span className="ml-auto text-muted-foreground" aria-live="polite">
            Hôm nay còn {left} lượt
          </span>
        )}
      </div>

      <div aria-label="Tin nhắn" role="log" className="flex-1 space-y-3 overflow-y-auto p-4">
        {topic && (
          <p className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            <span className="truncate">Đang hỏi về: {topic.title}</span>
            {!chatId && (
              <button type="button" aria-label="Bỏ chọn bài học" onClick={onClearLesson} className="ml-auto">
                <X aria-hidden className="size-3.5" />
              </button>
            )}
          </p>
        )}
        {messages.length === 0 && (
          <>
            <p className={`rounded-2xl rounded-tl-sm bg-blue-50 p-3 ${text}`}>
              Chào bạn! Mình là Sao Nhí. Mình sẽ giải thích từng bước, không chỉ đưa đáp án đâu nhé.
            </p>
            <div className="flex flex-wrap gap-2">
              {(topic ? LESSON_SUGGESTIONS : SUGGESTIONS).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy || outOfMessages}
                  onClick={() => void send(s)}
                  className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="ml-8 space-y-1">
              {m.images.length > 0 && (
                <div className="flex justify-end gap-1">
                  {m.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element -- presigned or local blob URLs
                    <img key={src} src={src} alt="Ảnh đính kèm" className="size-16 rounded-xl object-cover" />
                  ))}
                </div>
              )}
              <p
                className={`rounded-2xl rounded-tr-sm bg-blue-600 p-3 whitespace-pre-wrap text-white ${text}`}
              >
                {m.text}
              </p>
            </div>
          ) : (
            <div
              key={m.id}
              className={`mr-6 rounded-2xl rounded-tl-sm bg-slate-50 p-3 ring-1 ring-slate-100 ${text}`}
            >
              {m.text ? (
                <SafeMarkdown md={m.text} className={text} />
              ) : (
                m.status === "streaming" && <p className="text-muted-foreground">Sao Nhí đang suy nghĩ…</p>
              )}
              {m.error && <p className="mt-1 text-xs font-semibold text-red-700">{m.error}</p>}
              {m.status === "incomplete" && (
                <p className="mt-1 text-xs text-muted-foreground">(Câu trả lời chưa hoàn tất)</p>
              )}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="space-y-2 border-t p-3">
        {notice && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {notice}
          </p>
        )}
        {picked.length > 0 && (
          <div className="flex gap-2">
            {picked.map((p) => (
              <div key={p.key} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img
                  src={p.preview}
                  alt={`Xem trước ${p.file.name}`}
                  className="size-14 rounded-xl object-cover"
                />
                <button
                  type="button"
                  aria-label={`Bỏ ảnh ${p.file.name}`}
                  onClick={() => unpick(p.key)}
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-800 p-0.5 text-white"
                >
                  <X aria-hidden className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            multiple
            hidden
            aria-label="Chọn ảnh bài tập"
            onChange={(e) => {
              pickFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Đính kèm ảnh bài tập"
            disabled={busy || outOfMessages}
            onClick={() => fileRef.current?.click()}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-slate-600 hover:bg-blue-50 disabled:opacity-50"
          >
            <ImagePlus aria-hidden className="size-4" />
          </button>
          <textarea
            aria-label="Câu hỏi cho trợ lý AI"
            placeholder={
              paused
                ? "AI đang tạm nghỉ. Bạn quay lại sau nhé!"
                : outOfMessages
                  ? "Hôm nay bạn đã hết lượt hỏi, mai quay lại nhé!"
                  : "Hỏi Sao Nhí điều bạn chưa hiểu…"
            }
            value={draft}
            maxLength={4000}
            rows={1}
            disabled={outOfMessages}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            className={`max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 outline-none ${text} focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed`}
          />
          {streaming ? (
            <button
              type="button"
              aria-label="Dừng trả lời"
              onClick={() => abortRef.current?.abort()}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-800 text-white"
            >
              <Square aria-hidden className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Gửi câu hỏi"
              disabled={busy || outOfMessages || !draft.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white disabled:opacity-50"
            >
              <Send aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <p className={`leading-relaxed text-slate-600 ${large ? "text-sm" : "text-xs"}`}>
          Để bảo vệ dữ liệu cá nhân, bạn đừng gửi tên, email, ảnh cá nhân hay bạn bè cho Sao Nhí nhé. Câu trả
          lời của AI chỉ để tham khảo.
        </p>
      </form>
    </div>
  );
}
