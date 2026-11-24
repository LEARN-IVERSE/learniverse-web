import { expect, test } from "@playwright/test";

import { mockAiApi } from "./ai-mocks";
import { ADMIN, mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const field = (value: unknown, def: unknown, custom = false) => ({ value, default: def, custom });

const settings = (over: Record<string, unknown> = {}) => ({
  enabled: true,
  env_enabled: true,
  provider: "gemini",
  key_configured: true,
  chat_model: field("gemini-3.5-flash-lite", "gemini-3.5-flash-lite"),
  grader_model: field(null, null),
  chat_thinking_level: field(null, null),
  grader_thinking_level: field(null, null),
  region: field(null, null),
  daily_messages: field(30, 30),
  daily_images: field(5, 5),
  daily_teach_sessions: field(3, 3),
  price_input_per_m: field(0.3, 0.3),
  price_output_per_m: field(2.5, 2.5),
  updated_at: null,
  updated_by: null,
  ...over,
});

test.describe("AI settings (K11c-3)", () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test("an admin changes the limits, then goes back to a default; the key is never shown", async ({
    page,
  }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    const puts: Record<string, unknown>[] = [];
    await page.route("**/api/v1/admin/ai-settings", (route) => {
      const req = route.request();
      if (req.method() === "GET") return route.fulfill({ json: settings() });
      const body = req.postDataJSON() as Record<string, unknown>;
      puts.push(body);
      return route.fulfill({
        json: settings({
          enabled: body.enabled,
          daily_messages: field(body.daily_messages ?? 30, 30, body.daily_messages !== null),
          chat_thinking_level: field(body.chat_thinking_level, null, body.chat_thinking_level !== null),
          grader_thinking_level: field(body.grader_thinking_level, null, body.grader_thinking_level !== null),
          region: field(body.region, null, body.region !== null),
          updated_at: "2026-11-22T09:00:00Z",
          updated_by: "Quản Trị",
        }),
      });
    });
    await page.goto("/admin/ai");
    const form = page.getByRole("form", { name: "Cấu hình AI" });
    await expect(form.getByText(/Nhà cung cấp|Khóa API|Mặc định:|Ví dụ gemini/)).toHaveCount(0);
    await expect(form.getByText("Để trống để dùng cùng model trả lời.")).toBeVisible();
    await expect(form.getByText("0 đến 1000", { exact: true })).toBeVisible();
    await expect(form.locator("input[type=password]")).toHaveCount(0);

    const messages = page.getByLabel("Số tin nhắn mỗi học sinh mỗi ngày");
    await expect(messages).toHaveValue(""); // not set: shows the default as a placeholder
    await expect(messages).toHaveAttribute("placeholder", "30");
    await messages.fill("12");
    const chatThinking = page.getByRole("slider", { name: "Mức suy luận của model trả lời" });
    const graderThinking = page.getByRole("slider", { name: "Mức suy luận của model chấm" });
    await expect(chatThinking).toHaveAttribute("aria-valuetext", "Mặc định máy chủ");
    await chatThinking.press("ArrowRight");
    await chatThinking.press("ArrowRight");
    await graderThinking.press("End");
    await graderThinking.press("ArrowLeft");
    await page.getByRole("combobox", { name: /Vùng gọi Gemini/ }).selectOption("global");
    await page.getByRole("button", { name: "Lưu cấu hình" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Đã lưu. Cấu hình mới có hiệu lực từ lần gọi AI tiếp theo.",
    );
    expect(puts[0]).toMatchObject({
      enabled: true,
      daily_messages: 12,
      chat_model: null,
      daily_images: null,
      chat_thinking_level: "LOW",
      grader_thinking_level: "HIGH",
      region: "global",
    });
    await expect(messages).toHaveValue("12");
    await expect(chatThinking).toHaveAttribute("aria-valuetext", "Thấp (LOW)");
    await expect(form.getByText("Thấp (LOW)", { exact: true })).toBeVisible();
    await expect(graderThinking).toHaveAttribute("aria-valuetext", "Cao (HIGH)");
    await expect(form.getByText("Cao (HIGH)", { exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /Vùng gọi Gemini/ })).toHaveValue("global");
    await expect(page.getByText("bởi Quản Trị")).toBeVisible();

    await chatThinking.press("Home");
    await expect(chatThinking).toHaveAttribute("aria-valuetext", "Mặc định máy chủ");
    await page.getByRole("combobox", { name: /Vùng gọi Gemini/ }).selectOption("");
    await page.getByRole("button", { name: "Về mặc định" }).last().click();
    await expect(messages).toHaveValue("");
    await page.getByRole("button", { name: "Lưu cấu hình" }).click();
    await expect.poll(() => puts.at(-1)?.daily_messages).toBeNull();
    expect(puts.at(-1)).toMatchObject({
      chat_thinking_level: null,
      grader_thinking_level: "HIGH",
      region: null,
    });
  });

  test("the off switch is sent, and an env-level off is explained", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    const puts: Record<string, unknown>[] = [];
    await page.route("**/api/v1/admin/ai-settings", (route) => {
      const req = route.request();
      if (req.method() === "GET") return route.fulfill({ json: settings({ env_enabled: false }) });
      puts.push(req.postDataJSON() as Record<string, unknown>);
      return route.fulfill({ json: settings({ enabled: false, env_enabled: false }) });
    });
    await page.goto("/admin/ai");
    await expect(page.getByRole("form", { name: "Cấu hình AI" }).getByRole("alert")).toContainText(
      "AI_ENABLED",
    );
    await page.getByLabel("Bật AI").uncheck();
    await expect(page.getByText("AI đang tạm tắt")).toBeVisible();
    await page.getByRole("button", { name: "Lưu cấu hình" }).click();
    await expect.poll(() => puts[0]?.enabled).toBe(false);
  });

  test("only admins may open it", async ({ page }) => {
    await mockAccountApi(page, { signedIn: { ...ADMIN, role: "teacher" } });
    await page.goto("/admin/ai");
    await expect(page.getByRole("heading", { name: "Cấu hình AI" })).toHaveCount(0);
  });

  test("a learner sees AI paused: the chat box is closed and nothing is sent", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    const ai = await mockAiApi(page);
    await page.route("**/api/v1/ai/quota", (route) =>
      route.fulfill({
        json: { messages_left: 30, images_left: 5, daily_messages: 30, daily_images: 5, enabled: false },
      }),
    );
    await page.goto("/courses");
    await page.getByRole("button", { name: "Mở trợ lý AI" }).click();
    const panel = page.getByRole("region", { name: "Trợ lý AI Sao Nhí" });
    const box = panel.getByLabel("Câu hỏi cho trợ lý AI");
    await expect(box).toBeDisabled();
    await expect(box).toHaveAttribute("placeholder", "AI đang tạm nghỉ. Bạn quay lại sau nhé!");
    expect(ai.sent).toEqual([]);
  });

  test("a learner cannot start AI teaching while AI is paused", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.route("**/api/v1/subjects/math/lessons/lesson-1/ai-teaching", (route) =>
      route.fulfill({
        json: { session: null, earned: false, sessions_left: 3, daily_sessions: 3, enabled: false },
      }),
    );
    await page.goto("/courses/math/lesson-1/teach");
    await expect(page.getByRole("button", { name: "Bắt đầu dạy" })).toBeDisabled();
    await expect(page.getByText("AI đang tạm nghỉ. Bạn quay lại sau nhé!")).toBeVisible();
  });
});
