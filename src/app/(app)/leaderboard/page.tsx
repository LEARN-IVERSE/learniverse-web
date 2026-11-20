import type { Metadata } from "next";

import { RequireSession } from "@/features/auth/require-session";
import { RankPage } from "@/features/rank/rank-page";

export const metadata: Metadata = { title: "Bảng xếp hạng" };

export default function LeaderboardPage() {
  return (
    <RequireSession>
      <RankPage />
    </RequireSession>
  );
}
