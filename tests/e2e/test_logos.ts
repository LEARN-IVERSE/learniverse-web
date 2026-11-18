import { expect, test } from "@playwright/test";

test.describe("logo lab", () => {
  test("lists every logo concept with its preview link", async ({ page }) => {
    await page.goto("/samples/logos");
    await expect(page.getByRole("heading", { level: 1, name: "Đề xuất logo LEARNIVERSE" })).toBeVisible();
    for (const name of ["Hành tinh a²", "Vô cực", "Ô cửa vũ trụ", "Chòm sao chữ số", "Bậc thang vũ trụ"]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Xem trong mẫu D →" })).toHaveCount(5);
  });

  test("shows the refined comet L1 mark with its preview link", async ({ page }) => {
    await page.goto("/samples/logos");
    const showcase = page.getByRole("region", { name: "Sao chổi L1" });
    await expect(showcase.getByRole("img", { name: "Logo LEARNIVERSE sao chổi L1" }).first()).toBeVisible();
    await showcase.getByRole("link", { name: /Xem Sao chổi L1 trong mẫu D/ }).click();
    await expect(page).toHaveURL(/\/samples\/d#logo=comet$/);
    await expect(page.getByRole("img", { name: "Logo LEARNIVERSE sao chổi L1" }).first()).toBeVisible();
  });

  test("sample D swaps its brand mark from the URL hash", async ({ page }) => {
    await page.goto("/samples/d#logo=porthole");
    await expect(page.getByRole("img", { name: "Logo ô cửa vũ trụ" }).first()).toBeVisible();

    await page.goto("/samples/d#logo=planet");
    await expect(page.getByRole("img", { name: "Logo hành tinh a mũ 2" }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: "Logo ô cửa vũ trụ" })).toHaveCount(0);
  });
});
