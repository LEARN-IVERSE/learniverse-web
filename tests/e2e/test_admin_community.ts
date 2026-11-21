import { expect, type Page, test } from "@playwright/test";

import { ADMIN, type FakeUser, mockAccountApi } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const BOXES = [
  ["math", "Toán 9"],
  ["english", "Tiếng Anh 9"],
];

const item = (over: Record<string, unknown>) => ({
  id: "p1",
  kind: "post",
  post_id: "p1",
  box_code: "math",
  box_name: "Toán 9",
  title: "Em chưa hiểu bài này",
  excerpt: "Nội dung bài đăng",
  author_id: "u1",
  author_name: "Nguyễn Văn An",
  created_at: "2026-11-22T08:00:00Z",
  state: "visible",
  open_reports: 0,
  ...over,
});

/** Fake community admin API: a list the test can read the query of, and the actions it sent. */
async function mockCommunity(page: Page) {
  const queries: URLSearchParams[] = [];
  const acts: string[] = [];
  let items = [
    item({ open_reports: 2 }),
    item({ id: "p2", post_id: "p2", title: "Bài đã ẩn", state: "hidden" }),
  ];
  await page.route("**/api/v1/admin/community**", (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === "GET") {
      queries.push(url.searchParams);
      return route.fulfill({ json: { items, total: items.length, page: 1, pages: 1, boxes: BOXES } });
    }
    const path = url.pathname.replace("/api/v1/admin/community/", "");
    acts.push(path);
    const state = path.endsWith("/hide") ? "hidden" : path.endsWith("/unhide") ? "visible" : "deleted";
    items = items.map((i) => (path.startsWith(`post/${i.id}/`) ? { ...i, state, open_reports: 0 } : i));
    return route.fulfill({ json: { state } });
  });
  await page.route("**/api/v1/admin/reports**", (route) => route.fulfill({ json: [] }));
  return { queries, acts };
}

