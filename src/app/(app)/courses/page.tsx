import type { Metadata } from "next";

import { RequireSession } from "@/features/auth/require-session";
import { SubjectGrid } from "@/features/learn/subject-grid";

export const metadata: Metadata = { title: "Học tập" };

export default function CoursesPage() {
  return (
    <RequireSession>
      <SubjectGrid />
    </RequireSession>
  );
}
