import type { Metadata } from "next";

import { AdminReports } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Báo cáo vi phạm" };

export default function Page() {
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminReports />
      </RequireRole>
    </RequireSession>
  );
}
