import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";
import { ReportsPage } from "@/features/community/reports-page";

export const metadata: Metadata = { title: "Báo cáo vi phạm" };

export default function AdminReportsPage() {
  return (
    <RequireSession>
      <RequireRole role="admin">
        <PageIntro
          eyebrow="Quản trị"
          title="Báo cáo vi phạm"
          description="Xem nội dung bị báo cáo, rồi giữ, ẩn hoặc xóa. Báo cáo không tự xóa nội dung."
        />
        <ReportsPage />
      </RequireRole>
    </RequireSession>
  );
}
