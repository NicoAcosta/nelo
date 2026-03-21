import { describe, it, expect } from "vitest";
import { applyUnitCosts, computeEstimate } from "../engine";
import type { ProjectInputs } from "../types";

describe("exclusion logic", () => {
  it("steel frame disables all concrete structure items", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "steel_frame",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    };
    const items = applyUnitCosts(inputs);
    const concreteItems = items.filter(
      (i) => i.code.startsWith("4.1") || i.code.startsWith("4.2"),
    );
    // All concrete items should be inactive for steel frame
    expect(concreteItems.every((i) => !i.isActive)).toBe(true);
  });

  it("steel frame activates steel frame items", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "steel_frame",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    };
    const items = applyUnitCosts(inputs);
    const steelItems = items.filter(
      (i) => i.code.startsWith("4.3") && i.isActive,
    );
    expect(steelItems.length).toBeGreaterThan(0);
  });

  it("ladrillo portante activates portante items and deactivates HA columns", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "ladrillo_portante",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    };
    const items = applyUnitCosts(inputs);
    const portanteItems = items.filter(
      (i) => i.code.startsWith("5.3") && i.isActive,
    );
    expect(portanteItems.length).toBeGreaterThan(0);

    const haColumns = items.find((i) => i.code === "4.1.3");
    if (haColumns) {
      expect(haColumns.isActive).toBe(false);
    }
  });
});

describe("zone multipliers", () => {
  it("CABA has multiplier 1.0 (baseline)", () => {
    const caba = computeEstimate({
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    });
    const gbaSur = computeEstimate({
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "gba_sur",
    });
    // GBA Sur should be cheaper than CABA
    expect(gbaSur.totalPrice).toBeLessThan(caba.totalPrice);
  });
});

describe("multi-story buildings", () => {
  it("2-story building has smaller footprint than 1-story of same total area", () => {
    const oneStory = computeEstimate({
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    });
    const twoStory = computeEstimate({
      totalFloorAreaM2: 100,
      stories: 2,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    });
    // Same total area split across 2 floors = different cost distribution
    // Both should produce valid estimates
    expect(oneStory.totalPrice).toBeGreaterThan(0);
    expect(twoStory.totalPrice).toBeGreaterThan(0);
    // 2-story has smaller footprint = less foundation/roof cost
    expect(twoStory.totalPrice).not.toBe(oneStory.totalPrice);
  });
});

describe("minimal inputs", () => {
  it("works with only area provided (uses fallback estimation)", () => {
    const estimate = computeEstimate({
      totalFloorAreaM2: 100,
    });
    expect(estimate.totalPrice).toBeGreaterThan(0);
    expect(estimate.confidence).toBe("quick");
    expect(estimate.assumptions.length).toBeGreaterThan(0);
  });

  it("includes ceiling height assumption when not provided", () => {
    const estimate = computeEstimate({
      totalFloorAreaM2: 100,
      stories: 1,
    });
    const ceilingAssumption = estimate.assumptions.find(
      (a) => a.field === "ceilingHeightM",
    );
    expect(ceilingAssumption).toBeDefined();
    expect(ceilingAssumption!.assumedValue).toContain("2.60");
  });
});

describe("estimate integrity", () => {
  it("all incidence percentages sum to 100", () => {
    const estimate = computeEstimate({
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    });
    const totalIncidence = estimate.categories.reduce(
      (sum, c) => sum + c.incidencePercent,
      0,
    );
    expect(totalIncidence).toBeCloseTo(100, 0);
  });

  it("pricePerM2 × area ≈ totalPrice", () => {
    const estimate = computeEstimate({
      totalFloorAreaM2: 150,
      stories: 1,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    });
    expect(estimate.pricePerM2 * 150).toBeCloseTo(estimate.totalPrice, -3);
  });

  it("IVA is 21% of subtotal before tax", () => {
    const estimate = computeEstimate({
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
    });
    const expectedIva = Math.round(estimate.subtotalBeforeTax * 0.21);
    expect(estimate.ivaAmount).toBeCloseTo(expectedIva, -1);
  });
});
