import { expect, test } from "@playwright/test";

import { mockActivityApi } from "./activity-mocks";
import { mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

test.describe("activities (K5)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockCatalogApi(page);
  });

  test("a lesson row opens exercise and review; empty banks say 'Chưa mở'", async ({ page }) => {
    await mockActivityApi(page);
    await page.goto("/courses/math");
    await page.getByRole("button", { name: /Bài 1\./ }).click();
    const actions = page.getByRole("list", { name: /Chức năng của Bài 1/ });
    await expect(actions.getByRole("link", { name: "Bài tập" })).toHaveAttribute(
      "href",
      "/courses/math/lesson-1/exercise",
    );
    await expect(actions.getByRole("link", { name: "Ôn tập" })).toHaveAttribute(
      "href",
      "/courses/math/lesson-1/review",
    );
    await expect(actions.getByRole("link", { name: "Dạy AI" })).toHaveAttribute(
      "href",
      "/courses/math/lesson-1/teach",
    );

    await page.getByRole("button", { name: /Luyện tập chung/ }).click();
    await expect(page.getByRole("list", { name: /Chức năng của Luyện tập chung/ })).toContainText("Chưa mở");
  });

  test("a full correct exercise earns a star and shows answers", async ({ page }) => {
    await mockActivityApi(page);
    await page.goto("/courses/math/lesson-1/exercise");
    await expect(page.getByText("Đúng từ 15/20 câu để nhận sao.")).toBeVisible();
    await page.getByRole("button", { name: "Bắt đầu" }).click();

    await page.getByRole("group", { name: "Câu 1" }).getByRole("radio").first().check();
    await page.getByRole("group", { name: "Câu 2" }).getByRole("radio", { name: "Đúng" }).check();
    await page
      .getByRole("group", { name: "Câu 3" })
      .getByRole("textbox", { name: "Câu trả lời" })
      .fill(" 2 ");
    await expect(page.getByText("Đã làm 3/3 câu")).toBeVisible();
    await page.getByRole("button", { name: "Nộp bài" }).click();

    await expect(page.getByRole("heading", { name: "Kết quả: 10 điểm" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "vừa nhận được 1 sao" })).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Đáp án và lời giải" }).getByText("Lời giải mẫu."),
    ).toHaveCount(3);
  });

  test("blank answers need a confirmation and point to what to revise", async ({ page }) => {
    await mockActivityApi(page);
    await page.goto("/courses/math/lesson-1/exercise");
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await page.getByRole("group", { name: "Câu 2" }).getByRole("radio", { name: "Sai" }).check();
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Còn 2 câu chưa làm" })).toBeVisible();
    await page.getByRole("button", { name: "Vẫn nộp bài" }).click();

    await expect(page.getByText("Chưa đạt. Đúng từ 15/20 câu để nhận sao.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Phương trình bậc nhất hai ẩn" })).toHaveAttribute(
      "href",
      "/courses/math/lesson-1#section-1",
    );
    await page.getByRole("button", { name: "Làm lại" }).click();
    await expect(page.getByText("Đã làm 0/3 câu")).toBeVisible();
  });

  test("a closed activity says so instead of starting", async ({ page }) => {
    await mockActivityApi(page, { available: false });
    await page.goto("/courses/math/lesson-1/review");
    await expect(page.getByRole("status").filter({ hasText: "Chưa mở" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bắt đầu" })).toHaveCount(0);
  });

  test("the theory check stays closed until the reading time has passed", async ({ page }) => {
    await mockActivityApi(page, { readCompleted: false });
    await page.goto("/courses/math/lesson-1");
    await expect(page.getByText(/5 câu kiểm tra mở sau 2:00 nữa/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Làm 5 câu kiểm tra" })).toHaveCount(0);
  });

  test("once read, the theory check starts in place", async ({ page }) => {
    await mockActivityApi(page, { readCompleted: true });
    await page.goto("/courses/math/lesson-1");
    await page.getByRole("button", { name: "Làm 5 câu kiểm tra" }).click();
    await expect(page.getByRole("form", { name: "Bài làm" })).toBeVisible();
  });

  test("unknown activity pages show not found", async ({ page }) => {
    await page.goto("/courses/math/lesson-1/dance");
    await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  });
});
