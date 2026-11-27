import { expect, type Page, test } from "@playwright/test";

import { ADMIN, type FakeUser, mockAccountApi } from "./auth-mocks";
import { mockCatalogApi } from "./catalog-mocks";

const TEACHER: FakeUser = {
  ...ADMIN,
  id: "00000000-0000-4000-8000-000000000003",
  name: "Cô Tâm",
  role: "teacher",
};

type Unit = { code: string; title: string; lessons: unknown[] };

const LESSON = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "lesson-1",
  kind: "lesson",
  label: "Bài 1",
  title: "Phương trình bậc nhất hai ẩn",
  status: "published",
  version: 1,
  counts: {},
  needed: {},
  pending: 0,
};

/** A tiny in-memory group API, so the page re-reads what each action changed. */
async function mockUnits(page: Page) {
  const units: Unit[] = [
    { code: "chapter-1", title: "Chương I. Phương trình", lessons: [LESSON] },
    { code: "chapter-2", title: "Chương II. Bất phương trình", lessons: [] },
  ];
  await page.route("**/api/v1/admin/content/**", (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1/admin/content", "");
    const method = req.method();
    if (path === "/subjects") return route.fulfill({ json: [{ code: "math", name: "Toán 9" }] });
    if (path === "/subjects/math") return route.fulfill({ json: { code: "math", name: "Toán 9", units } });
    if (path === "/subjects/math/units" && method === "POST") {
      const body = req.postDataJSON() as { title: string; after: string | null };
      const unit = { code: `group-${units.length + 1}`, title: body.title.trim(), lessons: [] };
      const at = body.after ? units.findIndex((u) => u.code === body.after) + 1 : 0;
      units.splice(at, 0, unit);
      return route.fulfill({ status: 201, json: { code: unit.code, title: unit.title } });
    }
    const match = /^\/subjects\/math\/units\/([^/]+)(\/move)?$/.exec(path);
    const i = match ? units.findIndex((u) => u.code === match[1]) : -1;
    if (i >= 0) {
      const unit = units[i];
      if (match?.[2]) {
        const j = (req.postDataJSON() as { direction: string }).direction === "up" ? i - 1 : i + 1;
        [units[i], units[j]] = [units[j], units[i]];
      } else if (method === "PATCH") {
        unit.title = (req.postDataJSON() as { title: string }).title.trim();
      } else if (method === "DELETE") {
        units.splice(i, 1);
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { code: unit.code, title: unit.title } });
    }
    return route.fulfill({ status: 404, json: { error: { code: "x", message: "?" } } });
  });
  return units;
}

test.describe("lesson groups", () => {
  test.beforeEach(async ({ page }) => {
    await mockCatalogApi(page);
  });

  test("an admin adds, renames, reorders and deletes a group", async ({ page }) => {
    await mockAccountApi(page, { signedIn: ADMIN });
    const units = await mockUnits(page);
    await page.goto("/admin/content");

    await page.getByRole("button", { name: "Thêm nhóm bài" }).click();
    const form = page.getByRole("form", { name: "Thêm nhóm bài" });
    await form.getByLabel("Tên nhóm").fill("Tập một");
    await form.getByLabel("Đặt sau").selectOption("chapter-1");
    await form.getByRole("button", { name: "Thêm" }).click();
    await expect(page.getByRole("status")).toHaveText("Đã thêm nhóm “Tập một”.");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "Chương I. Phương trình",
      "Tập một",
      "Chương II. Bất phương trình",
    ]);
    await expect(page.getByText("Nhóm chưa có bài.")).toHaveCount(2);

    await page.getByRole("button", { name: "Đổi tên Tập một" }).click();
    await page.getByLabel("Tên mới cho Tập một").fill("Giữa học kì I");
    await page.getByRole("button", { name: "Lưu tên nhóm" }).click();
    await expect(page.getByRole("heading", { name: "Giữa học kì I" })).toBeVisible();

    await page.getByRole("button", { name: "Đưa nhóm Giữa học kì I xuống" }).click();
    await expect(page.getByRole("heading", { level: 2 }).last()).toHaveText("Giữa học kì I");
    await expect(page.getByRole("button", { name: "Đưa nhóm Giữa học kì I xuống" })).toBeDisabled();

    // A group with lessons cannot be deleted; an empty one can.
    await expect(page.getByRole("button", { name: "Xóa nhóm Chương I. Phương trình" })).toBeDisabled();
    page.once("dialog", (d) => void d.accept());
    await page.getByRole("button", { name: "Xóa nhóm Giữa học kì I" }).click();
    await expect(page.getByRole("status")).toHaveText("Đã xóa nhóm “Giữa học kì I”.");
    expect(units.map((u) => u.code)).toEqual(["chapter-1", "chapter-2"]);
  });

  test("teachers see groups but cannot change them", async ({ page }) => {
    await mockAccountApi(page, { signedIn: TEACHER });
    await page.route("**/api/v1/admin/me", (route) =>
      route.fulfill({
        json: {
          role: "teacher",
          permissions: [{ permission: "content", subject: "math" }],
          sections: ["content", "my_changes"],
        },
      }),
    );
    await mockUnits(page);
    await page.goto("/admin/content");
    await expect(page.getByRole("heading", { name: "Chương I. Phương trình" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Thêm nhóm bài" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Đổi tên/ })).toHaveCount(0);
  });
});
