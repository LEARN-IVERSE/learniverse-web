"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { MeOut } from "@/lib/api-client";

import { useSession } from "./session";
import { UserAvatar } from "./user-avatar";

const ROLE_LABELS: Record<MeOut["role"], string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Quản trị viên",
};

/** Header account button: avatar, a small menu with the account and a visible sign-out (OWASP). */
export function AccountMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const state = session?.state;
  if (!state || state.status === "guest" || state.status === "error") {
    return (
      <Link
        href="/login"
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
      >
        Đăng nhập
      </Link>
    );
  }
  if (state.status === "loading" || state.status === "signing-out") {
    return <span aria-hidden className="size-9 animate-pulse rounded-full bg-blue-100" />;
  }

  const { user } = state;
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={`Tài khoản: ${user.name}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full ring-2 ring-white transition focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
      >
        <UserAvatar user={user} />
      </button>
      {open && (
        <div
          role="region"
          aria-label="Tài khoản của bạn"
          className="d-enter absolute top-12 right-0 z-40 w-72 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex items-center gap-3 bg-blue-50 p-4">
            <UserAvatar user={user} className="size-11 text-lg" />
            <div className="min-w-0">
              <p className="truncate font-heading text-lg leading-tight font-bold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <p className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
          <div className="p-2">
            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50"
              >
                <ShieldCheck aria-hidden className="size-4 text-blue-600" />
                Trang quản trị
              </Link>
            )}
            <button
              type="button"
              onClick={() => void session.signOut()}
              className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut aria-hidden className="size-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
