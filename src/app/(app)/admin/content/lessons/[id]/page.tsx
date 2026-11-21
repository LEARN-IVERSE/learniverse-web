import type { Metadata } from "next";

import { AdminLesson } from "@/features/admin/admin-pages";
import { RequireRole } from "@/features/auth/require-role";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Sửa bài" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireSession>
      <RequireRole roles={["admin", "teacher"]}>
        <AdminLesson lessonId={id} />
      </RequireRole>
    </RequireSession>
  );
}
