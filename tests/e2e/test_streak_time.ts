import { expect, test } from "@playwright/test";

import { mockActivityApi, mockPeriodicApi } from "./activity-mocks";
import { mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const ON_FIRE = {
  streak_current: 3,
  streak_best: 5,
  last_day: "2026-11-19",
  learned_today: true,
  today_seconds: 1500,
  total_seconds: 4500,
};

test.describe("streaks and study time (K6)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
  });

  test("the header flame shows the streak and the menu shows record and time", async ({ page }) => {
    await mockCatalogApi(page, ON_FIRE);
    await page.goto("/courses");
    await expect(page.getByText("Chuỗi ngày học:")).toBeAttached();
    await expect(page.locator("header").getByText("Chuỗi 3 ngày học liên tiếp")).toBeAttached();
    await page.getByRole("button", { name: /Tài khoản/ }).click();
    const menu = page.getByRole("region", { name: "Tài khoản của bạn" });
    await expect(menu).toContainText("5 ngày");
    await expect(menu).toContainText("25 phút");
    await expect(menu).toContainText("1 giờ 15 phút");
  });

  test("without learning today the flame asks to keep the streak", async ({ page }) => {
    await mockCatalogApi(page);
    await page.goto("/courses");
    await expect(page.locator("header").getByText(/giữ chuỗi/)).toBeAttached();
  });

  test("a passing result announces the longer streak", async ({ page }) => {
    await mockCatalogApi(page);
    await mockActivityApi(page);
    await page.goto("/courses/math/lesson-1/exercise");
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await page.getByRole("group", { name: "Câu 1" }).getByRole("radio").first().check();
    await page.getByRole("group", { name: "Câu 2" }).getByRole("radio", { name: "Đúng" }).check();
    await page.getByRole("group", { name: "Câu 3" }).getByRole("textbox").fill("2");
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await expect(page.getByText("Chuỗi tăng lên 3 ngày!")).toBeVisible();
  });

  test("a periodic test shows its rules and hands itself in when time is up", async ({ page }) => {
    await page.clock.install();
    await mockCatalogApi(page);
    const submitted = { body: [] as unknown[] };
    await mockPeriodicApi(page, submitted);
    await page.goto("/courses/math/midterm-1-review/periodic");
    await expect(page.getByText("3 câu trong 2 phút; đúng từ 50% là đạt.", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await expect(page.getByRole("timer", { name: "Thời gian còn lại" })).toBeVisible();
    await page.getByRole("group", { name: "Câu 2" }).getByRole("radio", { name: "Sai" }).check();

    await page.clock.fastForward("02:05");
    await expect(page.getByRole("heading", { name: /Kết quả/ })).toBeVisible();
    expect(submitted.body).toHaveLength(1);
    expect(JSON.stringify(submitted.body[0])).toContain('"answer":false');
  });

  test("activity pages send heartbeats only while the tab is visible", async ({ page }) => {
    await page.clock.install();
    await mockCatalogApi(page);
    await mockActivityApi(page);
    const beats: string[] = [];
    page.on("request", (r) => r.url().includes("/time/heartbeat") && beats.push(r.url()));
    await page.goto("/courses/math/lesson-1/exercise");
    // One beat on open (React dev mode may run the effect twice; the server just extends the segment).
    await expect.poll(() => beats.length).toBeGreaterThan(0);
    const start = beats.length;
    await page.clock.runFor("01:00");
    await expect.poll(() => beats.length).toBe(start + 2);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.clock.runFor("02:00");
    expect(beats.length).toBe(start + 2);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => beats.length).toBe(start + 3);
  });
});
