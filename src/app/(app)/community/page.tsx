import type { Metadata } from "next";

import { RequireSession } from "@/features/auth/require-session";
import { CommunityPage } from "@/features/community/community-page";

export const metadata: Metadata = { title: "Mạng xã hội" };

export default function SocialPage() {
  return (
    <RequireSession>
      <CommunityPage />
    </RequireSession>
  );
}
