"use client";

import { Send, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Mascot } from "./art";
import { ME } from "./data";

const SUGGESTIONS = [
  "Giải thích phương trình bậc hai",
  "Tạo 5 câu trắc nghiệm ôn bài",
  "Cách viết mở bài nghị luận",
];

/** Floating AI assistant with its mascot "Sao Nhí" (present on every page, bottom-right). */
export function AssistantFab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-3 md:right-6 md:bottom-6">
      {open && (
        <section
          aria-label="Trợ lý AI Sao Nhí"
          className="d-enter w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-black/5"
        >
          <header className="flex items-center gap-3 bg-blue-600 px-4 py-3 text-white">
            <Mascot className="size-10" />
            <div className="flex-1">
              <p className="font-display text-lg leading-none font-bold">Sao Nhí</p>
              <p className="text-xs text-blue-100">Trợ lý AI học tập · lớp 9</p>
            </div>
            <button
              type="button"
              aria-label="Đóng trợ lý"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/15"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="space-y-3 p-4">
            <p className="rounded-2xl rounded-tl-sm bg-blue-50 p-3 text-sm">
              Chào {ME.name}! Bạn đang học bài nào? Mình sẽ giải thích từng bước, không chỉ đưa đáp án đâu
              nhé.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                aria-label="Câu hỏi cho trợ lý AI"
                placeholder="Nhập câu hỏi hoặc dán đề bài..."
                className="h-10 flex-1 rounded-full bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                aria-label="Gửi câu hỏi"
                className="grid size-10 place-items-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Câu trả lời của AI chỉ để tham khảo và có thể chưa chính xác.
            </p>
          </div>
        </section>
      )}
      <div className="flex items-center gap-2">
        {!open && (
          <span className="d-hint hidden rounded-2xl rounded-br-sm bg-white px-3 py-2 text-sm font-semibold shadow-md ring-1 ring-black/5 md:block">
            Hỏi Sao Nhí nhé!
          </span>
        )}
        <button
          type="button"
          aria-label="Mở trợ lý AI"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid size-16 place-items-center rounded-full bg-white shadow-xl ring-4 ring-blue-100 transition hover:ring-blue-200 focus-visible:ring-blue-300 focus-visible:outline-none",
          )}
        >
          <Mascot className="d-bob size-12" />
        </button>
      </div>
    </div>
  );
}
