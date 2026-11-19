import { Trophy } from "lucide-react";
import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/states/empty-state";

export const metadata: Metadata = { title: "Bảng xếp hạng" };

// K2 frame: the two TOP 10 boards are computed by the API in K8.
export default function RankPage() {
  return (
    <>
      <PageIntro
        eyebrow="Bảng xếp hạng"
        title="Những ngôi sao của LEARNIVERSE"
        description="TOP 10 thành viên tích cực và TOP 10 thời gian học."
      />
      <EmptyState
        icon={Trophy}
        title="Bảng xếp hạng đang trống"
        description="Học bài đều đặn và giúp đỡ bạn bè để có tên trên bảng nhé."
      />
    </>
  );
}
