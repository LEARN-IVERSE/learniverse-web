import { expect, test } from "@playwright/test";

import { mockAccountApi, STUDENT } from "./auth-mocks";
import { makePost, mockCommunityApi } from "./community-mocks";

const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKtcAAAAASUVORK5CYII=",
  "base64",
);

test("community loads the first ten images and defers the rest", async ({ page }, info) => {
  await mockAccountApi(page, { signedIn: STUDENT });
  const posts = Array.from({ length: 12 }, (_, index) => {
    const n = index + 1;
    return makePost(n, {
      media: Array.from({ length: 4 }, (_, m) => ({
        id: `${n}-${m}`,
        kind: "image",
        url: `/k12-test-image/${n}-${m}.png`,
        content_type: "image/png",
        file_name: `ảnh ${n}-${m}`,
      })),
    });
  });
  await mockCommunityApi(page, { posts });
  const requested = new Set<string>();
  await page.route("**/k12-test-image/*", (route) => {
    requested.add(new URL(route.request().url()).pathname);
    return route.fulfill({ status: 200, contentType: "image/png", body: PIXEL });
  });

  await page.goto("/community");
  const feed = page.getByLabel("Danh sách bài đăng");
  await expect(feed.getByRole("heading", { level: 2 })).toHaveCount(10);
  const eager = feed.locator('img[loading="eager"]');
  await expect(eager).toHaveCount(10);
  await expect
    .poll(() =>
      eager.evaluateAll((images) => images.every((img) => (img as HTMLImageElement).naturalWidth > 0)),
    )
    .toBe(true);
  await expect(feed.getByRole("img", { name: "ảnh 3-2", exact: true })).toHaveAttribute("loading", "lazy");
  expect(requested.size).toBe(10);
  const far = feed.getByRole("img", { name: "ảnh 10-0", exact: true });
  await expect(far).toHaveAttribute("loading", "lazy");
  expect(requested.has("/k12-test-image/10-0.png")).toBe(false);
  console.log(
    `K12 ${info.project.name}: 10 bài, ${requested.size} ảnh, ${requested.size * PIXEL.length} byte ảnh trước khi cuộn`,
  );
  await far.scrollIntoViewIfNeeded();
  await expect.poll(() => far.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(feed.getByRole("heading", { level: 2 })).toHaveCount(2);
});
