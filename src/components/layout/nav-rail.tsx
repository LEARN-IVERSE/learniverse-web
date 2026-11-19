"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { CometLogo } from "@/components/brand/comet-logo";
import { cn } from "@/lib/utils";

import { activeNavItem, NAV_ITEMS, type NavItem } from "./nav-items";

/** Narrow left rail for tablets and desktops (hidden below md, where the bottom tabs take over). */
export function NavRail() {
  return (
    <aside className="sticky top-0 hidden h-svh w-[5.5rem] shrink-0 flex-col items-center gap-2 border-r border-blue-100 bg-white/80 px-2 py-5 md:flex">
      <Link
        href="/courses"
        aria-label="LEARNIVERSE, về trang Học tập"
        className="mb-5 rounded-full focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
      >
        <CometLogo className="size-12" />
      </Link>
      {/* Only the active-link marking reads the URL; it streams in under Suspense (Next.js 16
          cannot know dynamic params such as /courses/[subject] while prerendering). */}
      <Suspense fallback={<RailLinks active={undefined} />}>
        <ActiveRailLinks />
      </Suspense>
    </aside>
  );
}

function ActiveRailLinks() {
  return <RailLinks active={activeNavItem(usePathname())} />;
}

function RailLinks({ active }: { active: NavItem | undefined }) {
  return (
    <nav aria-label="Điều hướng chính" className="flex w-full flex-col gap-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const current = active?.href === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-3 text-center text-[11px] leading-tight font-semibold transition focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none",
              current
                ? "bg-blue-600 text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,.9)]"
                : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
            )}
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
