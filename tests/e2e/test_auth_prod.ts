import { expect, test } from "@playwright/test";

import { mockAccountApi, STUDENT, stubGoogleIdentity } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

// Runs against `next build && next start` (see playwright.config.ts). The bug below never shows in
// `next dev`, only in the build that testers get.
test.describe("sign in on the production build", () => {
  test("a guest who lands on a page, signs in and arrives on it: no redirect loop", async ({ page }) => {
    // Regression (2026-11-21): the session state of the signed-out visit was kept for the (app) layout, so
    // /courses still saw "guest" after signing in, bounced to /login, which bounced back, forever.
    await mockCatalogApi(page);
    await mockAccountApi(page);
    await stubGoogleIdentity(page);

    let navigations = 0;
    page.on("framenavigated", (frame) => frame === page.mainFrame() && navigations++);

    await page.goto("/courses");
    await expect(page).toHaveURL(/\/login\?next=%2Fcourses$/);
    await page.getByRole("button", { name: "Tiếp tục với Google (giả lập)" }).click();

    await expect(page).toHaveURL(/\/courses$/);
    await expect(page.getByRole("button", { name: `Tài khoản: ${STUDENT.name}` })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Hôm nay mình bay tới hành tinh nào/ }),
    ).toBeVisible();

    await page.waitForTimeout(2000); // a loop would keep bouncing
    await expect(page).toHaveURL(/\/courses$/);
    expect(navigations).toBeLessThan(10);
  });

  test("signing out then signing in as the next person works too", async ({ page }) => {
    await mockCatalogApi(page);
    await mockAccountApi(page, { signedIn: STUDENT });
    await stubGoogleIdentity(page);

    await page.goto("/courses");
    await page.getByRole("button", { name: `Tài khoản: ${STUDENT.name}` }).click();
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByRole("button", { name: "Tiếp tục với Google (giả lập)" }).click();
    await expect(page).toHaveURL(/\/courses$/);
    await expect(page.getByRole("button", { name: `Tài khoản: ${STUDENT.name}` })).toBeVisible();
  });

  test("a signed-in learner who opens /login goes straight to the app", async ({ page }) => {
    await mockCatalogApi(page);
    await mockAccountApi(page, { signedIn: STUDENT });
    await stubGoogleIdentity(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/courses$/);
  });
});
