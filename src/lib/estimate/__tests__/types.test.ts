import { describe, it, expect } from "vitest";
import { updatePrice } from "../types";

describe("updatePrice", () => {
  it("adjusts price by ICC ratio", () => {
    // Base price 100,000 ARS at ICC 500, current ICC 600 → 120,000
    expect(updatePrice(100_000, 500, 600)).toBe(120_000);
  });

  it("returns base price when ICC base is zero", () => {
    expect(updatePrice(100_000, 0, 600)).toBe(100_000);
  });

  it("returns same price when ICC unchanged", () => {
    expect(updatePrice(50_000, 400, 400)).toBe(50_000);
  });
});
