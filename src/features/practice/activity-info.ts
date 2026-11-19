import type { Activity } from "@/lib/api-client";

/** Name and star rule of each activity, as shown to learners. */
export const ACTIVITY_INFO: Record<Activity, { name: string; rule: string }> = {
  theory: { name: "Kiểm tra Lý thuyết", rule: "Đúng cả 5/5 câu để nhận sao." },
  exercise: { name: "Bài tập", rule: "Đúng từ 15/20 câu để nhận sao." },
  review: { name: "Ôn tập", rule: "Đúng từ 15/20 câu để nhận sao." },
  practice: { name: "Luyện tập", rule: "Đúng từ 8/10 câu để nhận sao." },
  ai_teaching: { name: "Dạy AI", rule: "Mở ở K10." },
  periodic: {
    name: "Ôn tập / Kiểm tra định kỳ",
    rule: "Làm trong thời gian quy định; đạt thì mục được Hoàn thành.",
  },
};

/** Error code from an API error body: `{ "error": { "code": ... } }`. */
export function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("error" in error)) return undefined;
  const inner = (error as { error: unknown }).error;
  if (typeof inner !== "object" || inner === null || !("code" in inner)) return undefined;
  const code = (inner as { code: unknown }).code;
  return typeof code === "string" ? code : undefined;
}
