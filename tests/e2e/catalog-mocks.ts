import type { Page } from "@playwright/test";

// Fake catalog API for FE-only E2E tests, shaped like learniverse-api's K4 responses.
const SUBJECTS = [
  { code: "math", name: "Toán 9", textbook: "Kết nối tri thức với cuộc sống", lesson_count: 3 },
  { code: "english", name: "Tiếng Anh 9", textbook: "Global Success", lesson_count: 1 },
  { code: "literature", name: "Ngữ văn 9", textbook: "Kết nối tri thức với cuộc sống", lesson_count: 1 },
];

const row = (code: string, kind: string, label: string | null, title: string) => ({
  code,
  kind,
  label,
  title,
  stars: 0,
  completed: false,
});

const MATH_OUTLINE = {
  subject: SUBJECTS[0],
  units: [
    {
      code: "chapter-1",
      title: "Chương I. Phương trình và hệ hai phương trình bậc nhất hai ẩn",
      lessons: [
        row("lesson-1", "lesson", "Bài 1", "Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn"),
        row("chapter-1-practice", "practice", null, "Luyện tập chung"),
      ],
    },
    {
      code: "midterm-1",
      title: "Giữa học kì I",
      lessons: [row("midterm-1-review", "periodic", null, "Ôn tập giữa kì I")],
    },
  ],
};

const MATH_LESSON = {
  subject_code: "math",
  subject_name: "Toán 9",
  unit_title: MATH_OUTLINE.units[0].title,
  code: "lesson-1",
  kind: "lesson",
  label: "Bài 1",
  title: "Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn",
  sections: [
    {
      title: "Phương trình bậc nhất hai ẩn",
      body_md:
        "Phương trình có dạng $ax + by = c$.\n\n$$\n\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}\n$$",
    },
  ],
};

const NOT_FOUND = { error: { code: "subject_not_found", message: "Không tìm thấy môn học này." } };

export async function mockCatalogApi(page: Page): Promise<void> {
  await page.route("**/api/v1/subjects", (route) => route.fulfill({ json: SUBJECTS }));
  await page.route("**/api/v1/subjects/*/outline", (route) =>
    route.request().url().includes("/subjects/math/")
      ? route.fulfill({ json: MATH_OUTLINE })
      : route.fulfill({ status: 404, json: NOT_FOUND }),
  );
  await page.route("**/api/v1/subjects/math/lessons/lesson-1", (route) =>
    route.fulfill({ json: MATH_LESSON }),
  );
  await page.route("**/api/v1/lessons/search?**", (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") ?? "";
    const hits = q.includes("phuong trinh")
      ? [
          {
            subject_code: "math",
            subject_name: "Toán 9",
            code: "lesson-1",
            kind: "lesson",
            label: "Bài 1",
            title: MATH_LESSON.title,
          },
        ]
      : [];
    return route.fulfill({ json: hits });
  });
}
