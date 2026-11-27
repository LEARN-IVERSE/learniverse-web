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

const bulkPending = {
  ...pending,
  id: "r2",
  action: "question.bulk_create",
  lesson_id: null,
  summary: "Nạp 2 câu hỏi vào 1 bài",
  before: null,
  after: {
    items: [
      { lesson_code: "lesson-1", question: question.data },
      { lesson_code: "lesson-1", question: { ...question.data, prompt: "Câu nạp thứ hai" } },
    ],
  },
};

/** What the fake checker says about a pasted row, keyed by a word in its prompt. */
function checkRow(row: Record<string, string>) {
  const q = { ...question.data, prompt: row.prompt };
  if (row.prompt.includes("lỗi"))
    return {
      status: "error",
      messages: ["Đáp án phải là một chữ cái"],
      lesson_code: row.lesson,
      lesson_id: null,
      lesson_title: null,
      question: null,
    };
  const status = row.prompt.includes("trùng") ? "duplicate" : "ok";
  return {
    status,
    messages: status === "duplicate" ? ["Đề bài này đã có trong bài"] : [],
    lesson_code: row.lesson,
    lesson_id: LESSON_ID,
    lesson_title: "Bài 1 Phương trình bậc nhất hai ẩn",
    question: q,
  };
}

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
    if (path === "/content/import/read") {
      const text = (req.postDataJSON() as { text: string }).text;
      const rows = text
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => {
          const [lesson, activity, type, prompt, answer] = line.split("\t");
          return { lesson, activity, type, prompt, answer };
        });
      return route.fulfill({ json: { rows } });
    }
    if (path === "/content/import/check") {
      const body = req.postDataJSON() as { rows: Record<string, string>[] };
      sent.push({ path, body });
      return route.fulfill({ json: { rows: body.rows.map(checkRow) } });
    }
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
                  version: 3,
                  counts: { theory: 5, exercise: 12 },
                  needed: { theory: 5, exercise: 20, review: 20 },
                  pending: 1,
                },
              ],
            },
            { code: "chapter-2", title: "Chương II. Phương trình và bất phương trình bậc nhất", lessons: [] },
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
      const items = !status || status === "pending" ? [pending, bulkPending] : [];
      return route.fulfill({ json: { items, total: items.length } });
    }
    sent.push({ path, body: req.postDataJSON() });
    if (req.method() === "PUT") return route.fulfill({ json: pending });
    const done = path.endsWith("/approve") ? "approved" : path.endsWith("/reject") ? "rejected" : "withdrawn";
    return route.fulfill({ json: { ...pending, status: done } });
  });
  return sent;
}

test.describe("content management (K11b)", () => {
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

  test("a teacher imports pasted rows: check, fix, preview, then one request", async ({ page }) => {
    await mockAccountApi(page, { signedIn: TEACHER });
    const sent = await mockContentApi(page, TEACHER);
    await page.goto("/admin/content");
    await page.getByRole("link", { name: "Nạp câu hỏi hàng loạt" }).click();
    await expect(page).toHaveURL(/\/admin\/content\/import\?subject=math/);
    const header = "Mã bài\tHoạt động\tLoại câu\tĐề bài\tĐáp án";
    const lines = [
      "lesson-1\tBài tập\tĐúng sai\tCâu tốt\tĐúng",
      "lesson-1\tBài tập\tĐúng sai\tCâu trùng\tĐúng",
      "lesson-1\tBài tập\tMột đáp án\tCâu lỗi\tE",
    ];
    await page.getByLabel("Bảng dán vào").fill([header, ...lines].join("\n"));
    await page.getByRole("button", { name: "Đọc bảng" }).click();
    await expect(page.getByText("1 hợp lệ")).toBeVisible();
    await expect(page.getByText("1 trùng")).toBeVisible();
    await expect(page.getByText("1 lỗi")).toBeVisible();
    await expect(page.getByText("Đáp án phải là một chữ cái")).toBeVisible();

    // fixing a cell asks for a new check before going on
    await page.getByLabel("Dòng 4 Đề bài").fill("Câu đã sửa");
    await expect(page.getByRole("button", { name: /Tiếp: Xem trước/ })).toBeDisabled();
    await page.getByRole("button", { name: "Kiểm tra lại" }).click();
    await expect(page.getByText("2 hợp lệ")).toBeVisible();
    expect((sent.at(-1)?.body as { rows: { prompt: string }[] }).rows[2].prompt).toBe("Câu đã sửa");

    await page.getByLabel("Vẫn thêm dòng 3").check();
    await page.getByRole("button", { name: "Tiếp: Xem trước (3 câu)" }).click();
    await expect(page.getByText("Cả đợt sẽ thành một yêu cầu")).toBeVisible();
    await expect(page.getByRole("list", { name: "Xem trước câu hỏi" }).getByRole("listitem")).toHaveCount(3);
    await page.getByRole("button", { name: "Gửi duyệt 3 câu" }).click();
    await expect(page.getByRole("status")).toContainText("Đã gửi yêu cầu");
    const body = sent.at(-1)?.body as { action: string; subject: string; bulk: { items: unknown[] } };
    expect([body.action, body.subject, body.bulk.items.length]).toEqual(["question.bulk_create", "math", 3]);
  });

  test("an admin moves a lesson to another chapter", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    const sent = await mockContentApi(page, ADMIN);
    await page.goto("/admin/content");
    await expect(page.getByRole("button", { name: /Đưa Bài 1: .* lên/ })).toBeDisabled();
    await page.getByLabel(/Chuyển Bài 1: .* sang nhóm/).selectOption("chapter-2");
    await expect(page.getByRole("status")).toHaveText("Đã chuyển bài.");
    expect(sent.at(-1)?.body).toMatchObject({
      action: "lesson.move",
      lesson_id: LESSON_ID,
      base_version: 3,
      move: { unit_code: "chapter-2" },
    });
  });

  test("the review queue lists every question of an import", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    await mockContentApi(page, ADMIN);
    await page.goto("/admin/reviews");
    await page.getByRole("button", { name: /Nạp hàng loạt/ }).click();
    const items = page.getByRole("list", { name: "Câu hỏi trong đợt nạp" }).getByRole("listitem");
    await expect(items).toHaveCount(2);
    await expect(items.nth(1)).toContainText("Câu nạp thứ hai");
  });

  test("a teacher edits a pending request", async ({ page }) => {
    await mockAccountApi(page, { signedIn: TEACHER });
    const sent = await mockContentApi(page, TEACHER);
    await page.goto("/admin/my-changes");
    await page.getByRole("button", { name: /Sửa bài/ }).click();
    await page.getByRole("button", { name: "Sửa yêu cầu" }).click();
    await page.getByLabel("Tên bài").fill("Tên mới hơn");
    await page.getByRole("button", { name: "Gửi duyệt" }).click();
    await expect(page.getByRole("status")).toHaveText("Đã cập nhật yêu cầu. Quản trị viên sẽ thấy bản mới.");
    expect(sent.at(-1)).toMatchObject({
      path: "/change-requests/r1",
      body: { action: "lesson.update", lesson: { title: "Tên mới hơn" } },
    });
  });
});
