import { describe, expect, it } from "vitest";

import { HOME_PATH, safeNextPath } from "@/features/auth/safe-next";

describe("safeNextPath", () => {
  it("keeps local paths with their query and hash", () => {
    expect(safeNextPath("/community")).toBe("/community");
    expect(safeNextPath("/courses/toan-9?bai=3#on-tap")).toBe("/courses/toan-9?bai=3#on-tap");
  });

  it.each([
    null,
    "",
    "https://evil.example/courses",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "courses",
    "/login?next=/admin",
  ])("falls back to the learning area for %j", (raw) => {
    expect(safeNextPath(raw)).toBe(HOME_PATH);
  });
});
