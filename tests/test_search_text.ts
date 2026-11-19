import { describe, expect, it } from "vitest";

import { fold } from "@/features/learn/search-text";

// Must match the API's catalog/text.py fold() so filtering and search agree.
describe("fold", () => {
  it.each([
    ["Căn bậc hai", "can bac hai"],
    ["ĐƯỜNG TRÒN ngoại tiếp", "duong tron ngoai tiep"],
    ["  Thế   giới kì ảo ", "the gioi ki ao"],
    ["Unit 1", "unit 1"],
  ])("%j -> %j", (text, folded) => {
    expect(fold(text)).toBe(folded);
  });
});
