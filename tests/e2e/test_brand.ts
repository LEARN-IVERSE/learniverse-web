import { expect, test } from "@playwright/test";

test.describe("brand", () => {
  test("serves the comet logo as the favicon", async ({ page, request }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
    expect(href).toContain("/icon.svg");

    const res = await request.get(href!);
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("image/svg+xml");
    expect(await res.text()).toContain('aria-label="Logo LEARNIVERSE sao chổi L1"');
  });

  test("sample D uses the comet logo by default", async ({ page }) => {
    await page.goto("/samples/d");
    await expect(page.getByRole("img", { name: "Logo LEARNIVERSE sao chổi L1" }).first()).toBeVisible();
  });
});
