"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Mascot } from "@/components/brand/mascot";
import { AiChat } from "@/features/ai/ai-chat";
import { type LessonAsk, onAskAboutLesson } from "@/features/ai/ask-ai";

/**
 * Floating AI button with the mascot "Sao Nhí", present on every learner page (bottom right).
 * The panel holds the chat (K9); a lesson page can open it about that lesson ("Hỏi về bài này").
 */
export function AiFab() {
  const [open, setOpen] = useState(false);
  // The chat mounts on first open and then stays mounted while hidden, so closing the panel does not
  // drop an answer that is still being written.
  const [started, setStarted] = useState(false);
  const [lesson, setLesson] = useState<LessonAsk | null>(null);
  const [large, setLarge] = useState(false);

  const show = (value: boolean) => {
    setOpen(value);
    if (value) setStarted(true);
  };

  useEffect(
    () =>
      onAskAboutLesson((l) => {
        setLesson(l);
        setOpen(true);
        setStarted(true);
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      <section
        aria-label="Trợ lý AI Sao Nhí"
        hidden={!open}
        className={`d-enter ${large ? "w-[44rem]" : "w-[24rem]"} max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-black/5`}
      >
        <header className="flex items-center gap-3 bg-blue-600 px-4 py-3 text-white">
          <Mascot className="size-10" />
          <div className="flex-1">
            <p className="font-heading text-lg leading-none font-bold">Sao Nhí</p>
            <p className="text-xs text-blue-100">Trợ lý AI học tập · lớp 9</p>
          </div>
          <button
            type="button"
            aria-label={large ? "Thu nhỏ khung chat" : "Phóng to khung chat"}
            aria-pressed={large}
            onClick={() => setLarge((v) => !v)}
            className="rounded-full p-1.5 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            {large ? (
              <Minimize2 aria-hidden className="size-5" />
            ) : (
              <Maximize2 aria-hidden className="size-5" />
            )}
          </button>
          <button
            type="button"
            aria-label="Đóng trợ lý"
            onClick={() => show(false)}
            className="rounded-full p-1.5 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <X aria-hidden className="size-5" />
          </button>
        </header>
        {started && <AiChat lesson={lesson} onClearLesson={() => setLesson(null)} large={large} />}
      </section>
      <div className="flex items-center gap-2">
        {!open && (
          <span className="d-hint hidden rounded-2xl rounded-br-sm bg-white px-3 py-2 text-sm font-semibold shadow-md ring-1 ring-black/5 md:block">
            Hỏi Sao Nhí nhé!
          </span>
        )}
        <button
          type="button"
          aria-label={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
          aria-expanded={open}
          onClick={() => show(!open)}
          className="grid size-16 place-items-center rounded-full bg-white shadow-xl ring-4 ring-blue-100 transition hover:ring-blue-200 focus-visible:ring-blue-300 focus-visible:outline-none"
        >
          <Mascot className="d-bob size-12" />
        </button>
      </div>
    </div>
  );
}
