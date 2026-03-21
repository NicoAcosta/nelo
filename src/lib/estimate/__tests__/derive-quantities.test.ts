import { describe, it, expect } from "vitest";
import { deriveBaseQuantities, evaluateConditions } from "../derive-quantities";
import type { ProjectInputs } from "../types";

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

describe("deriveBaseQuantities", () => {
  it("calculates wall area subtracting openings", () => {
    const q = deriveBaseQuantities(baseInputs);
    // wall_area = perimeter(40) × ceilingHeight(2.6) × stories(1) = 104m²
    // door openings = 5 × (0.80 × 2.10) = 8.4m²
    // window openings = 6 × (1.20 × 1.50) = 10.8m²
    // net wall area = 104 - 8.4 - 10.8 = 84.8m²
    expect(q.wallAreaM2).toBeCloseTo(84.8, 1);
  });

  it("uses footprint for roof area", () => {
    const q = deriveBaseQuantities(baseInputs);
    expect(q.roofAreaM2).toBe(100);
  });

  it("derives footprint from total area and stories when not provided", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 200,
      stories: 2,
      ceilingHeightM: 2.6,
    };
    const q = deriveBaseQuantities(inputs);
    expect(q.footprintM2).toBe(100); // 200 / 2
  });

  it("estimates perimeter from footprint when not provided", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
      footprintM2: 100,
      ceilingHeightM: 2.6,
    };
    const q = deriveBaseQuantities(inputs);
    // sqrt(100) = 10 → assumed rectangular 10×10 → perimeter = 40
    expect(q.perimeterMl).toBe(40);
  });

  it("defaults ceiling height to 2.60m", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 100,
      stories: 1,
    };
    const q = deriveBaseQuantities(inputs);
    expect(q.ceilingHeightM).toBe(2.6);
  });

  it("handles multi-story wall area", () => {
    const inputs: ProjectInputs = {
      ...baseInputs,
      totalFloorAreaM2: 200,
      stories: 2,
      footprintM2: 100,
      perimeterMl: 40,
    };
    const q = deriveBaseQuantities(inputs);
    // wall_area = 40 × 2.6 × 2 = 208
    // doors = 5 × 1.68 = 8.4, windows = 6 × 1.80 = 10.8
    // net = 208 - 8.4 - 10.8 = 188.8
    expect(q.wallAreaM2).toBeCloseTo(188.8, 1);
  });
});

describe("evaluateConditions", () => {
  it("returns true when condition field equals value", () => {
    expect(
      evaluateConditions(
        [{ field: "structureType", operator: "equals", value: "hormigon_armado" }],
        baseInputs,
      ),
    ).toBe(true);
  });

  it("returns false when condition field does not equal value", () => {
    expect(
      evaluateConditions(
        [{ field: "structureType", operator: "equals", value: "steel_frame" }],
        baseInputs,
      ),
    ).toBe(false);
  });

  it("returns true when field exists", () => {
    expect(
      evaluateConditions(
        [{ field: "bathroomCount", operator: "exists" }],
        baseInputs,
      ),
    ).toBe(true);
  });

  it("returns true when field does not exist", () => {
    expect(
      evaluateConditions(
        [{ field: "hasPool", operator: "not_exists" }],
        baseInputs,
      ),
    ).toBe(true);
  });

  it("returns true when no conditions", () => {
    expect(evaluateConditions([], baseInputs)).toBe(true);
    expect(evaluateConditions(undefined, baseInputs)).toBe(true);
  });
});
