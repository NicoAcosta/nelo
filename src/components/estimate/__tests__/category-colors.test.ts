import { describe, it, expect } from "vitest";
import { assignCategoryColors, CATEGORY_PALETTE } from "../category-colors";

describe("assignCategoryColors", () => {
  it("assigns distinct colors to top 9 categories", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `cat_${i}`);
    const colors = assignCategoryColors(ids);
    expect(colors.get("cat_0")).toBe(CATEGORY_PALETTE[0]);
    expect(colors.get("cat_8")).toBe(CATEGORY_PALETTE[8]);
  });

  it("assigns rest color to categories beyond top 9", () => {
    const ids = Array.from({ length: 12 }, (_, i) => `cat_${i}`);
    const colors = assignCategoryColors(ids);
    expect(colors.get("cat_9")).toBe(CATEGORY_PALETTE[9]);
    expect(colors.get("cat_11")).toBe(CATEGORY_PALETTE[9]);
  });

  it("handles fewer than 9 categories", () => {
    const ids = ["a", "b", "c"];
    const colors = assignCategoryColors(ids);
    expect(colors.size).toBe(3);
  });
});
