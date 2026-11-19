"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/states/empty-state";
import type { MeOut } from "@/lib/api-client";

import { useSession } from "./session";

/** Hides a page from other roles. The API enforces the same rule on its admin endpoints. */
export function RequireRole({ role, children }: { role: MeOut["role"]; children: ReactNode }) {
  const state = useSession()?.state;
  if (state?.status !== "signed-in") return null;
  if (state.user.role !== role) {
    return (
      <EmptyState
        icon={Lock}
        title="Bạn không có quyền vào trang này"
        description="Trang này chỉ dành cho quản trị viên của LEARNIVERSE."
      />
    );
  }
  return children;
}
