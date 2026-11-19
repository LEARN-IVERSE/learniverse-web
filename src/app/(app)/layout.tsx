import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { RequireSession } from "@/features/auth/require-session";
import { SessionProvider } from "@/features/auth/session";

// Route group "(app)": every learner page shares the App Shell and needs an account (K3-D2);
// the group name is not in the URL.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>
        <RequireSession>{children}</RequireSession>
      </AppShell>
    </SessionProvider>
  );
}
