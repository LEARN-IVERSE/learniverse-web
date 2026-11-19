import { describe, expect, it } from "vitest";

import { activeNavItem, NAV_ITEMS } from "@/components/layout/nav-items";

describe("activeNavItem", () => {
  it("matches each area exactly", () => {
    for (const item of NAV_ITEMS) expect(activeNavItem(item.href)).toBe(item);
  });

  it("keeps the area active on nested pages", () => {
    expect(activeNavItem("/courses/toan-9/bai-3")?.label).toBe("Học tập");
  });

  it("does not match lookalike prefixes or other pages", () => {
    expect(activeNavItem("/coursesx")).toBeUndefined();
    expect(activeNavItem("/status")).toBeUndefined();
    expect(activeNavItem("/")).toBeUndefined();
  });
});
