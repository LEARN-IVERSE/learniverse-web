import { expect, test } from "@playwright/test";

// Checks the FE renders on its own (the API does not need to be running).
test("home page shows the LEARNIVERSE title and the connectivity checklist", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "LEARNIVERSE" })).toBeVisible();
  await expect(page.getByText("API (learniverse-api)")).toBeVisible();
  await expect(page.getByText("Cơ sở dữ liệu")).toBeVisible();
});
