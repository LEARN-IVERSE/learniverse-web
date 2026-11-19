import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

import { PageIntro } from "@/components/layout/page-intro";
import { EmptyState } from "@/components/states/empty-state";
import { RequireSession } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Học tập" };

// K2 frame: subjects, chapters and lessons are loaded from the API in K4.
export default function LearnPage() {
  return (
    <RequireSession>
      <PageIntro
        eyebrow="Học tập"
        title="Ba hành tinh môn học"
        description="Toán 9 · Tiếng Anh 9 · Ngữ văn 9"
      />
      <EmptyState
        icon={BookOpen}
        title="Chưa có bài học nào"
        description="Nội dung các môn sẽ xuất hiện ở đây ngay khi được nạp vào hệ thống."
      />
    </RequireSession>
  );
}
