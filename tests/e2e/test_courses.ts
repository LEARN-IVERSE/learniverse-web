import { expect, test } from "@playwright/test";

import { mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

test.describe("courses (K4)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockCatalogApi(page);
  });

  test("subject cards lead to the outline in book order", async ({ page }) => {
    await page.goto("/courses");
    for (const name of ["Toán 9", "Tiếng Anh 9", "Ngữ văn 9"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await page.getByRole("link", { name: /Toán 9/ }).click();
    await expect(page).toHaveURL(/\/courses\/math$/);
    await expect(page.getByRole("heading", { level: 1, name: "Toán 9" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Chương I\./ })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Luyện tập chung")).toBeVisible();
    await expect(page.getByText("Ôn tập giữa kì I")).toBeVisible();
    await expect(page.getByRole("img", { name: "0 trên 4 sao" })).toBeVisible();
  });

  test("a lesson row reveals its four functions on tap or keyboard focus", async ({ page }) => {
    await page.goto("/courses/math");
    const actions = page.getByRole("list", { name: /Chức năng của Bài 1/ });
    const row = page.getByRole("button", { name: /Bài 1\./ });

    await row.click(); // tap on phones, click on desktop
    await expect(actions).toBeVisible();
    for (const name of ["Lý thuyết", "Bài tập", "Dạy AI", "Ôn tập"]) {
      await expect(actions).toContainText(name);
    }
    await row.click();
    await row.focus(); // keyboard users see the functions while focus is inside the row
    await expect(actions.getByRole("link", { name: "Lý thuyết" })).toBeVisible();
  });

  test("the theory page renders math with KaTeX", async ({ page }) => {
    await page.goto("/courses/math");
    await page.getByRole("button", { name: /Bài 1\./ }).click();
    await page.getByRole("link", { name: "Lý thuyết" }).click();
    await expect(page).toHaveURL(/\/courses\/math\/lesson-1$/);
    await expect(page.getByRole("heading", { level: 1, name: /Bài 1\. Khái niệm/ })).toBeVisible();
    await expect(page.locator(".katex").first()).toBeVisible();
    await expect(page.locator(".katex-display")).toHaveCount(1);
  });

  test("chapters collapse and the in-page filter ignores accents", async ({ page }) => {
    await page.goto("/courses/math");
    await page.getByRole("button", { name: /Chương I\./ }).click();
    await expect(page.getByText("Luyện tập chung")).toBeHidden();
    await page.getByRole("searchbox", { name: "Lọc bài trong môn" }).fill("luyen tap");
    await expect(page.getByText("Luyện tập chung")).toBeVisible();
    await expect(page.getByRole("button", { name: /Bài 1\./ })).toHaveCount(0);
  });

  test("an unknown subject shows a not-found message", async ({ page }) => {
    await page.goto("/courses/physics");
    // Next.js also renders an empty route announcer with role="alert"; pick ours by its text.
    await expect(page.getByRole("alert").filter({ hasText: "Không tìm thấy môn học" })).toBeVisible();
  });

  test("the header search finds lessons without accents", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "the header search is shown from md up");
    await page.goto("/courses");
    await page.getByRole("searchbox", { name: "Tìm bài học" }).fill("he hai phuong trinh");
    const results = page.getByRole("region", { name: "Kết quả tìm bài học" });
    await results.getByRole("link", { name: /Bài 1\. Khái niệm/ }).click();
    await expect(page).toHaveURL(/\/courses\/math\/lesson-1$/);
  });
});
