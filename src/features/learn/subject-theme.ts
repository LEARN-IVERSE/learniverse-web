import { BookOpenText, Languages, type LucideIcon, Sigma } from "lucide-react";

import type { SubjectId } from "@/components/art/subject-art";

type SubjectTheme = {
  icon: LucideIcon;
  glyph: string; // one-letter mark on the planet in the hero art
  tagline: string;
  color: string; // hex used by the SVG art, progress rings and the lesson path
  soft: string; // light background for chips and rows
  text: string; // ink on light backgrounds
};

// Static class names per subject (Tailwind only keeps classes it can see in the source).
const THEMES: Record<string, SubjectTheme> = {
  math: {
    icon: Sigma,
    glyph: "π",
    tagline: "Hành tinh của những con số và hình khối",
    color: "#2563eb",
    soft: "bg-blue-50",
    text: "text-blue-700",
  },
  english: {
    icon: Languages,
    glyph: "Aa",
    tagline: "Vòng quanh thế giới qua từng Unit",
    color: "#059669",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
  },
  literature: {
    icon: BookOpenText,
    glyph: "Ă",
    tagline: "Trang giấy điệp, nét mực và những áng văn",
    color: "#c0392b",
    soft: "bg-[#fbf6ea]",
    text: "text-[#a8322a]",
  },
};

const FALLBACK: SubjectTheme = {
  icon: BookOpenText,
  glyph: "★",
  tagline: "Một hành tinh tri thức",
  color: "#64748b",
  soft: "bg-slate-50",
  text: "text-slate-700",
};

export function subjectTheme(code: string): SubjectTheme {
  return THEMES[code] ?? FALLBACK;
}

/** The artwork family of a subject code; unknown subjects reuse the math art. */
export function artId(code: string): SubjectId {
  return code === "english" || code === "literature" ? code : "math";
}
