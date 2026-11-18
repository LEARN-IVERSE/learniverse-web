"use client";

import { Bell, Flame, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { nunito } from "./fonts";
import { CURRENT_USER } from "./mock-data";
import { AiFab, InitialAvatar, NAV_ITEMS, SectionView, SiteFooter, type Section } from "./shared";

/** Sample B, "Playful": big pill navigation, colorful rounded cards, bottom tab bar on phones. */
export function SampleB() {
  const [section, setSection] = useState<Section>("learn");
  return (
    <div className={cn(nunito.variable, "sample-b flex min-h-svh flex-col bg-sky-50 font-sans")}>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b-2 border-sky-100 bg-white px-4">
        <span className="text-2xl font-black tracking-tight text-primary">LEARNIVERSE</span>
        <div className="relative mx-auto hidden max-w-md flex-1 md:block">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm bài học, bài đăng..." className="rounded-full pl-9" />
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 font-bold text-orange-600 md:ml-0">
          <Flame className="size-4" /> {CURRENT_USER.streakDays}
        </span>
        <Button size="icon" variant="ghost" className="rounded-full" aria-label="Thông báo">
          <Bell className="size-5" />
        </Button>
        <InitialAvatar name={CURRENT_USER.name} />
      </header>

      <div className="flex flex-1">
        <nav className="sticky top-16 hidden h-[calc(100svh-4rem)] w-64 shrink-0 flex-col gap-2 p-4 md:flex">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold transition",
                section === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-white",
              )}
            >
              <Icon className="size-6" />
              {label}
            </button>
          ))}
          <div className="mt-auto rounded-2xl bg-white p-4 text-sm shadow-sm">
            <p className="font-bold">Xin chào, {CURRENT_USER.name}! 👋</p>
            <p className="text-muted-foreground">Hôm nay mình học tiếp Toán 9 nhé.</p>
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
            <SectionView section={section} look="playful" />
          </main>
          <SiteFooter />
        </div>
      </div>

      {/* Phones: the sidebar becomes a bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-sky-100 bg-white md:hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-bold",
              section === id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-6" />
            {label}
          </button>
        ))}
      </nav>
      <AiFab look="playful" />
    </div>
  );
}
