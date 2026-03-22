import { describe, it, expect } from "vitest";
import { compareEstimates, type EstimateComparison } from "../compare";
import type { Estimate } from "../types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEstimate(overrides: Partial<Estimate> = {}): Estimate {
  const base: Estimate = {
    pricePerM2: 100_000,
    totalPrice: 10_000_000,
    directCost: 8_000_000,
    overheadPercent: 10,
    overheadAmount: 800_000,
    profitPercent: 12,
    profitAmount: 960_000,
    subtotalBeforeTax: 9_760_000,
    ivaPercent: 21,
    ivaAmount: 2_049_600,
    categories: [
      {
        id: "estructura",
        name: "Estructura Resistente",
        subtotal: 2_000_000,
        incidencePercent: 25,
        lineItems: [],
      },
      {
        id: "albanileria",
        name: "Albañilería",
        subtotal: 1_500_000,
        incidencePercent: 18.75,
        lineItems: [],
      },
    ],
    totalLineItems: 10,
    activeLineItems: 10,
    confidence: "standard",
    confidenceRange: { low: -15, high: 20 },
    inputsProvided: 6,
    inputsTotal: 14,
    pricePerM2Usd: 82,
    totalPriceUsd: 8_200,
    blueRateVenta: 1220,
    blueRateDate: "2026-03-22",
    pricingLastUpdated: "2026-03-22",
    assumptions: [],
    locationZone: "caba",
    floorAreaM2: 100,
    priceBaseDate: "2026-03-22",
    iccBaseValue: 100,
    iccCurrentValue: 100,
  };
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compareEstimates", () => {
  it("computes per-category deltas between two estimates with same categories", () => {
    const a = makeEstimate();
    const b = makeEstimate({
      totalPrice: 12_000_000,
      pricePerM2: 120_000,
      categories: [
        {
          id: "estructura",
          name: "Estructura Resistente",
          subtotal: 2_400_000, // +400_000 (+20%)
          incidencePercent: 25,
          lineItems: [],
        },
        {
          id: "albanileria",
          name: "Albañilería",
          subtotal: 1_800_000, // +300_000 (+20%)
          incidencePercent: 18.75,
          lineItems: [],
        },
      ],
    });

    const result = compareEstimates(a, b);

    expect(result.categories).toHaveLength(2);

    const estructura = result.categories.find((c) => c.id === "estructura");
    expect(estructura).toBeDefined();
    expect(estructura!.versionA).toBe(2_000_000);
    expect(estructura!.versionB).toBe(2_400_000);
    expect(estructura!.delta).toBe(400_000);
    expect(estructura!.deltaPercent).toBeCloseTo(20, 5);

    const albanileria = result.categories.find((c) => c.id === "albanileria");
    expect(albanileria!.versionA).toBe(1_500_000);
    expect(albanileria!.versionB).toBe(1_800_000);
    expect(albanileria!.delta).toBe(300_000);
    expect(albanileria!.deltaPercent).toBeCloseTo(20, 5);
  });

  it("computes summary deltas (totalPriceDelta, pricePerM2Delta, totalPricePercentDelta)", () => {
    const a = makeEstimate({ totalPrice: 10_000_000, pricePerM2: 100_000 });
    const b = makeEstimate({ totalPrice: 12_000_000, pricePerM2: 120_000 });

    const result = compareEstimates(a, b);

    expect(result.totalPriceDelta).toBe(2_000_000);
    expect(result.pricePerM2Delta).toBe(20_000);
    expect(result.totalPricePercentDelta).toBeCloseTo(20, 5);
  });

  it("handles categories present in A but not B (versionB=0, delta=-subtotalA)", () => {
    const a = makeEstimate({
      categories: [
        { id: "estructura", name: "Estructura", subtotal: 2_000_000, incidencePercent: 25, lineItems: [] },
        { id: "albanileria", name: "Albañilería", subtotal: 1_500_000, incidencePercent: 18.75, lineItems: [] },
      ],
    });
    const b = makeEstimate({
      categories: [
        { id: "estructura", name: "Estructura", subtotal: 2_200_000, incidencePercent: 25, lineItems: [] },
        // albanileria removed
      ],
    });

    const result = compareEstimates(a, b);

    const albanileria = result.categories.find((c) => c.id === "albanileria");
    expect(albanileria).toBeDefined();
    expect(albanileria!.versionA).toBe(1_500_000);
    expect(albanileria!.versionB).toBe(0);
    expect(albanileria!.delta).toBe(-1_500_000);
  });

  it("handles categories present in B but not A (versionA=0, deltaPercent=0)", () => {
    const a = makeEstimate({
      categories: [
        { id: "estructura", name: "Estructura", subtotal: 2_000_000, incidencePercent: 25, lineItems: [] },
      ],
    });
    const b = makeEstimate({
      categories: [
        { id: "estructura", name: "Estructura", subtotal: 2_200_000, incidencePercent: 25, lineItems: [] },
        { id: "pintura", name: "Pintura", subtotal: 500_000, incidencePercent: 6, lineItems: [] },
      ],
    });

    const result = compareEstimates(a, b);

    const pintura = result.categories.find((c) => c.id === "pintura");
    expect(pintura).toBeDefined();
    expect(pintura!.versionA).toBe(0);
    expect(pintura!.versionB).toBe(500_000);
    expect(pintura!.delta).toBe(500_000);
    expect(pintura!.deltaPercent).toBe(0); // avoid division by zero
  });

  it("returns all zeros for identical estimates", () => {
    const a = makeEstimate();
    const b = makeEstimate();

    const result = compareEstimates(a, b);

    expect(result.totalPriceDelta).toBe(0);
    expect(result.pricePerM2Delta).toBe(0);
    expect(result.totalPricePercentDelta).toBe(0);

    for (const cat of result.categories) {
      expect(cat.delta).toBe(0);
      expect(cat.deltaPercent).toBe(0);
    }
  });

  it("uses category name from B when category only exists in B", () => {
    const a = makeEstimate({ categories: [] });
    const b = makeEstimate({
      categories: [
        { id: "pintura", name: "Pintura", subtotal: 500_000, incidencePercent: 6, lineItems: [] },
      ],
    });

    const result = compareEstimates(a, b);
    const pintura = result.categories.find((c) => c.id === "pintura");
    expect(pintura!.name).toBe("Pintura");
  });

  it("uses category name from A when category only exists in A", () => {
    const a = makeEstimate({
      categories: [
        { id: "albanileria", name: "Albañilería", subtotal: 1_500_000, incidencePercent: 18, lineItems: [] },
      ],
    });
    const b = makeEstimate({ categories: [] });

    const result = compareEstimates(a, b);
    const albanileria = result.categories.find((c) => c.id === "albanileria");
    expect(albanileria!.name).toBe("Albañilería");
  });
});
