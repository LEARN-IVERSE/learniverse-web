import { expect, type Page, test } from "@playwright/test";

import { ADMIN, mockAccountApi, STUDENT } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

type U = Record<string, unknown> & { id: string; name: string; role: string; is_locked: boolean };

const user = (id: string, name: string, role = "student", over: Partial<U> = {}): U => ({
  id,
  name,
  email: `${id}@example.com`,
  avatar_initial: name.split(" ").at(-1)![0],
  avatar_color: 1,
  role,
  is_locked: false,
  lock_reason: null,
  locked_at: null,
  created_at: "2026-11-19T08:00:00Z",
  last_login_at: "2026-11-21T08:00:00Z",
  stars: 3,
  points: 10,
  permissions: [],
  ...over,
});

async function mockAdminApi(page: Page, users: U[]) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  await page.route("**/api/v1/admin/users**", (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace("/api/v1/admin", "");
    calls.push({ method: req.method(), path, body: req.postDataJSON() });
    if (path === "/users") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const role = url.searchParams.get("role");
      const items = users.filter(
        (u) => (!q || u.name.toLowerCase().includes(q)) && (!role || u.role === role),
      );
      return route.fulfill({ json: { items, total: items.length, page: 1, pages: 1, page_size: 20 } });
    }
    const m = path.match(/^\/users\/([^/]+)\/(lock|unlock|role)$/);
    const u = users.find((x) => x.id === m?.[1]);
    if (!m || !u)
      return route.fulfill({ status: 404, json: { error: { code: "user_not_found", message: "?" } } });
    const body = (req.postDataJSON() ?? {}) as Record<string, unknown>;
    if (m[2] === "lock") Object.assign(u, { is_locked: true, lock_reason: body.reason });
    if (m[2] === "unlock") Object.assign(u, { is_locked: false, lock_reason: null });
    if (m[2] === "role") Object.assign(u, { role: body.role, permissions: body.permissions });
    return route.fulfill({ json: u });
  });
  await page.route("**/api/v1/admin/audit**", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            id: "a1",
            actor_name: "Quản Trị",
            action: "user.lock",
            target_type: "user",
            target_id: "u-bob",
            before: null,
            after: { is_locked: true },
            created_at: "2026-11-21T08:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
      },
    }),
  );
  return calls;
}

test.describe("admin accounts (K11a)", () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test("students cannot open the admin area", async ({ page }) => {
    await mockAccountApi(page, { signedIn: STUDENT });
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Bạn không có quyền vào trang này" })).toBeVisible();
  });

  test("an admin searches, locks with a reason, then unlocks", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    const calls = await mockAdminApi(page, [user("u-bob", "Trần Văn Bình"), user("u-tam", "Lê Thị Tâm")]);
    await page.goto("/admin/users");
    const list = page.getByRole("list", { name: "Danh sách tài khoản" });
    await expect(list.getByRole("button")).toHaveCount(2);
    await page.getByRole("searchbox", { name: "Tìm theo tên hoặc email" }).fill("bình");
    await expect(list.getByRole("button")).toHaveCount(1);

    await list.getByRole("button", { name: /Trần Văn Bình/ }).click();
    const panel = page.getByRole("complementary", { name: "Chi tiết tài khoản Trần Văn Bình" });
    await panel.getByRole("button", { name: "Khóa tài khoản" }).click();
    await expect(panel.getByRole("button", { name: "Xác nhận khóa" })).toBeDisabled(); // reason required
    await panel.getByLabel("Lý do khóa (bắt buộc)").fill("Spam nhiều lần");
    await panel.getByRole("button", { name: "Xác nhận khóa" }).click();
    await expect(panel.getByText("Đã khóa: Spam nhiều lần")).toBeVisible();
    await expect(list.getByText("Đã khóa")).toBeVisible();
    expect(calls.find((c) => c.path.endsWith("/lock"))?.body).toEqual({ reason: "Spam nhiều lần" });

    await panel.getByRole("button", { name: "Mở khóa" }).click();
    await expect(panel.getByRole("status")).toHaveText("Đã mở khóa tài khoản.");
  });

  test("an admin makes someone a teacher with per-subject rights", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    const calls = await mockAdminApi(page, [user("u-tam", "Lê Thị Tâm")]);
    await page.goto("/admin/users");
    await page.getByRole("button", { name: /Lê Thị Tâm/ }).click();
    const panel = page.getByRole("complementary", { name: "Chi tiết tài khoản Lê Thị Tâm" });
    await panel.getByLabel("Vai trò").selectOption("teacher");
    const rights = panel.getByRole("group", { name: "Quyền của giáo viên" });
    await rights.getByRole("checkbox", { name: "Soạn nội dung, câu hỏi" }).first().check(); // Toán 9
    await rights.getByRole("checkbox", { name: "Kiểm duyệt cộng đồng (mọi Box)" }).check();
    await panel.getByRole("button", { name: "Lưu vai trò" }).click();
    await expect(panel.getByRole("status")).toHaveText("Đã lưu vai trò và quyền.");
    expect(calls.find((c) => c.path.endsWith("/role"))?.body).toEqual({
      role: "teacher",
      permissions: [
        { permission: "content", subject: "math" },
        { permission: "moderation", subject: null },
      ],
    });
  });

  test("an admin cannot lock or demote their own account", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    await mockAdminApi(page, [user(ADMIN.id, ADMIN.name, "admin")]);
    await page.goto("/admin/users");
    await page.getByRole("list", { name: "Danh sách tài khoản" }).getByRole("button").click();
    const panel = page.getByRole("complementary", { name: `Chi tiết tài khoản ${ADMIN.name}` });
    await expect(panel.getByText("Đây là tài khoản của bạn.")).toBeVisible();
    await expect(panel.getByLabel("Vai trò")).toBeDisabled();
  });

  test("the audit log lists admin changes", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    await mockAdminApi(page, []);
    await page.goto("/admin/audit");
    await expect(page.getByRole("list", { name: "Nhật ký quản trị" })).toContainText(
      "Quản Trị · Khóa tài khoản",
    );
  });
});
