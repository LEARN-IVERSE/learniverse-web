import { describe, expect, it } from "vitest";

import { AVATAR_COLORS, avatarColorClass } from "@/features/auth/user-avatar";

describe("avatarColorClass", () => {
  it("maps the API colour index onto the palette", () => {
    expect(avatarColorClass(0)).toBe(AVATAR_COLORS[0]);
    expect(avatarColorClass(7)).toBe(AVATAR_COLORS[7]);
  });

  it("never fails on out-of-range indexes", () => {
    expect(avatarColorClass(8)).toBe(AVATAR_COLORS[0]);
    expect(avatarColorClass(-1)).toBe(AVATAR_COLORS[7]);
  });
});
