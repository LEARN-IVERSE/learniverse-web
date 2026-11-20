"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { CometLogo } from "@/components/brand/comet-logo";
import { Wordmark } from "@/components/brand/wordmark";
import { AccountMenu } from "@/features/auth/account-menu";
import { NotificationBell } from "@/features/community/notification-bell";
import { LessonSearch } from "@/features/learn/lesson-search";
import { StreakChip } from "@/features/progress/streak-chip";

import { activeNavItem } from "./nav-items";

/**
 * Top bar: brand, current area, search, streak, notifications and account.
 * The account menu is live since K3, search since K4, the streak since K6; the bell since K7.
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

        <StreakChip />
        <NotificationBell />
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
