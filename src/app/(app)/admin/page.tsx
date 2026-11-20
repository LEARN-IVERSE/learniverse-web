import { Flag, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/states/empty-state";
import { RequireSession } from "@/features/auth/require-session";
import { RequireRole } from "@/features/auth/require-role";

export const metadata: Metadata = { title: "Quản trị" };

// K3 guards the route; the dashboard itself is built in K11.
export default function AdminPage() {
  return (
    <RequireSession>
      <RequireRole role="admin">
        <PageIntro
          eyebrow="Quản trị"
          title="Trang quản trị"
          description="Tài khoản, nội dung, kiểm duyệt và AI."
        />
        <Link
          href="/admin/reports"
          className="mb-6 flex items-center gap-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-rose-100 transition hover:shadow-lg"
        >
          <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Flag className="size-5" />
          </span>
          <span>
            <span className="block font-heading text-lg font-bold">Báo cáo vi phạm</span>
            <span className="block text-sm text-muted-foreground">Xem và xử lý nội dung bị báo cáo.</span>
          </span>
        </Link>
        <EmptyState
          icon={ShieldCheck}
          title="Khu vực quản trị đang được xây dựng"
          description="Bảng điều khiển cho quản trị viên sẽ xuất hiện ở đây."
        />
      </RequireRole>
    </RequireSession>
  );
}
