import type { Metadata } from "next";

import { AdminCommunity } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Cộng đồng" };

export default function Page() {
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminCommunity />
      </RequireRole>
    </RequireSession>
  );
}
