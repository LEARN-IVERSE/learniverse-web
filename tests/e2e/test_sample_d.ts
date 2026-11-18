import { expect, test } from "@playwright/test";

test.describe("sample D (Quỹ đạo)", () => {
  test("learn home opens a subject world with its lesson path", async ({ page }) => {
    await page.goto("/samples/d");
    await expect(page.getByRole("heading", { name: /Hôm nay mình bay tới hành tinh nào/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ba hành tinh môn học" })).toBeVisible();

    await page.getByRole("button", { name: /Hành tinh của những con số/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Toán 9" })).toBeVisible();
    await expect(page.getByText("Ôn tập giữa kỳ I")).toBeVisible();

    await page.getByRole("button", { name: /Bài 3/ }).click();
    await expect(page.getByRole("button", { name: "Dạy AI" }).first()).toBeVisible();
  });

  test("social view filters posts by subject box", async ({ page }) => {
    await page.goto("/samples/d");
    await page.getByRole("button", { name: "Mạng xã hội" }).first().click();
    await expect(page.getByRole("heading", { name: "Góc hỏi đáp" })).toBeVisible();

    await page.getByRole("tab", { name: /BOX NGỮ VĂN 9/ }).click();
    await expect(page.getByText("Cách mở bài cho đoạn văn nghị luận xã hội")).toBeVisible();
    await expect(page.getByText("Mẹo phân biệt thì hiện tại hoàn thành")).toHaveCount(0);
  });

  test("ranking view shows the podium, ties and the learner's own position", async ({ page }) => {
    await page.goto("/samples/d");
    await page.getByRole("button", { name: "Bảng xếp hạng" }).first().click();
    await expect(page.getByRole("heading", { name: "Những ngôi sao của LEARNIVERSE" })).toBeVisible();

    const podium = page.getByRole("region", { name: "Bục vinh danh TOP 3" });
    await expect(podium.getByText("Quốc Bảo")).toBeVisible();
    await expect(podium.getByText("Đồng hạng").first()).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Vị trí của bạn" })).toContainText("#12");

    await page.getByRole("tab", { name: "Thời gian học tập" }).click();
    await expect(page.getByRole("complementary", { name: "Vị trí của bạn" })).toContainText("#2");
  });

  test("the mascot opens the AI assistant", async ({ page }) => {
    await page.goto("/samples/d");
    await page.getByRole("button", { name: "Mở trợ lý AI" }).click();
    await expect(page.getByRole("region", { name: "Trợ lý AI Sao Nhí" })).toBeVisible();
  });
});
