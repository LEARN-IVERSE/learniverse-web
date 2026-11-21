"use client";

import Link from "next/link";

import { useSession } from "@/features/auth/session";
import { ReportsPage } from "@/features/community/reports-page";

import { AdminShell, adminItems } from "./admin-shell";
import { AuditAdmin } from "./audit-admin";
import { UsersAdmin } from "./users-admin";

/** /admin: entry cards for the sections this account may open. */
export function AdminHome() {
  return (
    <AdminShell active="home" title="Trang quản trị" description="Chọn mục bạn muốn quản lý.">
      {(me) => (
        <ul className="grid gap-3 sm:grid-cols-2">
          {adminItems(me).map(({ key, label, icon: Icon, href }) => (
            <li key={key}>
              {href ? (
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-blue-100 transition hover:shadow-lg"
                >
                  <span
                    aria-hidden
                    className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="font-heading text-lg font-bold">{label}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/60 p-5 text-slate-400 ring-1 ring-slate-100">
                  <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-slate-50">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-heading text-lg font-bold">{label}</span>
                  <span className="ml-auto text-xs">Sắp có</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

export function AdminUsers() {
  const state = useSession()?.state;
  const myId = state?.status === "signed-in" ? state.user.id : "";
  return (
    <AdminShell active="users" title="Tài khoản" description="Tìm, khóa/mở khóa và phân quyền tài khoản.">
      {() => <UsersAdmin myId={myId} />}
    </AdminShell>
  );
}

export function AdminAudit() {
  return (
    <AdminShell active="audit" title="Nhật ký quản trị" description="Mọi thay đổi trong trang quản trị.">
      {() => <AuditAdmin />}
    </AdminShell>
  );
}

export function AdminReports() {
  return (
    <AdminShell
      active="reports"
      title="Báo cáo vi phạm"
      description="Xem nội dung bị báo cáo, rồi giữ, ẩn hoặc xóa. Báo cáo không tự xóa nội dung."
    >
      {() => <ReportsPage />}
    </AdminShell>
  );
}
