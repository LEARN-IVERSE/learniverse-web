import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

const answerFile = process.env.K12_TEST_ANSWER_FILE;
const LESSON = "/api/v1/subjects/math/lessons/lesson-1";

test("K12 persists a post with an upload and learning progress through the linked test stack", async ({
  page,
  baseURL,
}, info) => {
  test.skip(!answerFile, "Requires the linked API test stack and its seeded answer file");
  expect(new URL(baseURL!).hostname).toBe("localhost");
  const marker = await page.request.get("/api/__k12_test__");
  await expect(marker).toBeOK();
  expect(await marker.json()).toEqual({ isolated: true });

  const run = `${info.project.name}-${randomUUID().slice(0, 8)}`;
  const email = `k12-${run}@example.test`;
  const login = () =>
    page.request.post("/api/v1/auth/google", { data: { credential: `ok|${email}|${email}|Học sinh K12` } });
  await expect(await login()).toBeOK();
  await page.goto("/community");
  const title = `Ảnh nghiệm thu ${run}`;
  await page.getByRole("button", { name: /bạn đang thắc mắc/i }).click();
  await page.getByLabel("Tiêu đề").fill(title);
  await page.getByLabel("Nội dung", { exact: true }).fill("Thử kho tệp và lưu bài sau khi đăng nhập lại.");
  await page.getByLabel("Chọn ảnh hoặc tệp PDF").setInputFiles({
    name: "k12.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKtcAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  const upload = page.waitForResponse(
    (response) => response.request().method() === "PUT" && response.url().includes("/v1/media/uploads/"),
  );
  await page.getByRole("button", { name: "Đăng bài", exact: true }).last().click();
  expect((await upload).status()).toBe(204);
  const post = page.getByRole("article").filter({ has: page.getByRole("heading", { name: title }) });
  await expect(post).toBeVisible();

  const attempt = await page.request.post(`${LESSON}/attempts`, { data: { activity: "exercise" } });
  await expect(attempt).toBeOK();
  const { id, questions } = (await attempt.json()) as {
    id: string;
    questions: { id: string; type: string }[];
  };
  const key = JSON.parse(readFileSync(answerFile!, "utf8")) as Record<string, unknown>;
  const answers = questions.map((question) => {
    const correct = key[question.id];
    return {
      question_id: question.id,
      answer: question.type === "fill_blank" && Array.isArray(correct) ? correct[0] : correct,
    };
  });
  const beat = () =>
    page.request.post("/api/v1/time/heartbeat", {
      data: { tab_id: "k12-linked-tab", subject: "math", code: "lesson-1", activity: "exercise" },
    });
  expect((await beat()).status()).toBe(204);
  const submitted = await page.request.post(`/api/v1/attempts/${id}/submit`, { data: { answers } });
  await expect(submitted).toBeOK();
  expect(await submitted.json()).toMatchObject({ passed: true, lesson_stars: 1, streak: { current: 1 } });
  await expect
    .poll(async () => {
      await beat();
      return (await (await page.request.get("/api/v1/me/progress")).json()).total_seconds;
    })
    .toBeGreaterThan(0);

  await page.reload();
  await expect(post).toBeVisible();
  await expect
    .poll(() =>
      post.getByRole("img", { name: "k12.png" }).evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(1);
  await expect(await page.request.post("/api/v1/auth/logout")).toBeOK();
  expect((await page.request.get("/api/v1/me")).status()).toBe(401);
  await expect(await login()).toBeOK();
  const progress = await (await page.request.get("/api/v1/me/progress")).json();
  expect(progress.streak_current).toBe(1);
  expect(progress.total_seconds).toBeGreaterThan(0);
  const stored = await (await page.request.get(`/api/v1/attempts/${id}`)).json();
  expect(stored).toMatchObject({ passed: true, lesson_stars: 1 });
});
