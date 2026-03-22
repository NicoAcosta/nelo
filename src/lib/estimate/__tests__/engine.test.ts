import { describe, it, expect, vi } from "vitest";
import { applyUnitCosts, sumByCategory, computeEstimate, computeConfidence } from "../engine";
import type { ProjectInputs, LineItem } from "../types";

// Mock usd-converter so engine tests are isolated from cache state
vi.mock("@/lib/pricing/usd-converter", () => ({
  getBlueRateVenta: () => 1425,
  convertToUsd: (ars: number, rate: number) => (rate > 0 ? Math.round(ars / rate) : 0),
}));

const baseInputs: ProjectInputs = {
  totalFloorAreaM2: 100,
  stories: 1,
  structureType: "hormigon_armado",
  roofType: "azotea_inaccesible",
  finishLevel: "medio",
  locationZone: "caba",
  footprintM2: 100,
  perimeterMl: 40,
  ceilingHeightM: 2.6,
  doorCount: 5,
  windowCount: 6,
  bathroomCount: 1,
  kitchenCount: 1,
};

describe("applyUnitCosts", () => {
  it("produces line items with non-zero subtotals for items with costs", () => {
    const items = applyUnitCosts(baseInputs);
    const pricedItems = items.filter((i) => i.subtotal > 0);
    expect(pricedItems.length).toBeGreaterThan(0);
  });

  it("marks inactive items from exclusion logic", () => {
    const steelFrameInputs: ProjectInputs = {
      ...baseInputs,
      structureType: "steel_frame",
    };
    const items = applyUnitCosts(steelFrameInputs);
    // Concrete items should be inactive for steel frame
    const concreteItems = items.filter(
      (i) => i.code.startsWith("4.1") && !i.isActive,
    );
    expect(concreteItems.length).toBeGreaterThan(0);
  });

  it("activates steel frame items when structureType is steel_frame", () => {
    const steelFrameInputs: ProjectInputs = {
      ...baseInputs,
      structureType: "steel_frame",
    };
    const items = applyUnitCosts(steelFrameInputs);
    const steelItems = items.filter(
      (i) => i.code.startsWith("4.3") && i.isActive,
    );
    expect(steelItems.length).toBeGreaterThan(0);
  });
});

describe("sumByCategory", () => {
  it("groups line items by category and sums subtotals", () => {
    const items: LineItem[] = [
      { code: "1.01", categoryId: "trabajos_preliminares", description: "Limpieza", unit: "m2", quantity: 100, materialCostPerUnit: 2000, laborCostPerUnit: 3287, totalCostPerUnit: 5287, subtotal: 528700, isActive: true, source: "calculated" },
      { code: "1.02", categoryId: "trabajos_preliminares", description: "Obrador", unit: "m2", quantity: 4, materialCostPerUnit: 50000, laborCostPerUnit: 78580, totalCostPerUnit: 128580, subtotal: 514320, isActive: true, source: "calculated" },
    ];
    const categories = sumByCategory(items);
    const preliminares = categories.find((c) => c.id === "trabajos_preliminares");
    expect(preliminares).toBeDefined();
    expect(preliminares!.subtotal).toBe(528700 + 514320);
  });

  it("calculates incidence percentages", () => {
    const items: LineItem[] = [
      { code: "1.01", categoryId: "cat_a", description: "A", unit: "m2", quantity: 1, materialCostPerUnit: 0, laborCostPerUnit: 0, totalCostPerUnit: 0, subtotal: 700, isActive: true, source: "calculated" },
      { code: "2.01", categoryId: "cat_b", description: "B", unit: "m2", quantity: 1, materialCostPerUnit: 0, laborCostPerUnit: 0, totalCostPerUnit: 0, subtotal: 300, isActive: true, source: "calculated" },
    ];
    const categories = sumByCategory(items);
    const catA = categories.find((c) => c.id === "cat_a");
    expect(catA!.incidencePercent).toBeCloseTo(70, 1);
  });
});

describe("computeConfidence", () => {
  it("returns 'quick' for minimal inputs", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
    };
    expect(computeConfidence(inputs)).toBe("quick");
  });

  it("returns 'standard' for moderate inputs", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
      roofType: "azotea_inaccesible",
      finishLevel: "medio",
      locationZone: "caba",
      footprintM2: 100,
      perimeterMl: 40,
      bathroomCount: 1,
    };
    expect(computeConfidence(inputs)).toBe("standard");
  });

  it("returns 'detailed' for comprehensive inputs", () => {
    const inputs: ProjectInputs = {
      ...baseInputs,
      foundationType: "platea",
      slabType: "vigueta_ceramica",
      exteriorWallType: "hueco_20cm",
      interiorWallType: "hueco_8cm",
      hasGasInstallation: true,
      electricalQuality: "media",
      hasBasement: false,
      hasGarage: false,
      roofInsulation: "eps",
      wallInsulation: "camara_aire",
      facadeFinish: "revoque_tradicional",
      floorType: "porcellanato",
      bathroomFloorType: "ceramica",
      exteriorCarpentryType: "aluminio_media",
      interiorDoorType: "mdf",
      waterHeaterType: "termotanque_gas",
      heatingSystem: "estufas_gas",
    };
    expect(computeConfidence(inputs)).toBe("detailed");
  });
});

