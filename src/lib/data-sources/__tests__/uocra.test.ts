/**
 * UOCRA Wage Scale Tests
 *
 * Verifies that UOCRA rates include zone supplement in the effective rate
 * calculation: effectiveHourlyRate = Math.round((base + zoneSupplement) * 2.2)
 *
 * Data source: UOCRA paritaria Feb-Mar 2026 via construar.com.ar
 */

import { describe, it, expect } from "vitest";
import {
  getEffectiveRate,
  calculateLaborCost,
  UOCRA_RATES,
  type LaborRate,
} from "../uocra";

describe("UOCRA_RATES", () => {
  it("each rate has zoneSupplementHourly field", () => {
    for (const rate of UOCRA_RATES) {
      expect((rate as LaborRate & { zoneSupplementHourly: number }).zoneSupplementHourly).toBeDefined();
      expect(typeof (rate as LaborRate & { zoneSupplementHourly: number }).zoneSupplementHourly).toBe("number");
    }
  });

  it("each rate source contains 'construar' or 'UOCRA paritaria'", () => {
    for (const rate of UOCRA_RATES) {
      expect(rate.source).toMatch(/construar|UOCRA paritaria/i);
    }
  });

  it("validFrom is 2026-02-01", () => {
    for (const rate of UOCRA_RATES) {
      expect(rate.validFrom).toBe("2026-02-01");
    }
  });
});

describe("getEffectiveRate", () => {
  it("oficial_especializado: (5470 + 602) * 2.2 = 13358", () => {
    expect(getEffectiveRate("oficial_especializado")).toBe(
      Math.round((5470 + 602) * 2.2),
    );
    expect(getEffectiveRate("oficial_especializado")).toBe(13358);
  });

  it("oficial: (4679 + 518) * 2.2 = 11433", () => {
    expect(getEffectiveRate("oficial")).toBe(Math.round((4679 + 518) * 2.2));
    expect(getEffectiveRate("oficial")).toBe(11433);
  });

  it("medio_oficial: (4324 + 469) * 2.2 = 10545", () => {
    expect(getEffectiveRate("medio_oficial")).toBe(
      Math.round((4324 + 469) * 2.2),
    );
    expect(getEffectiveRate("medio_oficial")).toBe(10545);
  });

  it("ayudante: (3980 + 458) * 2.2 = 9764", () => {
    expect(getEffectiveRate("ayudante")).toBe(Math.round((3980 + 458) * 2.2));
    expect(getEffectiveRate("ayudante")).toBe(9764);
  });
});

describe("calculateLaborCost", () => {
  it("1.2h oficial + 0.8h ayudante = masonry wall labor per m2", () => {
    // 1.2 * 11433 + 0.8 * 9764 = 13719.6 + 7811.2 = 21530.8 → 21531
    expect(calculateLaborCost(1.2, 0.8)).toBe(
      Math.round(1.2 * 11433 + 0.8 * 9764),
    );
    expect(calculateLaborCost(1.2, 0.8)).toBe(21531);
  });

  it("returns 0 for 0 hours", () => {
    expect(calculateLaborCost(0, 0)).toBe(0);
  });

  it("supports official-only labor", () => {
    expect(calculateLaborCost(1.0, 0)).toBe(11433);
  });

  it("supports ayudante-only labor", () => {
    expect(calculateLaborCost(0, 1.0)).toBe(9764);
  });
});
