import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/states/page-skeleton";
import { RequireSession } from "@/features/auth/require-session";
import { LessonActivityRoute } from "@/features/practice/lesson-activity-route";

export const metadata: Metadata = { title: "Làm bài" };

export default function LessonActivityPage() {
  return (
    <RequireSession>
      <Suspense fallback={<PageSkeleton />}>
        <LessonActivityRoute />
      </Suspense>
    </RequireSession>
  );
}
