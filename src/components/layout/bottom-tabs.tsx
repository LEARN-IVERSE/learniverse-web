"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

import { activeNavItem, NAV_ITEMS, type NavItem } from "./nav-items";

/** Bottom tab bar for phones (below md); same destinations as the rail. */
export function BottomTabs() {
  // The active tab reads the URL, so it streams in under Suspense (see nav-rail.tsx).
  return (
    <Suspense fallback={<Tabs active={undefined} />}>
      <ActiveTabs />
    </Suspense>
  );
}

function ActiveTabs() {
  return <Tabs active={activeNavItem(usePathname())} />;
}

function Tabs({ active }: { active: NavItem | undefined }) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-blue-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const current = active?.href === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold focus-visible:bg-blue-50 focus-visible:outline-none",
              current ? "text-blue-600" : "text-slate-500",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-12 place-items-center rounded-full transition",
                current && "bg-blue-100",
              )}
            >
              <Icon aria-hidden className="size-5" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
