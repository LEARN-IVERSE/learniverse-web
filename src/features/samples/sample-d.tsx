"use client";

import { Bell, Flame, Search } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { DrumStarMark, OrbitBackdrop, SparkleField } from "./d/art";
import { AssistantFab } from "./d/assistant";
import { ME, WORLDS } from "./d/data";
import { baloo, dancing, hand, lexend } from "./d/fonts";
import { LearnHome, SubjectWorld } from "./d/learn";
import { LOGO_IDS, LogoById, type LogoId, Wordmark } from "./logos";
import { RankView } from "./d/rank";
import { SocialView } from "./d/social";
import type { SubjectId } from "./mock-data";
import { InitialAvatar, NAV_ITEMS, type Section } from "./shared";

const SECTION_TITLES: Record<Section, string> = {
  learn: "Học tập",
  social: "Mạng xã hội",
  rank: "Bảng xếp hạng",
};

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** Logo preview for the K2 logo lab: `/samples/d#logo=<id>` swaps the brand mark. */
function usePreviewLogo(): LogoId | undefined {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const id = /logo=([a-z]+)/.exec(hash)?.[1];
  return LOGO_IDS.find((known) => known === id);
}

function BrandMark({ logo, className }: { logo?: LogoId; className?: string }) {
  return logo ? <LogoById id={logo} className={className} /> : <DrumStarMark className={className} />;
}

/**
 * Sample D, "Quỹ đạo" (Orbit): the focused centre column of sample C with the brighter palette of B,
 * plus themed art per area. Brand motif: a star inside concentric rings (a universe map that also
 * echoes the Dong Son drum face).
 */
export function SampleD() {
  const [section, setSection] = useState<Section>("learn");
  const [world, setWorld] = useState<SubjectId | null>(null);

  // Every view change starts at the top, so learners never land in the middle of the new page.
  const openWorld = (next: SubjectId | null) => {
    setWorld(next);
    window.scrollTo({ top: 0 });
  };
  const go = (next: Section) => {
    setSection(next);
    openWorld(null);
  };
  const worldName = world ? WORLDS.find((w) => w.id === world)?.name : undefined;
  const logo = usePreviewLogo();

  return (
    <div
      className={cn(
        lexend.variable,
        baloo.variable,
        dancing.variable,
        hand.variable,
        "sample-d relative isolate flex min-h-svh bg-background font-sans text-slate-900",
      )}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <OrbitBackdrop className="absolute -top-64 -right-64 size-[52rem]" />
        <OrbitBackdrop className="absolute -bottom-80 -left-80 size-[44rem] opacity-60" />
        <SparkleField />
      </div>

      <aside className="sticky top-0 hidden h-svh w-[5.5rem] shrink-0 flex-col items-center gap-2 border-r border-blue-100 bg-white/80 px-2 py-5 md:flex">
        <BrandMark logo={logo} className="mb-5 size-12 text-blue-600" />
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            aria-current={section === id ? "page" : undefined}
            className={cn(
              "flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[11px] leading-tight font-semibold transition",
              section === id
                ? "bg-blue-600 text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,.9)]"
                : "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-1 text-[11px] font-semibold text-orange-600">
          <Flame className="d-flicker size-6" />
          {ME.streakDays} ngày
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-blue-100/70 bg-background/90">
          <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center gap-3 px-4 md:px-8">
            <BrandMark logo={logo} className="size-9 shrink-0 text-blue-600 md:hidden" />
            <div className="min-w-0">
              <Wordmark className="block text-[1.4rem] sm:text-2xl md:text-[1.9rem]" />
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                {SECTION_TITLES[section]}
                {worldName ? ` · ${worldName}` : ""}
              </p>
            </div>
            <label className="relative ml-auto hidden w-64 md:block">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                aria-label="Tìm kiếm"
                placeholder="Tìm bài học, câu hỏi..."
                className="h-10 w-full rounded-full bg-white pr-4 pl-9 text-sm ring-1 ring-blue-100 outline-none focus:ring-2 focus:ring-blue-300"
              />
            </label>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-bold text-orange-600 md:ml-0">
              <Flame className="d-flicker size-4" />
              {ME.streakDays}
            </span>
            <button
              type="button"
              aria-label="Thông báo"
              className="relative rounded-full p-2 transition hover:bg-white"
            >
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-background" />
            </button>
            <InitialAvatar name={ME.name} className="size-9 ring-2 ring-white" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 md:px-8 md:pb-12">
          <div key={`${section}-${world ?? "home"}`} className="d-enter">
            {section === "learn" &&
              (world ? (
                <SubjectWorld id={world} onBack={() => openWorld(null)} />
              ) : (
                <LearnHome onOpen={openWorld} />
              ))}
            {section === "social" && <SocialView />}
            {section === "rank" && <RankView />}
          </div>
        </main>

        <footer className="border-t border-blue-100 px-4 py-6 pb-28 text-sm text-slate-500 md:px-8 md:pb-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <BrandMark logo={logo} className="size-7 text-blue-600" />
              <Wordmark className="text-lg" />
            </span>
            <span>Giới thiệu</span>
            <span>Liên hệ</span>
            <span>Điều khoản</span>
            <span>Chính sách bảo mật</span>
            <span className="ml-auto text-xs tracking-widest uppercase">Our universe of learning</span>
          </div>
        </footer>
      </div>

      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-blue-100 bg-white md:hidden"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            aria-current={section === id ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold",
              section === id ? "text-blue-600" : "text-slate-500",
            )}
          >
            <span
              className={cn(
                "grid h-7 w-12 place-items-center rounded-full transition",
                section === id && "bg-blue-100",
              )}
            >
              <Icon className="size-5" />
            </span>
            {label}
          </button>
        ))}
      </nav>

      <AssistantFab />
    </div>
  );
}
