import type { Metadata } from "next";

import { AdminImport } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Nạp câu hỏi hàng loạt" };

export default async function Page({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await searchParams;
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminImport subject={subject ?? ""} />
      </RequireRole>
    </RequireSession>
  );
}
