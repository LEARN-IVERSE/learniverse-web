import type { Metadata } from "next";

import { AdminNewLesson } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Thêm bài" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; unit?: string }>;
}) {
  const { subject, unit } = await searchParams;
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminNewLesson subject={subject ?? ""} unit={unit ?? ""} />
      </RequireRole>
    </RequireSession>
  );
}
