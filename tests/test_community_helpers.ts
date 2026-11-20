import { describe, expect, it } from "vitest";

import type { CommentOut } from "@/lib/api-client";
import { buildTree } from "@/features/community/comment-tree";
import { pageWindow } from "@/features/community/pagination";
import { checkFile } from "@/features/community/post-form";
import { timeAgo } from "@/features/community/time-ago";

describe("pageWindow", () => {
  it("shows first, last and the neighbours of the current page with gaps", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-20T12:00:00Z");
  const ago = (s: number) => new Date(now - s * 1000).toISOString();
  it("speaks Vietnamese in minutes, hours and days", () => {
    expect(timeAgo(ago(20), now)).toBe("vừa xong");
    expect(timeAgo(ago(5 * 60), now)).toBe("5 phút trước");
    expect(timeAgo(ago(3 * 3600), now)).toBe("3 giờ trước");
    expect(timeAgo(ago(2 * 86400), now)).toBe("2 ngày trước");
  });
});

describe("checkFile", () => {
  const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });
  it("accepts images and PDFs, refuses other types and big files", () => {
    expect(checkFile(file("a.png", "image/png"), [])).toBeNull();
    expect(checkFile(file("a.pdf", "application/pdf"), [])).toBeNull();
    expect(checkFile(file("a.exe", "application/x-msdownload"), [])).toMatch(/chỉ nhận/);
    expect(checkFile(file("a.html", "text/html"), [])).toMatch(/chỉ nhận/);
    expect(checkFile(file("big.png", "image/png", 6 << 20), [])).toMatch(/quá lớn/);
  });
  it("limits 4 images and 2 PDFs per post", () => {
    const four = Array.from({ length: 4 }, () => ({ kind: "image" as const }));
    expect(checkFile(file("a.png", "image/png"), four)).toMatch(/tối đa 4 ảnh/);
    const two = Array.from({ length: 2 }, () => ({ kind: "file" as const }));
    expect(checkFile(file("a.pdf", "application/pdf"), two)).toMatch(/tối đa 2 tệp/);
  });
});

describe("buildTree", () => {
  const c = (id: string, parent: string | null): CommentOut => ({
    id,
    parent_id: parent,
    author: null,
    body_md: id,
    state: "visible",
    created_at: "2026-11-20T00:00:00Z",
    edited: false,
    mine: false,
  });
  it("nests replies under their parent, oldest first", () => {
    const tree = buildTree([c("a", null), c("b", "a"), c("c", "b"), c("d", null), c("e", "a")]);
    expect(tree.map((n) => n.id)).toEqual(["a", "d"]);
    expect(tree[0].children.map((n) => n.id)).toEqual(["b", "e"]);
    expect(tree[0].children[0].children.map((n) => n.id)).toEqual(["c"]);
  });
  it("shows a reply whose parent is missing at the top level", () => {
    expect(buildTree([c("x", "missing")]).map((n) => n.id)).toEqual(["x"]);
  });
});
