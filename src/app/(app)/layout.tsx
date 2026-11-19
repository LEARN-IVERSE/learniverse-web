import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

// Route group "(app)": every learner page shares the App Shell; the group name is not in the URL.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
