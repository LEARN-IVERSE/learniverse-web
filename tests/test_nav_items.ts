import { describe, expect, it } from "vitest";

import { activeNavItem, NAV_ITEMS } from "@/components/layout/nav-items";

describe("activeNavItem", () => {
  it("matches each area exactly", () => {
    for (const item of NAV_ITEMS) expect(activeNavItem(item.href)).toBe(item);
  });

  it("keeps the area active on nested pages", () => {
    expect(activeNavItem("/hoc-tap/toan-9/bai-3")?.label).toBe("Học tập");
  });

  it("does not match lookalike prefixes or other pages", () => {
    expect(activeNavItem("/hoc-tapx")).toBeUndefined();
    expect(activeNavItem("/he-thong")).toBeUndefined();
    expect(activeNavItem("/")).toBeUndefined();
  });
});
