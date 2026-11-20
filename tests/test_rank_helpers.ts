import { describe, expect, it } from "vitest";

import { formatStudy } from "@/features/rank/rank-page";

describe("formatStudy", () => {
  it("shows hours and minutes, or 'under a minute'", () => {
    expect(formatStudy(20)).toBe("dưới 1 phút");
    expect(formatStudy(60)).toBe("1 phút");
    expect(formatStudy(12 * 60 + 30)).toBe("12 phút");
    expect(formatStudy(3600)).toBe("1 giờ");
    expect(formatStudy(3600 + 5 * 60)).toBe("1 giờ 5 phút");
  });
});
