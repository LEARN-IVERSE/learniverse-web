import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/states/page-skeleton";

import { RequireSession } from "@/features/auth/require-session";
import { LessonTheory } from "@/features/learn/lesson-theory";

export const metadata: Metadata = { title: "Lý thuyết" };

export default function LessonPage() {
  return (
    <RequireSession>
      {/* useParams() is request data on a dynamic route: stream it in under Suspense. */}
      <Suspense fallback={<PageSkeleton />}>
        <LessonTheory />
      </Suspense>
    </RequireSession>
  );
}
