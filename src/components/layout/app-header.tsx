"use client";

import { Bell, Flame } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { CometLogo } from "@/components/brand/comet-logo";
import { Wordmark } from "@/components/brand/wordmark";
import { AccountMenu } from "@/features/auth/account-menu";
import { LessonSearch } from "@/features/learn/lesson-search";

import { activeNavItem } from "./nav-items";

/**
 * Top bar: brand, current area, search, streak, notifications and account.
 * The account menu is live since K3; search is live since K4; streak and notifications get data in K6, K7.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-blue-100/70 bg-background/90">
      <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center gap-3 px-4 md:px-8">
        <CometLogo className="size-9 shrink-0 md:hidden" />
        <div className="min-w-0">
          <Wordmark className="block text-[1.4rem] sm:text-2xl md:text-[1.9rem]" />
          <Suspense fallback={null}>
            <SectionLabel />
          </Suspense>
        </div>

        <LessonSearch />

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
        <AccountMenu />
      </div>
    </header>
  );
}

/** Name of the current area under the wordmark; reads the URL, hence its own Suspense boundary. */
function SectionLabel() {
  const section = activeNavItem(usePathname())?.label;
  return section ? <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{section}</p> : null;
}
