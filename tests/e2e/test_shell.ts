import { expect, test } from "@playwright/test";

// Behaviour of the App Shell; runs in both projects (desktop rail and phone bottom tabs).
test.describe("app shell", () => {
  test("the root URL opens the learning area", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/hoc-tap$/);
    await expect(page.getByRole("heading", { level: 1, name: "Ba hành tinh môn học" })).toBeVisible();
    await expect(page).toHaveTitle("Học tập · LEARNIVERSE");
  });

  test("main navigation switches areas and marks the current one", async ({ page }) => {
    await page.goto("/hoc-tap");
    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await expect(nav.getByRole("link", { name: "Học tập" })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Mạng xã hội" }).click();
    await expect(page).toHaveURL(/\/mang-xa-hoi$/);
    await expect(page.getByRole("heading", { level: 1, name: "Góc hỏi đáp" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Mạng xã hội" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Học tập" })).not.toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Bảng xếp hạng" }).click();
    await expect(page).toHaveURL(/\/bang-xep-hang$/);
    await expect(page.getByRole("region", { name: "Bảng xếp hạng đang trống" })).toBeVisible();
  });

  test("unknown pages show a 404 inside the shell with a way back", async ({ page }) => {
    const res = await page.goto("/khong-co-trang-nay");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
    await page.getByRole("link", { name: "Về trang Học tập", exact: true }).click();
    await expect(page).toHaveURL(/\/hoc-tap$/);
  });

  test("the AI button opens and closes the Sao Nhí panel", async ({ page }) => {
    await page.goto("/hoc-tap");
    await page.getByRole("button", { name: "Mở trợ lý AI" }).click();
    const panel = page.getByRole("region", { name: "Trợ lý AI Sao Nhí" });
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("a skip link jumps to the main content", async ({ page }) => {
    await page.goto("/hoc-tap");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Bỏ qua, tới nội dung chính" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page).toHaveURL(/#noi-dung$/);
  });
});
