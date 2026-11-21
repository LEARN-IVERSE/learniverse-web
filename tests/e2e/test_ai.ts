import { expect, type Page, test } from "@playwright/test";

import { mockAiApi } from "./ai-mocks";
import { mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function openChat(page: Page) {
  await page.getByRole("button", { name: "Mở trợ lý AI" }).click();
  return page.getByRole("region", { name: "Trợ lý AI Sao Nhí" });
}

test.describe("AI assistant (K9)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockCatalogApi(page);
  });

  test("asks a question and shows the streamed answer with math and the remaining count", async ({
    page,
  }) => {
    const ai = await mockAiApi(page);
    await page.goto("/courses");
    const panel = await openChat(page);
    await expect(panel.getByText("Hôm nay còn 30 lượt")).toBeVisible();
    await panel.getByLabel("Câu hỏi cho trợ lý AI").fill("Giải hệ x + y = 5, x − y = 1");
    await panel.getByLabel("Câu hỏi cho trợ lý AI").press("Enter");

    const log = panel.getByRole("log", { name: "Tin nhắn" });
    await expect(log.getByText("Giải hệ x + y = 5, x − y = 1")).toBeVisible();
    await expect(log.getByText("Em thử thay lại xem nhé?")).toBeVisible();
    await expect(log.locator(".katex")).toHaveCount(1); // $(3; 2)$ rendered by KaTeX
    await expect(panel.getByText("Hôm nay còn 29 lượt")).toBeVisible();
    expect(ai.sent).toEqual([
      { conversation: "chat-1", text: "Giải hệ x + y = 5, x − y = 1", media_ids: [] },
    ]);
    expect(ai.created).toEqual([{ lesson: null }]);
  });

  test("a suggestion sends right away and the chat stays open across pages", async ({ page }) => {
    await mockAiApi(page);
    await page.goto("/courses");
    const panel = await openChat(page);
    await panel.getByRole("button", { name: "Giải thích phương trình bậc hai" }).click();
    await expect(panel.getByText("Em thử thay lại xem nhé?")).toBeVisible();
    await page
      .getByRole("link", { name: /Bảng xếp hạng/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await expect(page.getByRole("region", { name: "Trợ lý AI Sao Nhí" })).toBeVisible();
  });

  test("“Hỏi Sao Nhí về bài này” opens the chat about the lesson", async ({ page }) => {
    const ai = await mockAiApi(page);
    await page.goto("/courses/math/lesson-1");
    await page.getByRole("button", { name: "Hỏi Sao Nhí về bài này" }).click();
    const panel = page.getByRole("region", { name: "Trợ lý AI Sao Nhí" });
    await expect(panel.getByText(/Đang hỏi về: Khái niệm phương trình/)).toBeVisible();
    await panel.getByRole("button", { name: "Tóm tắt bài này giúp em" }).click();
    await expect(panel.getByText("Em thử thay lại xem nhé?")).toBeVisible();
    expect(ai.created).toEqual([{ lesson: { subject: "math", code: "lesson-1" } }]);
  });

  test("out of messages: friendly message and the input is locked", async ({ page }) => {
    await mockAiApi(page, {
      failWith: {
        status: 429,
        code: "ai_quota_exceeded",
        message: "Bạn đã dùng hết lượt hỏi AI hôm nay. Mai quay lại nhé!",
      },
    });
    await page.goto("/courses");
    const panel = await openChat(page);
    await panel.getByLabel("Câu hỏi cho trợ lý AI").fill("Câu hỏi");
    await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
    await expect(panel.getByRole("alert")).toHaveText(
      "Bạn đã dùng hết lượt hỏi AI hôm nay. Mai quay lại nhé!",
    );
  });

  test("starts with 0 left: input disabled", async ({ page }) => {
    await mockAiApi(page, { messagesLeft: 0 });
    await page.goto("/courses");
    const panel = await openChat(page);
    await expect(panel.getByText("Hôm nay còn 0 lượt")).toBeVisible();
    await expect(panel.getByLabel("Câu hỏi cho trợ lý AI")).toBeDisabled();
  });

  test("an error midway keeps the partial answer and says it is incomplete", async ({ page }) => {
    await mockAiApi(page, {
      answer: ["Bước 1: "],
      streamError: "Trợ lý AI trả lời quá lâu. Bạn thử lại nhé.",
    });
    await page.goto("/courses");
    const panel = await openChat(page);
    await panel.getByLabel("Câu hỏi cho trợ lý AI").fill("Câu hỏi");
    await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
    await expect(panel.getByText("Bước 1:")).toBeVisible();
    await expect(panel.getByText("Trợ lý AI trả lời quá lâu. Bạn thử lại nhé.")).toBeVisible();
    await expect(panel.getByText("(Câu trả lời chưa hoàn tất)")).toBeVisible();
  });

  test("the stop button ends a running answer", async ({ page }) => {
    await mockAiApi(page, { hang: true });
    await page.goto("/courses");
    const panel = await openChat(page);
    await panel.getByLabel("Câu hỏi cho trợ lý AI").fill("Câu hỏi dài");
    await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
    await expect(panel.getByText("Sao Nhí đang suy nghĩ…")).toBeVisible();
    await panel.getByRole("button", { name: "Dừng trả lời" }).click();
    await expect(panel.getByText("(Câu trả lời chưa hoàn tất)")).toBeVisible();
    await expect(panel.getByRole("button", { name: "Gửi câu hỏi" })).toBeVisible();
  });

  test("attaches an image with a preview and sends its upload id", async ({ page }) => {
    const ai = await mockAiApi(page);
    await page.route("**/api/v1/media/uploads", (route) =>
      route.fulfill({
        json: { id: "media-1", upload_url: "http://localhost:3100/fake-put", content_type: "image/png" },
      }),
    );
    await page.route("**/fake-put", (route) => route.fulfill({ status: 200 }));
    await page.goto("/courses");
    const panel = await openChat(page);
    await panel
      .getByLabel("Chọn ảnh bài tập")
      .setInputFiles({ name: "bai.png", mimeType: "image/png", buffer: PNG });
    await expect(panel.getByRole("img", { name: "Xem trước bai.png" })).toBeVisible();
    await panel.getByLabel("Câu hỏi cho trợ lý AI").fill("Bài này giải sao?");
    await panel.getByRole("button", { name: "Gửi câu hỏi" }).click();
    await expect(panel.getByRole("img", { name: "Ảnh đính kèm" })).toBeVisible();
    await expect(panel.getByText("Em thử thay lại xem nhé?")).toBeVisible();
    expect(ai.sent[0].media_ids).toEqual(["media-1"]);
  });

  test("a wrong file type is refused before upload", async ({ page }) => {
    await mockAiApi(page);
    await page.goto("/courses");
    const panel = await openChat(page);
    await panel
      .getByLabel("Chọn ảnh bài tập")
      .setInputFiles({ name: "de.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
    await expect(panel.getByRole("alert")).toHaveText("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
  });

  test("history: open an old chat, then delete it after confirming", async ({ page }) => {
    await mockAiApi(page, {
      conversations: [
        {
          id: "chat-old",
          title: "Phương trình bậc hai",
          lesson: null,
          updated_at: new Date().toISOString(),
          messages: [
            { id: "1", role: "user", text: "Delta là gì?", status: "complete", images: [], created_at: "" },
            {
              id: "2",
              role: "model",
              text: "Delta là biệt thức.",
              status: "complete",
              images: [],
              created_at: "",
            },
          ],
        },
      ],
    });
    await page.goto("/courses");
    const panel = await openChat(page);
    await panel.getByRole("button", { name: "Lịch sử" }).click();
    await panel.getByRole("button", { name: "Phương trình bậc hai", exact: true }).click();
    await expect(panel.getByText("Delta là biệt thức.")).toBeVisible();

    await panel.getByRole("button", { name: "Lịch sử" }).click();
    await panel.getByRole("button", { name: "Xóa cuộc trò chuyện Phương trình bậc hai" }).click();
    await panel.getByRole("button", { name: "Xác nhận xóa" }).click();
    await expect(panel.getByText("Chưa có cuộc trò chuyện nào.")).toBeVisible();
  });

  test("the panel can be enlarged for easier reading and the history stands out", async ({ page }) => {
    await mockAiApi(page);
    await page.goto("/courses");
    const panel = await openChat(page);
    const before = (await panel.boundingBox())!.width;
    await panel.getByRole("button", { name: "Phóng to khung chat" }).click();
    await expect(panel.getByRole("button", { name: "Thu nhỏ khung chat" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const after = (await panel.boundingBox())!.width;
    expect(after).toBeGreaterThanOrEqual(before);
    await expect(panel.getByLabel("Câu hỏi cho trợ lý AI")).toHaveClass(/text-base/);
    await expect(panel.getByText(/Google|Gemini/)).toHaveCount(0);
    await expect(panel.getByRole("button", { name: "Trò chuyện mới" })).toBeVisible();
  });
});
