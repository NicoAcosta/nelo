import { describe, it, expect } from "vitest";
import { applyUnitCosts, sumByCategory, computeEstimate, computeConfidence } from "../engine";
import type { ProjectInputs, LineItem } from "../types";

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
});
