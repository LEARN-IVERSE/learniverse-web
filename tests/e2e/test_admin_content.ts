import { expect, type Page, test } from "@playwright/test";

import { ADMIN, type FakeUser, mockAccountApi } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const TEACHER: FakeUser = {
  ...ADMIN,
  id: "00000000-0000-4000-8000-000000000003",
  name: "Cô Tâm",
  role: "teacher",
};
const LESSON_ID = "11111111-1111-4111-8111-111111111111";

const lessonData = {
  code: "lesson-1",
  unit_code: "chapter-1",
  kind: "lesson",
  label: "Bài 1",
  title: "Phương trình bậc nhất hai ẩn",
  status: "published",
  sections: [{ title: "Định nghĩa", body: "Phương trình dạng $ax + by = c$." }],
  teach_reference: null,
  periodic: null,
};

const question = {
  id: "q1",
  code: "e01",
  version: 1,
  data: {
    activity: "exercise",
    type: "true_false",
    prompt: "$x = 1$ là nghiệm của $x + 1 = 2$?",
    options: null,
    answer: true,
    explanation: "Thay vào thấy đúng.",
    section: 1,
    level: "recognize",
  },
};

const pending = {
  id: "r1",
  action: "lesson.update",
  status: "pending",
  subject_code: "math",
  lesson_id: LESSON_ID,
  question_id: null,
  summary: "Bài 1 Phương trình bậc nhất hai ẩn",
  author_name: "Cô Tâm",
  reviewer_name: null,
  review_note: null,
  stale: false,
  before: lessonData,
  after: { ...lessonData, title: "Phương trình bậc nhất hai ẩn (sửa)" },
  created_at: "2026-11-22T08:00:00Z",
  updated_at: "2026-11-22T08:00:00Z",
  reviewed_at: null,
};

/** Fake content API. Returns the bodies the page sent. */
async function mockContentApi(page: Page, who: FakeUser) {
  const sent: { path: string; body: unknown }[] = [];
  if (who.role === "teacher") {
    await page.route("**/api/v1/admin/me", (route) =>
      route.fulfill({
        json: {
          role: "teacher",
          permissions: [{ permission: "content", subject: "math" }],
          sections: ["content", "my_changes"],
        },
      }),
    );
  }
  await page.route("**/api/v1/admin/content/**", (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1/admin", "");
    if (path === "/content/subjects") return route.fulfill({ json: [{ code: "math", name: "Toán 9" }] });
    if (path === "/content/subjects/math")
      return route.fulfill({
        json: {
          code: "math",
          name: "Toán 9",
          units: [
            {
              code: "chapter-1",
              title: "Chương I. Phương trình và hệ hai phương trình",
              lessons: [
                {
                  id: LESSON_ID,
                  code: "lesson-1",
                  kind: "lesson",
                  label: "Bài 1",
                  title: "Phương trình bậc nhất hai ẩn",
                  status: "published",
                  counts: { theory: 5, exercise: 12 },
                  needed: { theory: 5, exercise: 20, review: 20 },
                  pending: 1,
                },
              ],
            },
          ],
        },
      });
    if (path === `/content/lessons/${LESSON_ID}`)
      return route.fulfill({
        json: {
          id: LESSON_ID,
          subject_code: "math",
          code: "lesson-1",
          version: 3,
          data: lessonData,
          questions: [question],
        },
      });
    if (path === "/content/changes") {
      sent.push({ path, body: req.postDataJSON() });
      return route.fulfill({
        json: who.role === "admin" ? { applied: true, request: null } : { applied: false, request: pending },
      });
    }
    return route.fulfill({ status: 404, json: { error: { code: "x", message: "?" } } });
  });
  await page.route("**/api/v1/admin/change-requests**", (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1/admin", "");
    if (req.method() === "GET") {
      const status = new URL(req.url()).searchParams.get("status");
      const items = !status || status === "pending" ? [pending] : [];
      return route.fulfill({ json: { items, total: items.length } });
    }
    sent.push({ path, body: req.postDataJSON() });
    const done = path.endsWith("/approve") ? "approved" : path.endsWith("/reject") ? "rejected" : "withdrawn";
    return route.fulfill({ json: { ...pending, status: done } });
  });
  return sent;
}

