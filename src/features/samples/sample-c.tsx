"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { lexend } from "./fonts";
import { CURRENT_USER } from "./mock-data";
import { AiFab, InitialAvatar, NAV_ITEMS, SectionView, SiteFooter, type Section } from "./shared";

/** Sample C, "Minimal Focus": slim icon rail, lots of white space, reading-friendly typography. */
export function SampleC() {
  const [section, setSection] = useState<Section>("learn");

  const navButtons = (onPick?: () => void) =>
    NAV_ITEMS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => {
          setSection(id);
          onPick?.();
        }}
        className={cn(
          "flex w-full flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-medium transition",
          section === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
        )}
      >
        <Icon className="size-5" />
        {label}
      </button>
    ));

  return (
    <div className={cn(lexend.variable, "sample-c flex min-h-svh bg-white font-sans")}>
      <aside className="sticky top-0 hidden h-svh w-24 shrink-0 flex-col items-center gap-2 border-r px-2 py-4 md:flex">
        <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
          L
        </span>
        {navButtons()}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-white/90 px-4 backdrop-blur md:px-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden" aria-label="Mở menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={cn(lexend.variable, "sample-c w-28 p-2 font-sans")}>
              <SheetHeader className="px-0">
                <SheetTitle className="text-center text-sm">Menu</SheetTitle>
              </SheetHeader>
              <div className="space-y-2">{navButtons()}</div>
            </SheetContent>
          </Sheet>
          <span className="text-lg font-semibold tracking-wide">LEARNIVERSE</span>
          <div className="relative ml-auto hidden w-72 md:block">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm kiếm" className="border-0 bg-muted pl-8 shadow-none" />
          </div>
          <span className="ml-auto text-sm text-muted-foreground md:ml-0">
            🔥 {CURRENT_USER.streakDays} ngày
          </span>
          <Button size="icon" variant="ghost" aria-label="Thông báo">
            <Bell className="size-5" />
          </Button>
          <InitialAvatar name={CURRENT_USER.name} className="size-8" />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-10">
          <SectionView section={section} look="minimal" />
        </main>
        <SiteFooter />
      </div>
      <AiFab look="minimal" />
    </div>
  );
}
