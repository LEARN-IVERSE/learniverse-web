import { expect, type Page, type Route, test } from "@playwright/test";

import { mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

// Fake K10 API: a session that the test drives turn by turn.
type Grade = { score: number; feedback: string; strengths: string[]; improvements: string[] };

async function mockTeachApi(
  page: Page,
  opts: { grades?: (Grade | "fail")[]; sessionsLeft?: number; failStart?: boolean } = {},
) {
  const grades = opts.grades ?? [
    { score: 8, feedback: "Em giảng rõ ràng.", strengths: ["Định nghĩa đúng"], improvements: ["Thêm ví dụ"] },
  ];
  const s = {
    session: null as null | Record<string, unknown>,
    turns: [] as { n: number; question: string; answer: string | null }[],
    status: "in_progress",
    result: null as null | Record<string, unknown>,
    left: opts.sessionsLeft ?? 3,
    grades: 0,
    answers: [] as string[],
  };
  const out = () => ({
    id: "s1",
    subject_code: "math",
    lesson_code: "lesson-1",
    lesson_title: "Bài học",
    status: s.status,
    turns: s.turns,
    answered: s.turns.filter((t) => t.answer !== null).length,
    total_turns: 5,
    result: s.result,
  });
  const grade = () => {
    const g = grades[Math.min(s.grades++, grades.length - 1)];
    if (g === "fail") s.status = "grading_failed";
    else {
      s.status = "completed";
      s.result = { ...g, passed: g.score >= 7, star_earned: g.score >= 7 };
    }
  };
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });

  await page.route("**/api/v1/subjects/math/lessons/lesson-1/ai-teaching", (route) =>
    json(route, {
      session: s.session ? out() : null,
      earned: false,
      sessions_left: s.left,
      daily_sessions: 3,
    }),
  );
  await page.route("**/api/v1/ai-teaching/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1/ai-teaching", "");
    if (path === "/sessions") {
      if (opts.failStart)
        return json(
          route,
          {
            error: {
              code: "teach_quota_exceeded",
              message: "Hôm nay bạn đã dùng hết 3 lượt Dạy AI. Mai quay lại nhé!",
            },
          },
          429,
        );
      s.session = {};
      s.left -= 1;
      return json(route, out(), 201);
    }
    if (path === "/sessions/s1") return json(route, out());
    if (path === "/sessions/s1/question") {
      const n = s.turns.length + 1;
      s.turns.push({ n, question: `Câu hỏi số ${n} của em ạ?`, answer: null });
      const body =
        `event: delta\ndata: ${JSON.stringify({ text: `Câu hỏi số ${n} ` })}\n\n` +
        `event: delta\ndata: ${JSON.stringify({ text: "của em ạ?" })}\n\n` +
        `event: done\ndata: ${JSON.stringify({ n })}\n\n`;
      return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body });
    }
    if (path === "/sessions/s1/answers") {
      const text = (route.request().postDataJSON() as { text: string }).text;
      s.answers.push(text);
      s.turns[s.turns.length - 1].answer = text;
      if (s.turns.length === 5) grade();
      return json(route, out());
    }
    if (path === "/sessions/s1/grade") {
      grade();
      return json(route, out());
    }
    return json(route, { error: { code: "not_found", message: "?" } }, 404);
  });
  return s;
}

async function teachFiveTurns(page: Page) {
  for (let n = 1; n <= 5; n++) {
    await expect(page.getByText(`Câu hỏi số ${n} của em ạ?`)).toBeVisible();
    await page.getByLabel("Lời giảng của bạn").fill(`Lời giảng ${n}`);
    await page.getByRole("button", { name: n === 5 ? "Gửi và chấm bài" : "Gửi lời giảng" }).click();
  }
}

test.describe("AI teaching (K10)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockCatalogApi(page);
  });

  test("five turns, then the result with a star", async ({ page }) => {
    const api = await mockTeachApi(page);
    await page.goto("/courses/math/lesson-1/teach");
    await expect(page.getByText("Hôm nay còn 3 lượt Dạy AI")).toBeVisible();
    await page.getByRole("button", { name: "Bắt đầu dạy" }).click();
    await expect(page.getByText("Lượt 1/5")).toBeVisible();
    await teachFiveTurns(page);

    const result = page.getByRole("region", { name: "Kết quả Dạy AI" });
    await expect(result.getByText("8/10")).toBeVisible();
    await expect(result.getByText("Bạn nhận được 1 sao Dạy AI.")).toBeVisible();
    await expect(result.getByText("Định nghĩa đúng")).toBeVisible();
    await expect(result.getByText("Thêm ví dụ")).toBeVisible();
    await expect(page.getByRole("button", { name: "Dạy lại" })).toBeVisible();
    expect(api.answers).toEqual(["Lời giảng 1", "Lời giảng 2", "Lời giảng 3", "Lời giảng 4", "Lời giảng 5"]);
  });

  test("below 7: no star, invite to teach again", async ({ page }) => {
    await mockTeachApi(page, {
      grades: [
        { score: 5, feedback: "Còn thiếu ý.", strengths: ["Dạng tổng quát"], improvements: ["Nghiệm"] },
      ],
    });
    await page.goto("/courses/math/lesson-1/teach");
    await page.getByRole("button", { name: "Bắt đầu dạy" }).click();
    await teachFiveTurns(page);
    await expect(page.getByText("Chưa đạt 7/10")).toBeVisible();
    await expect(page.getByText("Dạy lại để nhận sao nhé.")).toBeVisible();
  });

  test("a failed grading offers “Chấm lại” without teaching again", async ({ page }) => {
    await mockTeachApi(page, {
      grades: ["fail", { score: 9, feedback: "Tốt.", strengths: ["a"], improvements: ["b"] }],
    });
    await page.goto("/courses/math/lesson-1/teach");
    await page.getByRole("button", { name: "Bắt đầu dạy" }).click();
    await teachFiveTurns(page);
    await page.getByRole("button", { name: "Chấm lại" }).click();
    await expect(page.getByText("9/10")).toBeVisible();
  });

  test("out of sessions for today", async ({ page }) => {
    await mockTeachApi(page, { sessionsLeft: 0 });
    await page.goto("/courses/math/lesson-1/teach");
    await expect(page.getByRole("button", { name: "Bắt đầu dạy" })).toBeDisabled();
    await expect(page.getByText("Hôm nay bạn đã dùng hết lượt Dạy AI. Mai quay lại nhé!")).toBeVisible();
  });

  test("the server refusing a start shows its message", async ({ page }) => {
    await mockTeachApi(page, { failStart: true });
    await page.goto("/courses/math/lesson-1/teach");
    await page.getByRole("button", { name: "Bắt đầu dạy" }).click();
    await expect(page.getByText("Hôm nay bạn đã dùng hết 3 lượt Dạy AI. Mai quay lại nhé!")).toBeVisible();
  });
});
