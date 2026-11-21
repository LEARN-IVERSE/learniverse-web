import type { Metadata } from "next";

import { AdminEssays } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Chấm tự luận" };

export default function Page() {
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminEssays />
      </RequireRole>
    </RequireSession>
  );
}
