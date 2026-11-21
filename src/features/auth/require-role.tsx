"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/states/empty-state";
import { PageSkeleton } from "@/components/states/page-skeleton";
import type { MeOut } from "@/lib/api-client";

import { useSession } from "./session";

/** Hides a page from other roles. The API enforces the same rule on its admin endpoints. */
export function RequireRole({
  role,
  roles,
  children,
}: {
  role?: MeOut["role"];
  /** Any of these roles may enter (e.g. admins and teachers for the admin area, K11). */
  roles?: MeOut["role"][];
  children: ReactNode;
}) {
  const allowed = roles ?? (role ? [role] : []);
  const state = useSession()?.state;
  // Never return null here: Next.js would drop the subtree from rendering (instant-navigation check).
  if (state?.status !== "signed-in") return <PageSkeleton />;
  if (!allowed.includes(state.user.role)) {
    return (
      <EmptyState
        icon={Lock}
        title="Bạn không có quyền vào trang này"
        description="Trang này chỉ dành cho tài khoản được cấp quyền của LEARNIVERSE."
      />
    );
  }
  return children;
}
