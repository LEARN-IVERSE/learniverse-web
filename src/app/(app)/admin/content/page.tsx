import type { Metadata } from "next";

import { AdminContent } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Nội dung" };

export default function Page() {
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminContent />
      </RequireRole>
    </RequireSession>
  );
}
