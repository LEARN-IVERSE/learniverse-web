import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

// Route group "(app)": every learner page shares the App Shell; the group name is not in the URL.
// The layout always renders {children}: Next.js 16 drops (and cannot validate) segments a layout
// omits, so the sign-in guard lives inside each page (<RequireSession>), not here.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
