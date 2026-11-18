import { expect, test } from "@playwright/test";

const SAMPLES = ["a", "b", "c"] as const;

test("samples index links to the three UI directions", async ({ page }) => {
  await page.goto("/samples");
  for (const id of SAMPLES) {
    await expect(page.locator(`a[href="/samples/${id}"]`)).toBeVisible();
  }
});

for (const id of SAMPLES) {
  test(`sample ${id}: subjects, lesson list and AI assistant work`, async ({ page }) => {
    await page.goto(`/samples/${id}`);
    await expect(page.getByRole("heading", { name: "Học tập" })).toBeVisible();
    await expect(page.getByText("Toán 9", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "XEM BÀI HỌC" }).first().click();
    await expect(page.getByText("Bài 1: Tên bài học minh họa số 1")).toBeVisible();

    await page.getByRole("button", { name: "Mở trợ lý AI" }).click();
    await expect(page.getByText("Trợ lý AI", { exact: true })).toBeVisible();
  });

  test(`sample ${id}: sidebar switches to the social and ranking views`, async ({ page, isMobile }) => {
    test.skip(isMobile && id !== "b", "Sidebar is collapsed behind a menu button on phones");
    await page.goto(`/samples/${id}`);
    await page.getByRole("button", { name: "Mạng xã hội" }).first().click();
    await expect(page.getByRole("heading", { name: "Mạng xã hội" })).toBeVisible();
    await page.getByRole("button", { name: "Bảng xếp hạng" }).first().click();
    await expect(page.getByText("Thành viên tích cực")).toBeVisible();
  });
}
