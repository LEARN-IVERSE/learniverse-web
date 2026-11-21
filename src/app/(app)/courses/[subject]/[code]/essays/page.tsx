import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/states/page-skeleton";
import { RequireSession } from "@/features/auth/require-session";
import { EssayPage } from "@/features/practice/essay-page";

export const metadata: Metadata = { title: "Tự luận" };

export default function Page() {
  return (
    <RequireSession>
      <Suspense fallback={<PageSkeleton />}>
        <EssayPage />
      </Suspense>
    </RequireSession>
  );
}
