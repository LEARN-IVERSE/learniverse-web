"use client";

import {
  BookOpen,
  Bot,
  ClipboardCheck,
  Flag,
  type LucideIcon,
  MessagesSquare,
  ScrollText,
  ShieldCheck,
  Trophy,
  Users,
  FileCheck2,
  Send,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import { useApi } from "@/features/learn/use-api";
import { type AdminMeOut, adminAdminMe } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "home"
  | "users"
  | "content"
  | "reviews"
  | "my_changes"
  | "essays"
  | "community"
  | "reports"
  | "points"
  | "ai"
  | "audit";

type Item = { key: AdminSection; label: string; icon: LucideIcon; href?: string };

// Sections without a page yet are listed so the admin sees what is coming (K11b, K11c).
const ITEMS: Item[] = [
  { key: "users", label: "Tài khoản", icon: Users, href: "/admin/users" },
  { key: "content", label: "Nội dung", icon: BookOpen, href: "/admin/content" },
  { key: "reviews", label: "Chờ duyệt", icon: FileCheck2, href: "/admin/reviews" },
  { key: "my_changes", label: "Yêu cầu của tôi", icon: Send, href: "/admin/my-changes" },
  { key: "essays", label: "Chấm tự luận", icon: ClipboardCheck, href: "/admin/essays" },
  { key: "community", label: "Cộng đồng", icon: MessagesSquare },
  { key: "reports", label: "Báo cáo vi phạm", icon: Flag, href: "/admin/reports" },
  { key: "points", label: "Điểm đóng góp", icon: Trophy },
  { key: "ai", label: "Cấu hình AI", icon: Bot },
  { key: "audit", label: "Nhật ký quản trị", icon: ScrollText, href: "/admin/audit" },
];

export function adminItems(me: AdminMeOut): Item[] {
  return ITEMS.filter((i) => me.sections.includes(i.key));
}

/** Frame of every /admin page: a menu with only the sections this account may open (K11a). */
export function AdminShell({
  active,
  title,
  description,
  children,
}: {
  active: AdminSection;
  title: string;
  description?: string;
  children: (me: AdminMeOut) => ReactNode;
}) {
  const [me, retry] = useApi("admin:me", () => adminAdminMe());
  if (me.status === "loading") return <PageSkeleton />;
  if (me.status === "error") return <ErrorState onRetry={retry} />;
  const items = adminItems(me.data);
  const allowed = active === "home" || me.data.sections.includes(active);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_1fr]">
      <nav aria-label="Menu quản trị" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <Link
          href="/admin"
          className={cn(
            "mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 font-heading text-lg font-bold",
            active === "home" ? "bg-blue-600 text-white" : "text-slate-900 hover:bg-white",
          )}
        >
          <ShieldCheck aria-hidden className="size-5" /> Quản trị
        </Link>
        <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {items.map(({ key, label, icon: Icon, href }) => (
            <li key={key} className="shrink-0">
              {href ? (
                <Link
                  href={href}
                  aria-current={active === key ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold",
                    active === key ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-white",
                  )}
                >
                  <Icon aria-hidden className="size-4" /> {label}
                </Link>
              ) : (
                <span
                  title="Sắp có"
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-400"
                >
                  <Icon aria-hidden className="size-4" /> {label}
                  <span className="text-[11px]">· sắp có</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <section className="min-w-0 space-y-5">
        <header>
          <p className="text-xs font-bold tracking-[.2em] text-blue-600 uppercase">Quản trị</p>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </header>
        {allowed ? (
          children(me.data)
        ) : (
          <ErrorState title="Bạn không có quyền vào mục này" description="Hãy nhờ quản trị viên cấp quyền." />
        )}
      </section>
    </div>
  );
}
