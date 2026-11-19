import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

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
        <EmptyState
          icon={ShieldCheck}
          title="Khu vực quản trị đang được xây dựng"
          description="Bảng điều khiển cho quản trị viên sẽ xuất hiện ở đây."
        />
      </RequireRole>
    </RequireSession>
  );
}
