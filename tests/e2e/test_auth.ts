import { expect, test } from "@playwright/test";

import { ADMIN, mockAccountApi, STUDENT, stubGoogleIdentity } from "./auth-mocks";

test.describe("sign in with Google (K3)", () => {
  test("guests are sent to sign-in, then back to the page they asked for", async ({ page }) => {
    await mockAccountApi(page);
    await stubGoogleIdentity(page);

    await page.goto("/community");
    await expect(page).toHaveURL(/\/login\?next=%2Fcommunity$/);
    await expect(page).toHaveTitle("Đăng nhập · LEARNIVERSE");

    await page.getByRole("button", { name: "Tiếp tục với Google (giả lập)" }).click();
    await expect(page).toHaveURL(/\/community$/);
    await expect(page.getByRole("button", { name: `Tài khoản: ${STUDENT.name}` })).toBeVisible();
  });

  test("a guest opening the root URL sees the sign-in card, not a stuck skeleton", async ({ page }) => {
    // Regression: the guard used to live in the (app) layout, which Next.js 16 drops from rendering.
    await mockAccountApi(page);
    await stubGoogleIdentity(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login\?next=%2Fcourses$/);
    await expect(page.getByRole("heading", { name: "LEARNIVERSE" })).toBeVisible();
    await expect(page.getByRole("status", { name: "Đang tải" })).toBeHidden();
  });

  test("a refused Google credential shows the API's message", async ({ page }) => {
    await mockAccountApi(page);
    await stubGoogleIdentity(page, "expired-token");
    await page.goto("/login");
    await page.getByRole("button", { name: "Tiếp tục với Google (giả lập)" }).click();
    // Next.js also renders an (empty) route announcer with role="alert"; pick ours by its text.
    await expect(
      page.getByRole("alert").filter({ hasText: "Đăng nhập Google không hợp lệ. Bạn thử lại nhé." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("the account menu shows who is signed in and signs out", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.goto("/courses");
    await page.getByRole("button", { name: `Tài khoản: ${STUDENT.name}` }).click();
    const menu = page.getByRole("region", { name: "Tài khoản của bạn" });
    await expect(menu).toContainText(STUDENT.email);
    await expect(menu).toContainText("Học sinh");
    await expect(menu.getByRole("link", { name: "Trang quản trị" })).toHaveCount(0);

    await menu.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/courses");
    await expect(page).toHaveURL(/\/login\?next=%2Fcourses$/);
  });

  for (const next of ["https://evil.example/", "//evil.example"]) {
    test(`next=${next} cannot send the learner off-site`, async ({ page }) => {
      await mockAccountApi(page);
      await stubGoogleIdentity(page);
      await page.goto(`/login?next=${encodeURIComponent(next)}`);
      await page.getByRole("button", { name: "Tiếp tục với Google (giả lập)" }).click();
      await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/courses$/);
    });
  }

  test("an already signed-in learner skips the sign-in page", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.goto("/login");
    await expect(page).toHaveURL(/\/courses$/);
  });

  test("the admin page is only for admins", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.goto("/admin");
    await expect(page.getByRole("region", { name: "Bạn không có quyền vào trang này" })).toBeVisible();

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await mockAccountApi(page, { signedIn: ADMIN });
    await page.goto("/courses");
    await page.getByRole("button", { name: `Tài khoản: ${ADMIN.name}` }).click();
    await page.getByRole("link", { name: "Trang quản trị" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1, name: "Trang quản trị" })).toBeVisible();
  });
});
