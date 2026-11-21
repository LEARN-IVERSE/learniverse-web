import type { Metadata } from "next";

import { AdminMyChanges } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Yêu cầu của tôi" };

export default function Page() {
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminMyChanges />
      </RequireRole>
    </RequireSession>
  );
}
