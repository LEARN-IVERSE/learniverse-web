import { describe, expect, it } from "vitest";

import { HOME_PATH, safeNextPath } from "@/features/auth/safe-next";

describe("safeNextPath", () => {
  it("keeps local paths with their query and hash", () => {
    expect(safeNextPath("/mang-xa-hoi")).toBe("/mang-xa-hoi");
    expect(safeNextPath("/hoc-tap/toan-9?bai=3#on-tap")).toBe("/hoc-tap/toan-9?bai=3#on-tap");
  });

  it.each([
    null,
    "",
    "https://evil.example/hoc-tap",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "hoc-tap",
    "/dang-nhap?next=/admin",
  ])("falls back to the learning area for %j", (raw) => {
    expect(safeNextPath(raw)).toBe(HOME_PATH);
  });
});
