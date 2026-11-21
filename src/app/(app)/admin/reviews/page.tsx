import type { Metadata } from "next";

import { AdminReviews } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Chờ duyệt" };

export default function Page() {
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminReviews />
      </RequireRole>
    </RequireSession>
  );
}
