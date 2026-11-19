import type { ReactNode } from "react";

import { baloo, lexend } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { AiFab } from "./ai-fab";
import { AppFooter } from "./app-footer";
import { AppHeader } from "./app-header";
import { BottomTabs } from "./bottom-tabs";
import { NavRail } from "./nav-rail";
import { SpaceBackdrop } from "./space-backdrop";

/**
 * The frame shared by every learner page (sample D "Quỹ đạo", chosen in K2): rail on the left
 * (md and up) or tabs at the bottom (phones), header, centred content column, footer and the
 * floating AI button over a faint orbit backdrop.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        lexend.variable,
        baloo.variable,
        "app-shell relative isolate flex min-h-svh bg-background font-sans text-slate-900",
      )}
    >
      <a
        href="#noi-dung"
        className="sr-only z-50 rounded-full bg-blue-600 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Bỏ qua, tới nội dung chính
      </a>
      <SpaceBackdrop />
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main id="noi-dung" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 md:px-8 md:pb-12">
          {children}
        </main>
        <AppFooter />
      </div>
      <BottomTabs />
      <AiFab />
    </div>
  );
}
