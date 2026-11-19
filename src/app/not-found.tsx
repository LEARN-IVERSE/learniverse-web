import { Compass } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { SessionProvider } from "@/features/auth/session";

// Unknown URLs still get the full App Shell, so learners can navigate away.
export default function NotFound() {
  return (
    <SessionProvider>
      <AppShell>
        <EmptyState
          icon={Compass}
          title="Không tìm thấy trang"
          description="Trang này đã bay ra khỏi vũ trụ LEARNIVERSE hoặc chưa từng tồn tại."
        >
          <Link
            href="/hoc-tap"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-none"
          >
            Về trang Học tập
          </Link>
        </EmptyState>
      </AppShell>
    </SessionProvider>
  );
}
