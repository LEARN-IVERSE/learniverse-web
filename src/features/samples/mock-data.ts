// Demo data for the K2 UI samples only. Lesson titles are placeholders, not the official textbook list.

export type SubjectId = "math" | "english" | "literature";

export type Subject = {
  id: SubjectId;
  name: string;
  description: string;
  color: string; // Tailwind color family used for the subject identity
  emoji: string;
  progress: number; // 0-100
};

export type Lesson = { id: string; title: string; stars: 0 | 1 | 2 | 3 | 4 };
export type Chapter = { id: string; title: string; lessons: Lesson[] };

export const SUBJECTS: Subject[] = [
  {
    id: "math",
    name: "Toán 9",
    description: "Đại số, hình học và thống kê theo chương trình lớp 9.",
    color: "blue",
    emoji: "📐",
    progress: 42,
  },
  {
    id: "english",
    name: "Tiếng Anh 9",
    description: "Từ vựng, ngữ pháp và kỹ năng theo từng Unit.",
    color: "emerald",
    emoji: "🌏",
    progress: 25,
  },
  {
    id: "literature",
    name: "Ngữ văn 9",
    description: "Đọc hiểu, viết và nói nghe theo từng bài học.",
    color: "amber",
    emoji: "📖",
    progress: 10,
  },
];

export const CHAPTERS: Chapter[] = [
  {
    id: "c1",
    title: "Chương I (minh họa)",
    lessons: [
      { id: "l1", title: "Bài 1: Tên bài học minh họa số 1", stars: 4 },
      { id: "l2", title: "Bài 2: Tên bài học minh họa số 2", stars: 3 },
      { id: "l3", title: "Bài 3: Tên bài học minh họa số 3", stars: 1 },
    ],
  },
  {
    id: "c2",
    title: "Chương II (minh họa)",
    lessons: [
      { id: "l4", title: "Bài 4: Tên bài học minh họa số 4", stars: 0 },
      { id: "l5", title: "Ôn tập giữa kỳ I", stars: 0 },
    ],
  },
];

export type Post = {
  id: string;
  author: string;
  box: string;
  time: string;
  title: string;
  body: string;
  comments: number;
};

export const POSTS: Post[] = [
  {
    id: "p1",
    author: "Minh Anh",
    box: "BOX TOÁN 9",
    time: "5 phút trước",
    title: "Em chưa hiểu cách giải phương trình bậc hai",
    body: "Em đã thử áp dụng công thức nghiệm nhưng vẫn ra sai. Mong các bạn hướng dẫn giúp em.",
    comments: 4,
  },
  {
    id: "p2",
    author: "Quốc Bảo",
    box: "BOX TIẾNG ANH 9",
    time: "1 giờ trước",
    title: "Phân biệt thì hiện tại hoàn thành và quá khứ đơn",
    body: "Mình tổng hợp vài mẹo nhỏ để không nhầm hai thì này, mọi người xem và góp ý nhé.",
    comments: 12,
  },
  {
    id: "p3",
    author: "Thu Hà",
    box: "BOX NGỮ VĂN 9",
    time: "Hôm qua",
    title: "Cách mở bài cho đoạn văn nghị luận",
    body: "Chia sẻ ba cách mở bài mình hay dùng khi viết đoạn văn nghị luận xã hội.",
    comments: 0,
  },
];

export type Ranked = { name: string; value: string };

export const TOP_CONTRIBUTORS: Ranked[] = [
  { name: "Quốc Bảo", value: "185 điểm" },
  { name: "Thu Hà", value: "150 điểm" },
  { name: "Minh Anh", value: "150 điểm" },
  { name: "Gia Huy", value: "95 điểm" },
  { name: "Ngọc Lan", value: "60 điểm" },
];

export const TOP_STUDY_TIME: Ranked[] = [
  { name: "Ngọc Lan", value: "32 giờ 10 phút" },
  { name: "Minh Anh", value: "28 giờ 45 phút" },
  { name: "Gia Huy", value: "21 giờ 05 phút" },
  { name: "Quốc Bảo", value: "19 giờ 30 phút" },
  { name: "Thu Hà", value: "12 giờ 15 phút" },
];

export const CURRENT_USER = { name: "Minh Anh", streakDays: 6 };
