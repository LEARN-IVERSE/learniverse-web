import { expect, test } from "@playwright/test";

import { ADMIN, mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";
import { AN, BICH, makeComment, makePost, mockCommunityApi, type ReportMock } from "./community-mocks";

const many = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    makePost(i + 1, { box: { code: i % 2 ? "english" : "math", name: "" } }),
  );

test.describe("community (K7)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockCatalogApi(page);
  });

  test("the feed shows Boxes, newest first, and filters by Box", async ({ page }) => {
    await mockCommunityApi(page, { posts: many(4) });
    await page.goto("/community");
    const feed = page.getByLabel("Danh sách bài đăng");
    await expect(feed.getByRole("heading", { level: 2 })).toHaveText([
      "Bài đăng số 1",
      "Bài đăng số 2",
      "Bài đăng số 3",
      "Bài đăng số 4",
    ]);
    await expect(page.getByText("4 bài đăng")).toBeVisible();
    await page.getByRole("tab", { name: /Box Tiếng Anh 9/ }).click();
    await expect(feed.getByRole("heading", { level: 2 })).toHaveText(["Bài đăng số 2", "Bài đăng số 4"]);
    await expect(page.getByRole("tab", { name: /Box Tiếng Anh 9/ })).toHaveAttribute("aria-selected", "true");
  });

  test("search ignores accents and shows a friendly empty result", async ({ page }) => {
    await mockCommunityApi(page, { posts: [makePost(1, { title: "Phương trình bậc hai" }), makePost(2)] });
    await page.goto("/community");
    await page.getByRole("searchbox", { name: "Tìm theo tên bài hoặc nội dung" }).fill("phuong trinh");
    await expect(page.getByLabel("Danh sách bài đăng").getByRole("heading", { level: 2 })).toHaveText([
      "Phương trình bậc hai",
    ]);
    await page.getByRole("searchbox", { name: "Tìm theo tên bài hoặc nội dung" }).fill("khong co gi");
    await expect(page.getByText("Không có bài nào khớp")).toBeVisible();
  });

  test("paging: 10 per page, next, numbered and jump-to-page", async ({ page }) => {
    await mockCommunityApi(page, { posts: many(25) });
    await page.goto("/community");
    const titles = page.getByLabel("Danh sách bài đăng").getByRole("heading", { level: 2 });
    await expect(titles).toHaveCount(10);
    await page.getByRole("button", { name: "Trang sau" }).click();
    await expect(titles.first()).toHaveText("Bài đăng số 11");
    await expect(page.getByRole("button", { name: "Trang 2" })).toHaveAttribute("aria-current", "page");
    await page.getByLabel("Tới trang").fill("3");
    await page.getByRole("button", { name: "Đi", exact: true }).click();
    await expect(titles).toHaveText([
      "Bài đăng số 21",
      "Bài đăng số 22",
      "Bài đăng số 23",
      "Bài đăng số 24",
      "Bài đăng số 25",
    ]);
    await expect(page.getByRole("button", { name: "Trang sau" })).toBeDisabled();
  });

  test("'Chưa có bình luận' filter", async ({ page }) => {
    await mockCommunityApi(page, { posts: [makePost(1, { comment_count: 2 }), makePost(2)] });
    await page.goto("/community");
    await page.getByLabel("Chưa có bình luận").check();
    await expect(page.getByLabel("Danh sách bài đăng").getByRole("heading", { level: 2 })).toHaveText([
      "Bài đăng số 2",
    ]);
  });

  test("new posts never jump in; a button offers to load them", async ({ page }) => {
    await page.clock.install();
    const state = await mockCommunityApi(page, { posts: many(2) });
    await page.goto("/community");
    await expect(page.getByLabel("Danh sách bài đăng").getByRole("heading", { level: 2 })).toHaveCount(2);
    state.newCount = 3;
    await page.clock.runFor("01:05");
    const banner = page.getByRole("button", { name: /Có 3 bài mới/ });
    await expect(banner).toBeVisible();
    state.posts.unshift(makePost(0, { title: "Bài mới tinh" }));
    await banner.click();
    await expect(page.getByLabel("Danh sách bài đăng").getByRole("heading", { level: 2 }).first()).toHaveText(
      "Bài mới tinh",
    );
  });

  test("a post is written, checked in the browser and published", async ({ page }) => {
    await page.route("**/fake-community-put/**", (route) => {
      expect(route.request().headers().authorization).toBe("Bearer test-upload-token");
      return route.fulfill({ status: 204 });
    });
    const state = await mockCommunityApi(page, { posts: [] });
    await page.goto("/community");
    await page.getByRole("button", { name: /bạn đang thắc mắc/ }).click();
    await page.getByLabel("Tiêu đề").fill("Em chưa hiểu phương trình bậc hai");
    await page.getByLabel("Nội dung", { exact: true }).fill("Giúp em với, công thức $x^2$.");

    await page
      .getByLabel("Chọn ảnh hoặc tệp PDF")
      .setInputFiles({ name: "virus.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") });
    await expect(page.getByRole("alert").filter({ hasText: "chỉ nhận ảnh" })).toContainText(
      "JPG, PNG, WebP hoặc tệp PDF",
    );
    await page
      .getByLabel("Chọn ảnh hoặc tệp PDF")
      .setInputFiles({ name: "bai-tap.png", mimeType: "image/png", buffer: Buffer.from("png") });
    await expect(page.getByRole("list", { name: "Tệp đã chọn" })).toContainText("bai-tap.png");

    await page.getByRole("button", { name: "Đăng bài", exact: true }).last().click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Em chưa hiểu phương trình bậc hai" }),
    ).toBeVisible();
    expect(state.calls).toContain("POST /media/uploads");
    expect(state.calls).toContain("POST /posts");
  });

  test("a throttled post preserves the draft and shows the wait time", async ({ page }) => {
    await mockCommunityApi(page, { posts: [] });
    await page.route("**/api/v1/posts", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 429,
            headers: { "Retry-After": "30" },
            json: { error: { code: "request_rate_limited", message: "Hãy thử lại sau 30 giây." } },
          })
        : route.fallback(),
    );
    await page.goto("/community");
    await page.getByRole("button", { name: /bạn đang thắc mắc/ }).click();
    await page.getByLabel("Tiêu đề").fill("Một câu hỏi đang viết");
    await page.getByLabel("Nội dung", { exact: true }).fill("Phần nội dung sẽ được giữ lại.");
    await page.getByRole("button", { name: "Đăng bài", exact: true }).last().click();
    await expect(page.getByRole("alert").filter({ hasText: "Hãy thử lại sau 30 giây." })).toBeVisible();
    await expect(page.getByLabel("Tiêu đề")).toHaveValue("Một câu hỏi đang viết");
  });

  test("user text cannot inject HTML or script links", async ({ page }) => {
    const nasty =
      "Chào <img src=x onerror=alert(1)> [bấm](javascript:alert(1)) và ![ảnh](http://evil.test/p.png) [ok](https://example.com)";
    await mockCommunityApi(page, { posts: [makePost(1, { body_md: nasty })] });
    await page.goto("/community/posts/post-1");
    const article = page.locator("article");
    await expect(article).toContainText("<img src=x onerror=alert(1)>"); // shown as plain text
    await expect(article.locator("img")).toHaveCount(0);
    await expect(article.getByRole("link", { name: "bấm" })).toHaveCount(0); // javascript: link is dropped
    const ok = article.getByRole("link", { name: "ok" });
    await expect(ok).toHaveAttribute("rel", /noopener/);
    await expect(ok).toHaveAttribute("target", "_blank");
  });

  test("post page: threaded comments, reply, edit, delete placeholder", async ({ page }) => {
    const root = makeComment("c1", { author: BICH, body_md: "Gốc của Bích" });
    await mockCommunityApi(page, {
      posts: [makePost(1, { comment_count: 2 })],
      comments: {
        "post-1": [
          root,
          makeComment("c2", { parent_id: "c1", author: AN, body_md: "Mình trả lời", mine: true }),
        ],
      },
    });
    await page.goto("/community/posts/post-1");
    await expect(page.getByText("Gốc của Bích")).toBeVisible();
    await expect(page.getByText("Mình trả lời")).toBeVisible();

    await page.getByRole("button", { name: "Trả lời", exact: true }).first().click();
    await page.getByLabel("Trả lời Trần Thị Bích").fill("Cảm ơn Bích");
    await page.getByRole("button", { name: "Gửi trả lời" }).click();
    await expect(page.getByText("Cảm ơn Bích")).toBeVisible();

    await page.getByRole("button", { name: "Sửa", exact: true }).first().click();
    await page.getByLabel("Sửa bình luận").fill("Mình trả lời (đã sửa)");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.getByText("Mình trả lời (đã sửa)")).toBeVisible();
    await expect(page.getByText("đã sửa").first()).toBeVisible();

    await page.getByRole("button", { name: "Xóa", exact: true }).first().click();
    await page.getByRole("button", { name: "Xác nhận xóa" }).click();
    await expect(page.getByText("Bình luận đã bị xóa")).toBeVisible();
  });

  test("reporting a post asks for a reason and thanks the learner", async ({ page }) => {
    const state = await mockCommunityApi(page, { posts: [makePost(1)] });
    await page.goto("/community");
    await page.getByRole("button", { name: /Báo cáo bài đăng: Bài đăng số 1/ }).click();
    const dialog = page.getByRole("dialog", { name: /Báo cáo bài đăng/ });
    await dialog.getByLabel("Xúc phạm, lăng mạ").check();
    await dialog.getByLabel("Mô tả thêm (không bắt buộc)").fill("Dùng từ ngữ xấu");
    await dialog.getByRole("button", { name: "Gửi báo cáo" }).click();
    await expect(dialog.getByRole("status")).toContainText("Cảm ơn bạn");
    expect(state.calls).toContain("POST /reports");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("the owner can edit and delete their post", async ({ page }) => {
    await mockCommunityApi(page, { posts: [makePost(1, { author: AN, mine: true })] });
    await page.goto("/community/posts/post-1");
    await expect(page.getByRole("button", { name: /Báo cáo bài đăng/ })).toHaveCount(0); // not your own post
    await page.getByRole("button", { name: "Sửa bài" }).click();
    await page.getByRole("textbox", { name: "Tiêu đề" }).fill("Tiêu đề đã sửa");
    await page.getByRole("button", { name: "Lưu" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tiêu đề đã sửa" })).toBeVisible();
    await page.getByRole("button", { name: "Xóa bài" }).click();
    await page.getByRole("button", { name: "Xác nhận xóa" }).click();
    await expect(page).toHaveURL(/\/community$/);
  });

  test("a missing or hidden post says so", async ({ page }) => {
    await mockCommunityApi(page, { posts: [] });
    await page.goto("/community/posts/nope");
    await expect(page.getByRole("heading", { name: "Không tìm thấy bài đăng" })).toBeVisible();
  });

  test("the bell counts unread notices, lists them and marks them read", async ({ page }) => {
    const state = await mockCommunityApi(page, {
      unread: 2,
      notifications: [
        {
          id: "n1",
          kind: "reply",
          actor: BICH,
          post_id: "post-1",
          post_title: "Bài của An",
          comment_id: "c1",
          created_at: new Date().toISOString(),
          read: false,
        },
        {
          id: "n2",
          kind: "comment_on_post",
          actor: BICH,
          post_id: "post-1",
          post_title: "Bài của An",
          comment_id: "c2",
          created_at: new Date().toISOString(),
          read: false,
        },
      ],
    });
    await page.goto("/courses");
    const bell = page.getByRole("button", { name: "Thông báo: 2 chưa đọc" });
    await expect(bell).toBeVisible();
    await bell.click();
    const panel = page.getByRole("region", { name: "Thông báo của bạn" });
    await expect(panel).toContainText("đã trả lời bình luận của bạn");
    await expect(panel).toContainText("đã bình luận bài của bạn");
    expect(state.calls).toContain("POST /notifications/read");
    await expect(page.getByRole("button", { name: "Thông báo", exact: true })).toBeVisible(); // count cleared
    await panel.getByRole("link", { name: /đã trả lời/ }).click();
    await expect(page).toHaveURL(/\/community\/posts\/post-1#comments/);
  });
});

const REPORT: ReportMock = {
  id: "r1",
  status: "new",
  action: null,
  reason: "spam",
  note: "Quảng cáo",
  created_at: new Date().toISOString(),
  reporter_name: "Trần Thị Bích",
  target_type: "post",
  target_id: "post-1",
  post_id: "post-1",
  target_excerpt: "Bài quảng cáo — mua ngay",
  target_state: "visible",
  target_author_id: "u-A",
  target_author_name: "Nguyễn Văn An",
  target_author_locked: false,
  report_count: 2,
};

test.describe("admin reports (K7)", () => {
  test("students are turned away", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await mockCatalogApi(page);
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Bạn không có quyền vào trang này" })).toBeVisible();
  });

  test("an admin reviews, then hides the reported content", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    await mockCatalogApi(page);
    const state = await mockCommunityApi(page, { reports: [{ ...REPORT }] });
    await page.goto("/admin/reports");
    const list = page.getByRole("list", { name: "Danh sách báo cáo" });
    await expect(list).toContainText("Bài quảng cáo — mua ngay");
    await expect(list).toContainText("2 người báo cáo");
    await expect(list.getByRole("link", { name: "Mở nội dung" })).toHaveAttribute(
      "href",
      "/community/posts/post-1",
    );

    await list.getByRole("button", { name: "Đã xem" }).click();
    expect(state.calls).toContain("POST /admin/reports/r1/review");
    await list.getByRole("button", { name: "Ẩn", exact: true }).click();
    await expect(list).toContainText("Đã xử lý");
    await expect(list.getByRole("button", { name: "Ẩn", exact: true })).toHaveCount(0);
    expect(state.calls).toContain("POST /admin/reports/r1/resolve");
  });
});

test.describe("background polling (K9 prep: shared demo)", () => {
  test("a hidden tab makes no polling requests; a visible one resumes", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.clock.install();
    await mockCatalogApi(page);
    const state = await mockCommunityApi(page, { posts: [] });
    const polls = () => state.calls.filter((c) => c === "GET /notifications").length;
    await page.goto("/courses");
    await expect.poll(polls).toBeGreaterThan(0);
    await page.waitForLoadState("networkidle");

    const visible = polls();
    await page.clock.runFor("01:05");
    await expect.poll(polls).toBe(visible + 1);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const hidden = polls();
    await page.clock.runFor("10:00");
    expect(polls()).toBe(hidden); // ten minutes in the background: nothing sent

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.clock.runFor("01:05");
    await expect.poll(polls).toBeGreaterThan(hidden);
  });
});
