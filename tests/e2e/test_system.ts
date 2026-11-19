import { expect, test } from "@playwright/test";

import { mockAccountApi, STUDENT } from "./auth-mocks";

// The K1 connectivity check now lives at /he-thong inside the App Shell. It renders on its own;
// the API does not need to be running.
test("system page shows the connectivity checklist", async ({ page }) => {
  await mockAccountApi(page, { signedIn: STUDENT });
  await page.goto("/he-thong");
  await expect(page.getByRole("heading", { level: 1, name: "Trạng thái hệ thống" })).toBeVisible();
  await expect(page.getByText("API (learniverse-api)", { exact: true })).toBeVisible();
  await expect(page.getByText("Cơ sở dữ liệu", { exact: true })).toBeVisible();
});
