import { expect, type Page, test } from "@playwright/test";

import { ADMIN, type FakeUser, mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const TEACHER: FakeUser = {
  ...ADMIN,
  id: "00000000-0000-4000-8000-000000000003",
  name: "Cô Tâm",
  role: "teacher",
};

const answer = (over: Record<string, unknown>) => ({
  id: "a1",
  body_md: "Bài làm cũ",
  status: "failed",
  comment: "Thiếu bước chuyển vế.",
  grader_name: "Cô Tâm",
  submitted_at: "2026-11-22T08:00:00Z",
  graded_at: "2026-11-22T09:00:00Z",
  ...over,
});

/** Fake essay API for the learner: the list, and a submit that turns the question into "waiting". */
async function mockLearnerEssays(page: Page, answers = [answer({})]) {
  const sent: unknown[] = [];
  let list = answers;
  await page.route("**/api/v1/subjects/math/lessons/lesson-1/essays", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: "q1",
            prompt_md: "Trình bày cách giải $x + 1 = 3$.",
            can_submit: !list.some((a) => a.status === "pending" || a.status === "passed"),
            answers: list,
          },
        ],
      },
    }),
  );
  await page.route("**/api/v1/subjects/math/lessons/lesson-1/essays/q1", (route) => {
    const body = route.request().postDataJSON() as { body: string };
    sent.push(body);
    if (body.body.includes("trùng"))
      return route.fulfill({
        status: 409,
        json: { error: { code: "essay_pending", message: "Bài làm trước của bạn đang chờ chấm." } },
      });
    const fresh = answer({
      id: "a2",
      body_md: body.body,
      status: "pending",
      comment: null,
      grader_name: null,
    });
    list = [fresh, ...list];
    return route.fulfill({ json: fresh });
  });
  return sent;
}

const queueItem = {
  id: "e1",
  status: "pending",
  subject_code: "math",
  subject_name: "Toán 9",
  lesson_label: "Bài 1",
  lesson_title: "Phương trình bậc nhất hai ẩn",
  prompt_md: "Trình bày cách giải $x + 1 = 3$.",
  body_md: "Chuyển vế: $x = 2$.",
  student_name: "Nguyễn An",
  submitted_at: "2026-11-22T08:00:00Z",
  comment: null,
  grader_name: null,
  graded_at: null,
};

test.describe("essays (K11c-1)", () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test("a learner writes with a preview, submits, and sees the earlier verdict", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    const sent = await mockLearnerEssays(page);
    await page.goto("/courses/math/lesson-1");
    await page.getByRole("link", { name: "Tự luận (1)" }).click();
    await expect(page).toHaveURL(/\/courses\/math\/lesson-1\/essays/);
    await expect(page.getByText("Bài này không tính sao")).toBeVisible();
    const old = page.getByRole("list", { name: "Các lần nộp câu 1" });
    await expect(old.getByText("Chưa đạt")).toBeVisible();
    await expect(old.getByText("Cô Tâm nhận xét: Thiếu bước chuyển vế.")).toBeVisible();

    const form = page.getByRole("form", { name: "Bài làm câu 1" });
    await expect(form.getByRole("button", { name: "Nộp bài" })).toBeDisabled();
    await form.getByLabel(/Bài làm của bạn/).fill("Chuyển vế: $x = 3 - 1 = 2$.");
    await expect(form.locator(".katex").first()).toBeVisible(); // live preview
    await form.getByRole("button", { name: "Nộp bài" }).click();
    await expect(page.getByRole("status")).toContainText("Đã nộp bài câu 1");
    expect(sent).toEqual([{ body: "Chuyển vế: $x = 3 - 1 = 2$." }]);
    // now waiting: the form is gone, the new answer is first in the list
    await expect(page.getByRole("form", { name: "Bài làm câu 1" })).toHaveCount(0);
    await expect(page.getByText("đang chờ giáo viên chấm")).toBeVisible();
    await expect(old.getByRole("listitem").first()).toContainText("Chờ chấm");
  });

  test("a refused submit shows the server's message", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockLearnerEssays(page);
    await page.goto("/courses/math/lesson-1/essays");
    await page.getByLabel(/Bài làm của bạn/).fill("bài trùng");
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await expect(page.getByRole("form", { name: "Bài làm câu 1" }).getByRole("alert")).toHaveText(
      "Bài làm trước của bạn đang chờ chấm.",
    );
  });

  test("a teacher grades: Chưa đạt needs a remark, Đạt does not", async ({ page }) => {
    await mockAccountApi(page, { signedIn: TEACHER });
    await page.route("**/api/v1/admin/me", (route) =>
      route.fulfill({
        json: {
          role: "teacher",
          permissions: [{ permission: "essay_review", subject: "math" }],
          sections: ["essays"],
        },
      }),
    );
    const sent: { path: string; body: unknown }[] = [];
    let pending = [queueItem, { ...queueItem, id: "e2", student_name: "Trần Bình" }];
    await page.route("**/api/v1/admin/essays**", (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname.replace("/api/v1/admin", "");
      if (req.method() === "GET") {
        const status = new URL(req.url()).searchParams.get("status") ?? "pending";
        return route.fulfill({
          json: { items: status === "pending" ? pending : [], subjects: [["math", "Toán 9"]] },
        });
      }
      sent.push({ path, body: req.postDataJSON() });
      pending = pending.filter((e) => !path.includes(e.id));
      return route.fulfill({ json: { ...queueItem, status: "passed" } });
    });
    await page.goto("/admin/essays");
    const list = page.getByRole("list", { name: "Bài tự luận" });
    await expect(list.getByRole("listitem")).toHaveCount(2);
    const first = list.getByRole("listitem").first();
    await expect(first.getByText("Nguyễn An")).toBeVisible();
    await expect(first.locator(".katex").first()).toBeVisible();

    await expect(first.getByRole("button", { name: "Chưa đạt" })).toBeDisabled(); // a remark is required
    await first.getByLabel(/Nhận xét/).fill("Thiếu bước chuyển vế");
    await first.getByRole("button", { name: "Chưa đạt" }).click();
    await expect(page.getByRole("status")).toHaveText("Đã chấm Chưa đạt và gửi nhận xét.");
    expect(sent[0]).toEqual({
      path: "/essays/e1/grade",
      body: { passed: false, comment: "Thiếu bước chuyển vế" },
    });

    await list.getByRole("button", { name: "Đạt", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Đã chấm Đạt và báo cho học sinh.");
    expect(sent[1].path).toBe("/essays/e2/grade");
  });

  test("a grading notification links to the essay page", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.route("**/api/v1/notifications", (route) =>
      route.fulfill({
        json: {
          unread: 1,
          items: [
            {
              id: "n1",
              kind: "essay_graded",
              actor: { id: "t", name: "Cô Tâm", avatar_url: null },
              post_id: null,
              post_title: null,
              comment_id: null,
              essay: {
                status: "passed",
                lesson_title: "Phương trình bậc nhất",
                subject_code: "math",
                lesson_code: "lesson-1",
              },
              created_at: "2026-11-22T09:00:00Z",
              read: false,
            },
          ],
        },
      }),
    );
    await page.goto("/courses");
    await page.getByRole("button", { name: /Thông báo/ }).click();
    const link = page.getByRole("link", { name: /đã chấm bài tự luận của bạn: Đạt/ });
    await expect(link).toHaveAttribute("href", "/courses/math/lesson-1/essays");
  });
});
