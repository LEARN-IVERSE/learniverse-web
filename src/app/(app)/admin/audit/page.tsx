import type { Metadata } from "next";

import { AdminAudit } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Nhật ký quản trị" };

export default function Page() {
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminAudit />
      </RequireRole>
    </RequireSession>
  );
}