test.describe("community admin (K11c-2)", () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
    await mockAccountApi(page, { signedIn: ADMIN });
  });

  test("filters are sent to the server and a hide asks first", async ({ page }) => {
    const { queries, acts } = await mockCommunity(page);
    const dialogs: string[] = [];
    page.on("dialog", (d) => {
      dialogs.push(d.message());
      void d.accept();
    });
    await page.goto("/admin/community");
    const list = page.getByRole("list", { name: "Bài đăng" });
    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(list.getByText("2 báo cáo")).toBeVisible();

    await page.getByLabel("Box (môn học)").selectOption("english");
    await expect.poll(() => queries.at(-1)?.get("box")).toBe("english");
    await page.getByLabel("Chỉ nội dung đang bị báo cáo").check();
    await expect.poll(() => queries.at(-1)?.get("reported")).toBe("true");
    await page.getByLabel("Trạng thái").selectOption("hidden");
    await expect.poll(() => queries.at(-1)?.get("state")).toBe("hidden");
    await page.getByLabel("Tìm theo chữ hoặc tác giả").fill("An");
    await page.getByLabel("Tìm theo chữ hoặc tác giả").press("Enter");
    await expect.poll(() => queries.at(-1)?.get("q")).toBe("An");

    await list.getByRole("listitem").first().getByRole("button", { name: "Ẩn" }).click();
    await expect(page.getByRole("status")).toHaveText("Đã ẩn nội dung.");
    expect(acts).toEqual(["post/p1/hide"]);
    expect(dialogs[0]).toContain("điểm đóng góp của nó bị thu lại");
  });

  test("showing again warns that points are not returned", async ({ page }) => {
    const { acts } = await mockCommunity(page);
    const dialogs: string[] = [];
    page.on("dialog", (d) => {
      dialogs.push(d.message());
      void d.accept();
    });
    await page.goto("/admin/community");
    const hidden = page.getByRole("listitem").filter({ hasText: "Bài đã ẩn" });
    await hidden.getByRole("button", { name: "Hiện lại" }).click();
    await expect(page.getByRole("status")).toHaveText("Đã hiện lại nội dung.");
    expect(dialogs[0]).toContain("KHÔNG được trả");
    expect(acts).toEqual(["post/p2/unhide"]);
  });

  test("a declined confirmation changes nothing", async ({ page }) => {
    const { acts } = await mockCommunity(page);
    page.on("dialog", (d) => void d.dismiss());
    await page.goto("/admin/community");
    await page.getByRole("button", { name: "Xóa" }).first().click();
    expect(acts).toEqual([]);
  });

  test("reports are a tab of the same section", async ({ page }) => {
    await mockCommunity(page);
    await page.goto("/admin/community");
    await page.getByRole("tab", { name: "Báo cáo vi phạm" }).click();
    await expect(page.getByRole("tab", { name: "Báo cáo vi phạm" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("list", { name: "Bài đăng" })).toHaveCount(0);
  });

  test("the points ledger: search, pick an account, read the lines", async ({ page }) => {
    const user = { id: "u1", name: "Nguyễn Văn An", email: "an@example.com", total: 5 };
    await page.route("**/api/v1/admin/points**", (route) => {
      const params = new URL(route.request().url()).searchParams;
      const picked = params.get("user_id");
      return route.fulfill({
        json: {
          users: params.get("q") ? [user] : [],
          selected: picked ? user : null,
          rows: picked
            ? [
                {
                  id: "l2",
                  kind: "revoke",
                  delta: -5,
                  reason: "hidden_by_admin",
                  reason_text: "Quản trị viên ẩn nội dung",
                  target_type: "post",
                  target_id: "p1",
                  post_id: "p1",
                  excerpt: "Bài Toán của An",
                  created_at: "2026-11-22T09:00:00Z",
                },
                {
                  id: "l1",
                  kind: "grant",
                  delta: 5,
                  reason: "created",
                  reason_text: "Đăng nội dung mới",
                  target_type: "post",
                  target_id: "p1",
                  post_id: "p1",
                  excerpt: "Bài Toán của An",
                  created_at: "2026-11-22T08:00:00Z",
                },
              ]
            : [],
        },
      });
    });
    await page.goto("/admin/points");
    await page.getByLabel("Tên hoặc email").fill("An");
    await page.getByRole("button", { name: "Tìm", exact: true }).click();
    await page.getByRole("list", { name: "Kết quả tìm kiếm" }).getByRole("button").click();
    await expect(page.getByText("Tổng: 5 điểm")).toBeVisible();
    const rows = page.getByRole("row");
    await expect(rows.filter({ hasText: "Quản trị viên ẩn nội dung" })).toContainText("-5");
    await expect(rows.filter({ hasText: "Đăng nội dung mới" })).toContainText("+5");
    await expect(page.getByRole("link", { name: /Bài Toán của An/ }).first()).toHaveAttribute(
      "href",
      "/community/posts/p1",
    );
  });

  test("only an admin can lock the author from a report; a moderating teacher cannot", async ({ page }) => {
    const report = {
      id: "r1",
      status: "new",
      action: null,
      reason: "spam",
      note: "Quảng cáo",
      created_at: "2026-11-22T08:00:00Z",
      reporter_name: "Trần Thị Bích",
      target_type: "post",
      target_id: "p1",
      post_id: "p1",
      target_excerpt: "Nội dung bị báo cáo",
      target_state: "visible",
      target_author_id: "u1",
      target_author_name: "Nguyễn Văn An",
      target_author_locked: false,
      report_count: 1,
    };
    await page.route("**/api/v1/admin/reports**", (route) => route.fulfill({ json: [report] }));

    // admin: the lock button is there
    await page.goto("/admin/reports");
    await expect(page.getByRole("button", { name: "Giữ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Khóa tài khoản người đăng" })).toBeVisible();

    // teacher with `moderation`: may decide about the content, but gets no lock button
    const teacher: FakeUser = { ...ADMIN, id: "t1", name: "Cô Mai", role: "teacher" };
    await mockAccountApi(page, { signedIn: teacher });
    await page.route("**/api/v1/admin/me", (route) =>
      route.fulfill({
        json: {
          role: "teacher",
          permissions: [{ permission: "moderation", subject: null }],
          sections: ["community", "reports"],
        },
      }),
    );
    await page.goto("/admin/reports");
    await expect(page.getByRole("button", { name: "Giữ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Khóa tài khoản người đăng" })).toHaveCount(0);
  });
});
