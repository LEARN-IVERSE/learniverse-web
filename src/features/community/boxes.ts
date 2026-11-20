import { subjectTheme } from "../learn/subject-theme";

export type BoxCode = "math" | "english" | "literature";

export const BOXES: { code: BoxCode; name: string; glyph: string; color: string }[] = [
  { code: "math", name: "Box Toán 9", glyph: subjectTheme("math").glyph, color: subjectTheme("math").color },
  {
    code: "english",
    name: "Box Tiếng Anh 9",
    glyph: subjectTheme("english").glyph,
    color: subjectTheme("english").color,
  },
  {
    code: "literature",
    name: "Box Ngữ văn 9",
    glyph: subjectTheme("literature").glyph,
    color: subjectTheme("literature").color,
  },
];

export function boxOf(code: string) {
  return BOXES.find((b) => b.code === code) ?? BOXES[0];
}
