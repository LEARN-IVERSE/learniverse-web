"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { beVietnamPro } from "./fonts";
import { CURRENT_USER } from "./mock-data";
import { AiFab, InitialAvatar, NAV_ITEMS, SectionView, SiteFooter, type Section } from "./shared";

/** Sample A, "Classic Dashboard": shadcn sidebar (collapses to icons), top header with search. */
export function SampleA() {
  const [section, setSection] = useState<Section>("learn");
  return (
    <div className={`${beVietnamPro.variable} sample-a font-sans`}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-1 py-1.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                L
              </span>
              <div className="leading-tight group-data-[collapsible=icon]:hidden">
                <p className="font-bold">LEARNIVERSE</p>
                <p className="text-xs text-muted-foreground">Our universe of learning</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        isActive={section === id}
                        tooltip={label}
                        onClick={() => setSection(id)}
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:hidden">
              <span className="text-lg">🔥</span>
              <span className="text-sm">
                Chuỗi học: <b>{CURRENT_USER.streakDays} ngày</b>
              </span>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm bài học, bài đăng..." className="pl-8" />
            </div>
            <Button size="icon" variant="ghost" aria-label="Thông báo">
              <Bell className="size-5" />
            </Button>
            <InitialAvatar name={CURRENT_USER.name} className="size-8" />
          </header>
          <main className="flex-1 p-4 md:p-6">
            <SectionView section={section} look="classic" />
          </main>
          <SiteFooter />
        </SidebarInset>
      </SidebarProvider>
      <AiFab look="classic" />
    </div>
  );
}
