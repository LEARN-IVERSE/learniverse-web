import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/states/page-skeleton";

import { RequireSession } from "@/features/auth/require-session";
import { SubjectOutline } from "@/features/learn/subject-outline";

export const metadata: Metadata = { title: "Danh sách bài học" };

export default function SubjectPage() {
  return (
    <RequireSession>
      {/* useParams() is request data on a dynamic route: stream it in under Suspense. */}
      <Suspense fallback={<PageSkeleton />}>
        <SubjectOutline />
      </Suspense>
    </RequireSession>
  );
}