test.describe("content management (K11b-1)", () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test("the tree shows status, missing questions and pending requests", async ({ page }) => {
    await mockAccountApi(page, { signedIn: TEACHER });
    await mockContentApi(page, TEACHER);
    await page.goto("/admin/content");
    await expect(page.getByText("Mỗi thay đổi của bạn sẽ được gửi cho quản trị viên duyệt")).toBeVisible();
    const row = page.getByRole("link", { name: /Bài 1: Phương trình bậc nhất hai ẩn/ });
    await expect(row.getByText("Bài tập 12/20 · thiếu 8")).toBeVisible();
    await expect(row.getByText("1 chờ duyệt")).toBeVisible();
    await expect(row.getByText("Đã xuất bản")).toBeVisible();
  });

  test("a teacher's edit is sent for review, with a live theory preview", async ({ page }) => {
    await mockAccountApi(page, { signedIn: TEACHER });
    const sent = await mockContentApi(page, TEACHER);
    await page.goto(`/admin/content/lessons/${LESSON_ID}`);
    await page.getByLabel("Tên bài").fill("Phương trình bậc nhất hai ẩn (sửa)");
    await page.getByLabel("Nội dung mục 1").fill("Mới: $x^2$");
    await expect(page.locator(".katex").first()).toBeVisible(); // the preview renders the math
    await page.getByRole("button", { name: "Gửi duyệt" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Đã gửi yêu cầu. Thay đổi sẽ hiện sau khi quản trị viên duyệt.",
    );
    const body = sent[0].body as { action: string; base_version: number; lesson: { title: string } };
    expect([body.action, body.base_version, body.lesson.title]).toEqual([
      "lesson.update",
      3,
      "Phương trình bậc nhất hai ẩn (sửa)",
    ]);
  });

  test("a teacher proposes a new multiple-choice question", async ({ page }) => {
    await mockAccountApi(page, { signedIn: TEACHER });
    const sent = await mockContentApi(page, TEACHER);
    await page.goto(`/admin/content/lessons/${LESSON_ID}`);
    await page.getByRole("tab", { name: "Câu hỏi (1)" }).click();
    await page.getByRole("button", { name: "Bài tập (1)" }).click();
    await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
    const form = page.getByRole("form", { name: "Soạn câu hỏi" });
    await form.getByLabel("Đề bài").fill("Nghiệm của $x + 1 = 3$ là?");
    await form.getByLabel("Lựa chọn A", { exact: true }).fill("1");
    await form.getByLabel("Lựa chọn B", { exact: true }).fill("2");
    await form.getByLabel("Đáp án đúng là B").check();
    await form.getByLabel("Mức độ").selectOption("apply");
    await form.getByLabel("Giải thích").fill("Chuyển vế.");
    await form.getByRole("button", { name: "Gửi duyệt" }).click();
    await expect(page.getByRole("status")).toContainText("Đã gửi yêu cầu");
    expect(sent[0].body).toMatchObject({
      action: "question.create",
      lesson_id: LESSON_ID,
      question: {
        activity: "exercise",
        type: "single_choice",
        options: ["1", "2"],
        answer: 1,
        level: "apply",
      },
    });
  });

  test("an admin compares old and new, then approves or rejects with a reason", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    const sent = await mockContentApi(page, ADMIN);
    await page.goto("/admin/reviews");
    const list = page.getByRole("list", { name: "Yêu cầu thay đổi" });
    await list.getByRole("button", { name: /Sửa bài/ }).click();
    const row = list.getByRole("row", { name: /Tên bài/ });
    await expect(row.getByRole("cell").nth(1)).toHaveText("Phương trình bậc nhất hai ẩn");
    await expect(row.getByRole("cell").nth(2)).toHaveText("Phương trình bậc nhất hai ẩn (sửa)");
    await expect(list.getByRole("row", { name: /Lý thuyết/ })).toHaveCount(0); // unchanged rows hidden

    await expect(list.getByRole("button", { name: "Từ chối" })).toBeDisabled(); // a reason is required
    await list.getByLabel("Lý do từ chối").fill("Tiêu đề chưa đúng SGK");
    await list.getByRole("button", { name: "Từ chối" }).click();
    await expect(page.getByRole("status")).toHaveText("Đã từ chối và gửi lý do cho giáo viên.");
    expect(sent.at(-1)).toEqual({
      path: "/change-requests/r1/reject",
      body: { note: "Tiêu đề chưa đúng SGK" },
    });

    await list.getByRole("button", { name: /Sửa bài/ }).click();
    await list.getByRole("button", { name: "Duyệt", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Đã duyệt. Thay đổi đã hiện với học sinh.");
  });

  test("an admin's edit applies at once", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    await mockContentApi(page, ADMIN);
    await page.goto(`/admin/content/lessons/${LESSON_ID}`);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Đã lưu. Học sinh thấy ngay thay đổi.");
  });
});
