import { expect, test, type Page } from "@playwright/test";

import { mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const user = (id: string, name: string, color = 0) => ({
  id,
  name,
  avatar_initial: name.split(" ").at(-1)![0],
  avatar_color: color,
});
const ME = user(STUDENT.id, STUDENT.name, 0);
const row = (
  rank: number,
  tied: boolean,
  u: ReturnType<typeof user>,
  points: number,
  posts: number,
  comments: number,
) => ({
  rank,
  tied,
  user: u,
  points,
  posts,
  comments,
});
const AN = user("u-an", "Nguyễn Văn An", 1);
const BICH = user("u-bich", "Trần Thị Bích", 2);
const CUC = user("u-cuc", "Lê Thị Cúc", 3);
const DUNG = user("u-dung", "Phạm Văn Dũng", 4);

const CONTRIB = {
  items: [
    row(1, false, AN, 30, 3, 3),
    row(2, true, BICH, 20, 2, 2),
    row(2, true, CUC, 20, 1, 3),
    row(4, false, DUNG, 15, 1, 2),
    row(5, false, ME, 10, 0, 2),
  ],
  me: { rank: 5, value: 10 },
  updated_at: new Date().toISOString(),
};

const TIME = {
  items: [
    { rank: 1, tied: false, user: AN, seconds: 3600 + 5 * 60 },
    { rank: 2, tied: false, user: BICH, seconds: 12 * 60 },
    { rank: 3, tied: false, user: ME, seconds: 30 },
  ],
  me: { rank: 3, value: 30 },
  updated_at: new Date().toISOString(),
};

async function mockBoards(page: Page, contrib: object = CONTRIB, time: object = TIME) {
  await page.route("**/api/v1/leaderboard/contributions", (route) => route.fulfill({ json: contrib }));
  await page.route("**/api/v1/leaderboard/study-time", (route) => route.fulfill({ json: time }));
}

test.describe("leaderboard (K8)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockCatalogApi(page);
  });

  test("the points board shows the podium, ties, counts and where you stand", async ({ page }) => {
    await mockBoards(page);
    await page.goto("/leaderboard");
    await expect(
      page.getByRole("heading", { level: 1, name: "Những ngôi sao của LEARNIVERSE" }),
    ).toBeVisible();

    const podium = page.getByRole("region", { name: "Bục vinh danh TOP 3" });
    await expect(podium).toContainText("Nguyễn Văn An");
    await expect(podium).toContainText("30 điểm");
    await expect(podium).toContainText("3 bài đăng · 3 bình luận");
    await expect(podium.getByText("Đồng hạng")).toHaveCount(2); // Bích and Cúc share rank 2
    await expect(podium.getByLabel(/Hạng 2, huy chương Bạc/)).toHaveCount(2);

    const rest = page.getByRole("list", { name: "Các hạng tiếp theo" });
    await expect(rest.getByRole("listitem")).toHaveCount(2);
    await expect(rest.getByRole("listitem").first()).toContainText("Phạm Văn Dũng");
    await expect(rest.getByRole("listitem").first()).toContainText("Hạng 4");
    await expect(rest.getByRole("listitem").nth(1)).toContainText("BẠN"); // the signed-in learner

    const you = page.getByRole("complementary", { name: "Vị trí của bạn" });
    await expect(you).toContainText("#5");
    await expect(you).toContainText("10 điểm");
  });

  test("the study-time board shows hours and minutes", async ({ page }) => {
    await mockBoards(page);
    await page.goto("/leaderboard");
    await page.getByRole("tab", { name: "Thời gian học tập" }).click();
    await expect(page.getByRole("tab", { name: "Thời gian học tập" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("1 giờ 5 phút").first()).toBeVisible();
    await expect(page.getByText("12 phút").first()).toBeVisible();
    await expect(page.getByText("dưới 1 phút").first()).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Vị trí của bạn" })).toContainText("#3");
  });

  test("empty boards say so and invite the learner in", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByText("Bảng xếp hạng đang trống")).toBeVisible();
    await expect(page.getByText("Bạn chưa có tên trên bảng này")).toBeVisible();
    await expect(page.getByRole("link", { name: "Đăng câu hỏi (+5)" })).toHaveAttribute("href", "/community");
    await page.getByRole("tab", { name: "Thời gian học tập" }).click();
    await expect(page.getByRole("link", { name: "Học tiếp" })).toHaveAttribute("href", "/courses");
  });

  test("a learner outside the TOP 10 still sees their rank", async ({ page }) => {
    await mockBoards(page, { ...CONTRIB, items: CONTRIB.items.slice(0, 4), me: { rank: 12, value: 5 } });
    await page.goto("/leaderboard");
    const you = page.getByRole("complementary", { name: "Vị trí của bạn" });
    await expect(you).toContainText("#12");
    await expect(you).toContainText("Cố lên");
  });

  test("the board reloads by itself every minute", async ({ page }) => {
    await page.clock.install();
    let current: object = CONTRIB;
    await page.route("**/api/v1/leaderboard/contributions", (route) => route.fulfill({ json: current }));
    await page.goto("/leaderboard");
    await expect(page.getByRole("region", { name: "Bục vinh danh TOP 3" })).toContainText("Nguyễn Văn An");
    current = { ...CONTRIB, items: [row(1, false, DUNG, 99, 9, 9), ...CONTRIB.items.slice(1)] };
    await page.clock.runFor("01:05");
    await expect(page.getByRole("region", { name: "Bục vinh danh TOP 3" })).toContainText("99 điểm");
  });

  test("a failed load offers a retry", async ({ page }) => {
    let fail = true;
    await page.route("**/api/v1/leaderboard/contributions", (route) =>
      fail
        ? route.fulfill({ status: 500, json: { error: { code: "x", message: "x" } } })
        : route.fulfill({ json: CONTRIB }),
    );
    await page.goto("/leaderboard");
    await expect(page.getByRole("alert").filter({ hasText: "có lỗi" })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Thử lại" }).click();
    await expect(page.getByRole("region", { name: "Bục vinh danh TOP 3" })).toContainText("Nguyễn Văn An");
  });
});
