// Demo data for sample D only: placeholder lesson titles and fictional students.
import type { SubjectId } from "../mock-data";
import type { ScoreRow } from "./ranking";

export type World = {
  id: SubjectId;
  name: string;
  tagline: string;
  glyph: string;
  lessonsDone: number;
  lessonsTotal: number;
  stars: number;
  starsTotal: number;
  /** Hex color used by SVG art, progress rings and the lesson path. */
  color: string;
  /** Tailwind classes for text on light backgrounds and for soft fills. */
  ink: string;
  soft: string;
};

export const WORLDS: World[] = [
  {
    id: "math",
    name: "Toán 9",
    tagline: "Hành tinh của những con số và hình khối",
    glyph: "π",
    lessonsDone: 9,
    lessonsTotal: 22,
    stars: 41,
    starsTotal: 88,
    color: "#2563eb",
    ink: "text-blue-700",
    soft: "bg-blue-50",
  },
  {
    id: "english",
    name: "Tiếng Anh 9",
    tagline: "Vòng quanh thế giới qua từng Unit",
    glyph: "Aa",
    lessonsDone: 3,
    lessonsTotal: 12,
    stars: 15,
    starsTotal: 48,
    color: "#059669",
    ink: "text-emerald-700",
    soft: "bg-emerald-50",
  },
  {
    id: "literature",
    name: "Ngữ văn 9",
    tagline: "Trang giấy điệp, nét mực và những áng văn",
    glyph: "Ă",
    lessonsDone: 1,
    lessonsTotal: 10,
    stars: 6,
    starsTotal: 40,
    color: "#c0392b",
    ink: "text-[#a8322a]",
    soft: "bg-[#fbf6ea]",
  },
];

export type PathItem =
  | { kind: "lesson"; id: string; no: number; title: string; stars: 0 | 1 | 2 | 3 | 4 }
  | { kind: "milestone"; id: string; title: string; note: string };

export type PathChapter = { id: string; title: string; items: PathItem[] };

export const PATH: PathChapter[] = [
  {
    id: "c1",
    title: "Chương I (minh họa)",
    items: [
      { kind: "lesson", id: "l1", no: 1, title: "Tên bài học minh họa số 1", stars: 4 },
      { kind: "lesson", id: "l2", no: 2, title: "Tên bài học minh họa số 2", stars: 3 },
      { kind: "lesson", id: "l3", no: 3, title: "Tên bài học minh họa số 3", stars: 1 },
    ],
  },
  {
    id: "c2",
    title: "Chương II (minh họa)",
    items: [
      { kind: "lesson", id: "l4", no: 4, title: "Tên bài học minh họa số 4", stars: 0 },
      { kind: "milestone", id: "m1", title: "Ôn tập giữa kỳ I", note: "20 câu · 45 phút" },
      { kind: "lesson", id: "l5", no: 5, title: "Tên bài học minh họa số 5", stars: 0 },
    ],
  },
];

export const WEEK = [
  { day: "T2", done: true },
  { day: "T3", done: true },
  { day: "T4", done: true },
  { day: "T5", done: true },
  { day: "T6", done: true },
  { day: "T7", done: true },
  { day: "CN", done: false, today: true },
];

export const ME = { id: "u-minhanh", name: "Minh Anh", streakDays: 6, goalDone: 2, goalTotal: 3 };

export const CONTINUE = {
  world: "math" as SubjectId,
  lesson: "Bài 3: Tên bài học minh họa số 3",
  activity: "Bài tập",
  stars: 1,
};

export type Box = {
  id: SubjectId;
  name: string;
  glyph: string;
  color: string;
  posts: number;
  waiting: number;
};

export const BOXES: Box[] = [
  { id: "math", name: "BOX TOÁN 9", glyph: "Σ", color: "#2563eb", posts: 128, waiting: 12 },
  { id: "english", name: "BOX TIẾNG ANH 9", glyph: "Aa", color: "#059669", posts: 96, waiting: 5 },
  { id: "literature", name: "BOX NGỮ VĂN 9", glyph: "Ă", color: "#c0392b", posts: 74, waiting: 9 },
];

export type FeedPost = {
  id: string;
  author: string;
  online: boolean;
  box: SubjectId;
  time: string;
  title: string;
  body: string;
  commenters: string[];
  comments: number;
  hasImage?: boolean;
};

export const FEED: FeedPost[] = [
  {
    id: "p1",
    author: "Khánh Linh",
    online: true,
    box: "math",
    time: "5 phút trước",
    title: "Em chưa hiểu cách giải phương trình bậc hai này",
    body: "Em tính Δ ra 1 rồi nhưng không biết suy ra nghiệm thế nào. Mọi người chỉ em với ạ!",
    commenters: ["Quốc Bảo", "Thu Hà", "Gia Huy"],
    comments: 4,
    hasImage: true,
  },
  {
    id: "p2",
    author: "Quốc Bảo",
    online: false,
    box: "english",
    time: "1 giờ trước",
    title: "Mẹo phân biệt thì hiện tại hoàn thành và quá khứ đơn",
    body: "Mình tổng hợp 3 dấu hiệu nhận biết hay gặp trong đề, mọi người xem và góp ý thêm nhé.",
    commenters: ["Ngọc Lan", "Đức Minh", "Bảo Châu", "Tuấn Kiệt"],
    comments: 12,
  },
  {
    id: "p3",
    author: "Thu Hà",
    online: true,
    box: "literature",
    time: "Hôm qua",
    title: "Cách mở bài cho đoạn văn nghị luận xã hội",
    body: "Chia sẻ ba cách mở bài mình hay dùng: đi từ câu hỏi, từ một câu nói nổi tiếng và từ trải nghiệm.",
    commenters: [],
    comments: 0,
  },
];

export const CONTRIBUTORS: ScoreRow[] = [
  { id: "u-quocbao", name: "Quốc Bảo", value: 185 },
  { id: "u-thuha", name: "Thu Hà", value: 150 },
  { id: "u-giahuy", name: "Gia Huy", value: 150 },
  { id: "u-ngoclan", name: "Ngọc Lan", value: 140 },
  { id: "u-ducminh", name: "Đức Minh", value: 120 },
  { id: "u-khanhlinh", name: "Khánh Linh", value: 110 },
  { id: "u-baochau", name: "Bảo Châu", value: 95 },
  { id: "u-tuankiet", name: "Tuấn Kiệt", value: 90 },
  { id: "u-phuonganh", name: "Phương Anh", value: 85 },
  { id: "u-hoangnam", name: "Hoàng Nam", value: 80 },
];

/** Where the current user stands on the contribution board (outside the TOP 10 in this demo). */
export const MY_CONTRIBUTION = { rank: 12, value: 60, next: { name: "Hải Đăng", rank: 11, value: 75 } };

/** Study time in minutes. */
export const STUDY_TIME: ScoreRow[] = [
  { id: "u-ngoclan", name: "Ngọc Lan", value: 1930 },
  { id: "u-minhanh", name: "Minh Anh", value: 1725 },
  { id: "u-giahuy", name: "Gia Huy", value: 1265 },
  { id: "u-quocbao", name: "Quốc Bảo", value: 1170 },
  { id: "u-thuha", name: "Thu Hà", value: 735 },
  { id: "u-khanhlinh", name: "Khánh Linh", value: 710 },
  { id: "u-ducminh", name: "Đức Minh", value: 620 },
  { id: "u-baochau", name: "Bảo Châu", value: 545 },
  { id: "u-tuankiet", name: "Tuấn Kiệt", value: 520 },
  { id: "u-phuonganh", name: "Phương Anh", value: 475 },
];
