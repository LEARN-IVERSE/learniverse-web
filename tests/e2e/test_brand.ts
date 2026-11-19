import { expect, test } from "@playwright/test";

import { mockCatalogApi } from "./catalog-mocks";
import { mockAccountApi, STUDENT } from "./auth-mocks";

test.describe("brand", () => {
  test("the shell shows the comet logo", async ({ page }) => {
    await mockCatalogApi(page);
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.goto("/courses");
    await expect(page.getByRole("img", { name: "Logo LEARNIVERSE sao chổi L1" }).first()).toBeVisible();
  });

  test("serves the comet logo as the favicon", async ({ page, request }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
    expect(href).toContain("/icon.svg");

    const res = await request.get(href!);
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("image/svg+xml");
    expect(await res.text()).toContain('aria-label="Logo LEARNIVERSE sao chổi L1"');
  });
});