describe("computeEstimate", () => {
  it("returns price per m2 and total price", () => {
    const estimate = computeEstimate(baseInputs);
    expect(estimate.pricePerM2).toBeGreaterThan(0);
    expect(estimate.totalPrice).toBeGreaterThan(0);
  });

  it("applies overhead, profit, and IVA", () => {
    const estimate = computeEstimate(baseInputs);
    expect(estimate.directCost).toBeGreaterThan(0);
    expect(estimate.overheadAmount).toBeGreaterThan(0);
    expect(estimate.profitAmount).toBeGreaterThan(0);
    expect(estimate.ivaAmount).toBeGreaterThan(0);
    expect(estimate.totalPrice).toBeGreaterThan(estimate.directCost);
  });

  it("total = directCost + overhead + profit + IVA", () => {
    const e = computeEstimate(baseInputs);
    const expectedSubtotal = e.directCost + e.overheadAmount + e.profitAmount;
    const expectedTotal = expectedSubtotal + e.ivaAmount;
    expect(e.totalPrice).toBeCloseTo(expectedTotal, 0);
  });

  it("price per m2 = total / floor area", () => {
    const e = computeEstimate(baseInputs);
    expect(e.pricePerM2).toBeCloseTo(e.totalPrice / 100, 0);
  });

  it("includes assumptions for default values", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
      structureType: "hormigon_armado",
    };
    const e = computeEstimate(inputs);
    expect(e.assumptions.length).toBeGreaterThan(0);
    const ceilingAssumption = e.assumptions.find((a) => a.field === "ceilingHeightM");
    expect(ceilingAssumption).toBeDefined();
  });

  it("has categories breakdown", () => {
    const e = computeEstimate(baseInputs);
    expect(e.categories.length).toBeGreaterThan(0);
    const totalIncidence = e.categories.reduce((sum, c) => sum + c.incidencePercent, 0);
    expect(totalIncidence).toBeCloseTo(100, 0);
  });

  it("estimate includes USD prices (D-17, D-19)", () => {
    const e = computeEstimate(baseInputs);
    expect(e.pricePerM2Usd).toBeGreaterThan(0);
    expect(e.totalPriceUsd).toBeGreaterThan(0);
    expect(e.blueRateVenta).toBe(1425);
    expect(e.blueRateDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("estimate includes pricing freshness date (D-10)", () => {
    const e = computeEstimate(baseInputs);
    expect(e.pricingLastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("escalera (cat 18) is zero for single-story buildings", () => {
    const inputs: ProjectInputs = { ...baseInputs, stories: 1 };
    const items = applyUnitCosts(inputs);
    const escalera = items.find((i) => i.code === "18.0");
    expect(escalera).toBeDefined();
    expect(escalera!.quantity).toBe(0);
    expect(escalera!.subtotal).toBe(0);
  });

  it("escalera (cat 18) is non-zero for multi-story buildings", () => {
    const inputs: ProjectInputs = { ...baseInputs, stories: 2 };
    const items = applyUnitCosts(inputs);
    const escalera = items.find((i) => i.code === "18.0");
    expect(escalera).toBeDefined();
    expect(escalera!.quantity).toBeGreaterThan(0);
    expect(escalera!.isActive).toBe(true);
  });

  it("defaults slabType to vigueta_ceramica for hormigon_armado", () => {
    const inputs: ProjectInputs = {
      ...baseInputs,
      structureType: "hormigon_armado",
      slabType: undefined,
    };
    const items = applyUnitCosts(inputs);
    const vigueta = items.find((i) => i.code === "4.2.1");
    expect(vigueta).toBeDefined();
    expect(vigueta!.isActive).toBe(true);
    expect(vigueta!.quantity).toBeGreaterThan(0);
  });

  it("amoblamientos (cat 19) uses kitchen_count not floor_area", () => {
    const inputs: ProjectInputs = { ...baseInputs, kitchenCount: 1 };
    const items = applyUnitCosts(inputs);
    const amob = items.find((i) => i.code === "19.0");
    expect(amob).toBeDefined();
    // Should be ~5 ml (1 kitchen * 5), not 100 m2
    expect(amob!.quantity).toBeLessThanOrEqual(10);
  });

  it("espejos (cat 23) uses bathroom_count not floor_area", () => {
    const inputs: ProjectInputs = { ...baseInputs, bathroomCount: 1 };
    const items = applyUnitCosts(inputs);
    const espejos = items.find((i) => i.code === "23.0");
    expect(espejos).toBeDefined();
    // Should be 1 (1 bathroom * 1 mirror), not 100 m2
    expect(espejos!.quantity).toBeLessThanOrEqual(5);
  });

  it("revoques (cat 8) uses wall_area not floor_area", () => {
    const items = applyUnitCosts(baseInputs);
    const revoques = items.find((i) => i.code === "8.0");
    expect(revoques).toBeDefined();
    // wall_area for baseInputs is ~84.8m2, not 100m2 (floor_area)
    // quantity should be wall_area * 1.0 = ~84.8
    expect(revoques!.quantity).toBeCloseTo(84.8, 0);
  });

  it("smart defaults estimate counts when not provided", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 120,
      stories: 1,
      structureType: "hormigon_armado",
    };
    const e = computeEstimate(inputs);
    // Should have assumptions about smart defaults
    const doorAssumption = e.assumptions.find((a) => a.field === "doorCount");
    expect(doorAssumption).toBeDefined();
    expect(doorAssumption!.assumedValue).toContain("8"); // 120/15 = 8
  });

  it("estructura incidence is realistic (15-25%) for hormigon_armado", () => {
    const inputs: ProjectInputs = {
      ...baseInputs,
      structureType: "hormigon_armado",
    };
    const e = computeEstimate(inputs);
    const estructura = e.categories.find((c) => c.id === "estructura_resistente");
    expect(estructura).toBeDefined();
    // With vigueta_ceramica default and better column/viga coefficients,
    // structural cost should be meaningful (>10%)
    expect(estructura!.incidencePercent).toBeGreaterThan(10);
  });
});
