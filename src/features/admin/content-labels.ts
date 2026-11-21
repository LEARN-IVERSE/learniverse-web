// Vietnamese labels and small helpers shared by the content editor and the review pages (K11b-1).

export const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  published: "Đã xuất bản",
  hidden: "Đã ẩn",
};

export const STATUS_STYLE: Record<string, string> = {
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  hidden: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const KIND_LABEL: Record<string, string> = {
  lesson: "Bài học",
  practice: "Luyện tập",
  periodic: "Định kỳ",
};

export const ACTIVITY_LABEL: Record<string, string> = {
  theory: "Lý thuyết",
  exercise: "Bài tập",
  review: "Ôn tập",
  practice: "Luyện tập",
  periodic: "Định kỳ",
};

export const ACTIVITIES_OF: Record<string, string[]> = {
  lesson: ["theory", "exercise", "review"],
  practice: ["practice"],
  periodic: ["periodic"],
};

export const TYPE_LABEL: Record<string, string> = {
  single_choice: "Trắc nghiệm",
  true_false: "Đúng / Sai",
  fill_blank: "Điền khuyết",
  essay: "Tự luận",
};

export const LEVEL_LABEL: Record<string, string> = {
  recognize: "Nhận biết",
  understand: "Thông hiểu",
  apply: "Vận dụng",
  apply_high: "Vận dụng cao",
};

export const ACTION_LABEL: Record<string, string> = {
  "lesson.create": "Thêm bài",
  "lesson.update": "Sửa bài",
  "lesson.delete": "Xóa bài",
  "question.create": "Thêm câu hỏi",
  "question.update": "Sửa câu hỏi",
  "question.delete": "Xóa câu hỏi",
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
  withdrawn: "Đã rút",
};

export const REQUEST_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-800 ring-rose-200",
  withdrawn: "bg-slate-100 text-slate-600 ring-slate-200",
};

const FALLBACK = "Có lỗi khi lưu. Bạn thử lại nhé.";

/** The Vietnamese message of an API error: our AppError shape, or a FastAPI validation error. */
export function errorText(error: unknown): string {
  const e = error as
    { error?: { message?: unknown }; detail?: { msg?: unknown; loc?: unknown[] }[] } | undefined;
  if (typeof e?.error?.message === "string" && e.error.message) return e.error.message;
  const first = e?.detail?.[0];
  if (typeof first?.msg === "string") {
    const msg = first.msg.replace(/^Value error, /, "");
    // Pydantic's own messages are English; ours (from validators) are already Vietnamese.
    return /[à-ỹ]/i.test(msg) ? msg : "Có ô chưa điền đúng. Hãy kiểm tra lại các ô bắt buộc.";
  }
  return FALLBACK;
}
