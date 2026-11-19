"use client";

import { Bell, Flame, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { CometLogo } from "@/components/brand/comet-logo";
import { Wordmark } from "@/components/brand/wordmark";

import { activeNavItem } from "./nav-items";

/**
 * Top bar: brand, current area, search, streak, notifications and account.
 * K2 renders the guest frame only; data arrives in K3 (account), K4 (search), K6 (streak)
 * and K7 (notifications).
 */
export function AppHeader() {
  const section = activeNavItem(usePathname())?.label;

  return (
    <header className="sticky top-0 z-20 border-b border-blue-100/70 bg-background/90">
      <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center gap-3 px-4 md:px-8">
        <CometLogo className="size-9 shrink-0 md:hidden" />
        <div className="min-w-0">
          <Wordmark className="block text-[1.4rem] sm:text-2xl md:text-[1.9rem]" />
          {section && <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{section}</p>}
        </div>

        <label className="relative ml-auto hidden w-64 md:block">
          <span className="sr-only">Tìm kiếm</span>
          <Search
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Tìm bài học, câu hỏi..."
            className="h-10 w-full rounded-full bg-white pr-4 pl-9 text-sm ring-1 ring-blue-100 outline-none focus:ring-2 focus:ring-blue-300"
          />
        </label>

        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-bold text-orange-600 md:ml-0">
          <Flame aria-hidden className="d-flicker size-4" />
          <span className="sr-only">Chuỗi ngày học:</span>0<span className="sr-only"> ngày</span>
        </span>
        <button
          type="button"
          aria-label="Thông báo"
          className="rounded-full p-2 transition hover:bg-white focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          <Bell aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Tài khoản"
          className="grid size-9 place-items-center rounded-full bg-blue-100 text-blue-700 ring-2 ring-white transition hover:bg-blue-200 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
        >
          <UserRound aria-hidden className="size-5" />
        </button>
      </div>
    </header>
  );
}
