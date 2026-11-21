"use client";

import Link from "next/link";

import { useSession } from "@/features/auth/session";
import { ReportsPage } from "@/features/community/reports-page";

import { AdminShell, adminItems } from "./admin-shell";
import { AuditAdmin } from "./audit-admin";
import { MyChanges, ReviewQueue } from "./change-requests";
import { ContentAdmin } from "./content-admin";
import { EssayQueue } from "./essay-queue";
import { ImportWizard } from "./import-wizard";
import { LessonEditor, NewLesson } from "./lesson-editor";
import { UsersAdmin } from "./users-admin";

/** /admin: entry cards for the sections this account may open. */
export function AdminHome() {
  return (
    <AdminShell active="home" title="Trang quản trị" description="Chọn mục bạn muốn quản lý.">
      {(me) => (
        <ul className="grid gap-3 sm:grid-cols-2">
          {adminItems(me).map(({ key, label, icon: Icon, href }) => (
            <li key={key}>
              {href ? (
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-[1.5rem] bg-white p-5 ring-1 ring-blue-100 transition hover:shadow-lg"
                >
                  <span
                    aria-hidden
                    className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="font-heading text-lg font-bold">{label}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-[1.5rem] bg-white/60 p-5 text-slate-400 ring-1 ring-slate-100">
                  <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-slate-50">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-heading text-lg font-bold">{label}</span>
                  <span className="ml-auto text-xs">Sắp có</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

export function AdminUsers() {
  const state = useSession()?.state;
  const myId = state?.status === "signed-in" ? state.user.id : "";
  return (
    <AdminShell active="users" title="Tài khoản" description="Tìm, khóa/mở khóa và phân quyền tài khoản.">
      {() => <UsersAdmin myId={myId} />}
    </AdminShell>
  );
}

export function AdminAudit() {
  return (
    <AdminShell active="audit" title="Nhật ký quản trị" description="Mọi thay đổi trong trang quản trị.">
      {() => <AuditAdmin />}
    </AdminShell>
  );
}

export function AdminReports() {
  return (
    <AdminShell
      active="reports"
      title="Báo cáo vi phạm"
      description="Xem nội dung bị báo cáo, rồi giữ, ẩn hoặc xóa. Báo cáo không tự xóa nội dung."
    >
      {() => <ReportsPage />}
    </AdminShell>
  );
}

export function AdminContent() {
  return (
    <AdminShell
      active="content"
      title="Nội dung"
      description="Bài học, Lý thuyết và ngân hàng câu hỏi của phần Học tập."
    >
      {(me) => <ContentAdmin isAdmin={me.role === "admin"} />}
    </AdminShell>
  );
}

export function AdminLesson({ lessonId }: { lessonId: string }) {
  return (
    <AdminShell active="content" title="Sửa bài">
      {(me) => <LessonEditor lessonId={lessonId} isAdmin={me.role === "admin"} />}
    </AdminShell>
  );
}

export function AdminNewLesson({ subject, unit }: { subject: string; unit: string }) {
  return (
    <AdminShell active="content" title="Thêm bài">
      {(me) => <NewLesson subject={subject} unit={unit} isAdmin={me.role === "admin"} />}
    </AdminShell>
  );
}

export function AdminImport({ subject }: { subject: string }) {
  return (
    <AdminShell
      active="content"
      title="Nạp câu hỏi hàng loạt"
      description="Tải file hoặc dán bảng, kiểm tra từng dòng và xem trước. Chưa lưu gì cho tới khi bạn bấm Gửi."
    >
      {(me) => <ImportWizard subject={subject} isAdmin={me.role === "admin"} />}
    </AdminShell>
  );
}

export function AdminReviews() {
  return (
    <AdminShell
      active="reviews"
      title="Chờ duyệt"
      description="Thay đổi nội dung do giáo viên gửi. Chỉ sau khi duyệt, học sinh mới thấy."
    >
      {() => <ReviewQueue />}
    </AdminShell>
  );
}

export function AdminMyChanges() {
  return (
    <AdminShell
      active="my_changes"
      title="Yêu cầu của tôi"
      description="Các thay đổi bạn đã gửi và kết quả duyệt."
    >
      {() => <MyChanges />}
    </AdminShell>
  );
}

export function AdminEssays() {
  return (
    <AdminShell
      active="essays"
      title="Chấm tự luận"
      description="Bài tự luận của học sinh trong các môn bạn được chấm. Chấm Đạt hoặc Chưa đạt, kèm nhận xét."
    >
      {() => <EssayQueue />}
    </AdminShell>
  );
}
