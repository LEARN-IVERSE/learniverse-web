import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { RequireSession } from "@/features/auth/require-session";
import { ApiStatus } from "@/features/system/api-status";

export const metadata: Metadata = { title: "Trạng thái hệ thống" };

// K1 connectivity check, moved here from "/" in K2 (not linked from the navigation).
export default function SystemPage() {
  return (
    <RequireSession>
      <div className="max-w-xl">
        <PageIntro
          eyebrow="Hệ thống"
          title="Trạng thái hệ thống"
          description="Kiểm tra kết nối từ web tới API và cơ sở dữ liệu."
        />
        <ApiStatus />
      </div>
    </RequireSession>
  );
}
