import { describe, it, expect } from "vitest";
import { formatARS, formatUSD, formatPercent, formatCompact } from "../format";

describe("formatARS", () => {
  it("formats large numbers with dots as thousands separator", () => {
    expect(formatARS(187450000)).toBe("187.450.000");
  });
  it("formats zero", () => {
    expect(formatARS(0)).toBe("0");
  });
});

describe("formatUSD", () => {
  it("formats with comma thousands separator", () => {
    expect(formatUSD(142680)).toBe("142,680");
  });
});

describe("formatPercent", () => {
  it("formats percentage with one decimal", () => {
    expect(formatPercent(22.5)).toBe("22.5%");
  });
  it("formats whole number without decimal", () => {
    expect(formatPercent(10)).toBe("10%");
  });
});

describe("formatCompact", () => {
  it("formats millions as $42.2M", () => {
    expect(formatCompact(42200000)).toBe("$42.2M");
  });
  it("formats thousands as $850K", () => {
    expect(formatCompact(850000)).toBe("$850K");
  });
  it("formats non-round thousands with one decimal as $1.5K", () => {
    expect(formatCompact(1500)).toBe("$1.5K");
  });
});
