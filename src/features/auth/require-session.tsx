"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";
import { PageSkeleton } from "@/components/states/page-skeleton";

import { useSession } from "./session";

/**
 * Learner pages need an account (decision K3-D2): guests are sent to /login?next=<here>.
 * Used inside each page (not in the layout), so the page segment always renders.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const session = useSession();
  const status = session?.state.status ?? "guest";
  const router = useRouter();

  useEffect(() => {
    if (status !== "guest") return;
    const here = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [status, router]);

  if (status === "signed-in") return children;
  if (status === "error")
    return (
      <ErrorState
        title="Chưa kết nối được máy chủ"
        description="LEARNIVERSE chưa kiểm tra được tài khoản của bạn. Hãy thử lại sau ít giây."
        onRetry={session?.refresh}
      />
    );
  return <PageSkeleton />;
}
