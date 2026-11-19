import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/states/empty-state";

export const metadata: Metadata = { title: "Mạng xã hội" };

// K2 frame: subject boxes, posts and comments arrive in K7.
export default function SocialPage() {
  return (
    <>
      <PageIntro
        eyebrow="Mạng xã hội"
        title="Góc hỏi đáp"
        description="Hỏi bài, chia sẻ mẹo học và giúp đỡ bạn bè trong từng Box môn học."
      />
      <EmptyState
        icon={MessagesSquare}
        title="Chưa có bài viết nào"
        description="Hãy là người đầu tiên đặt câu hỏi khi Box môn học được mở."
      />
    </>
  );
}
