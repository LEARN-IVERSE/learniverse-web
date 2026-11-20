import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/states/page-skeleton";
import { RequireSession } from "@/features/auth/require-session";
import { PostDetail } from "@/features/community/post-detail";

export const metadata: Metadata = { title: "Bài đăng" };

export default function PostPage() {
  return (
    <RequireSession>
      {/* useParams() is request data on a dynamic route: stream it in under Suspense. */}
      <Suspense fallback={<PageSkeleton />}>
        <PostDetail />
      </Suspense>
    </RequireSession>
  );
}
