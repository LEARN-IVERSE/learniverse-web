import { describe, expect, it } from "vitest";

import { formatMinutes, rankByValue } from "@/features/samples/d/ranking";

describe("rankByValue", () => {
  it("gives equal values the same rank and skips the next rank (1-2-2-4)", () => {
    const rows = rankByValue([
      { id: "c", name: "C", value: 150 },
      { id: "a", name: "A", value: 185 },
      { id: "b", name: "B", value: 150 },
      { id: "d", name: "D", value: 140 },
    ]);
    expect(rows.map((r) => [r.id, r.rank, r.tied])).toEqual([
      ["a", 1, false],
      ["b", 2, true],
      ["c", 2, true],
      ["d", 4, false],
    ]);
  });

  it("keeps a stable order by id inside a tie and does not mutate the input", () => {
    const input = [
      { id: "u2", name: "Second", value: 10 },
      { id: "u1", name: "First", value: 10 },
    ];
    const snapshot = JSON.stringify(input);
    expect(rankByValue(input).map((r) => r.id)).toEqual(["u1", "u2"]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("formatMinutes", () => {
  it("formats study time as Vietnamese hours and minutes", () => {
    expect(formatMinutes(1930)).toBe("32 giờ 10 phút");
    expect(formatMinutes(605)).toBe("10 giờ 05 phút");
    expect(formatMinutes(45)).toBe("45 phút");
  });
});
