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

  it("supports greater_than operator", () => {
    const multiStory: ProjectInputs = { ...baseInputs, stories: 2 };
    expect(
      evaluateConditions(
        [{ field: "stories", operator: "greater_than", value: 1 }],
        multiStory,
      ),
    ).toBe(true);
  });

  it("returns false for greater_than when value is equal", () => {
    expect(
      evaluateConditions(
        [{ field: "stories", operator: "greater_than", value: 1 }],
        baseInputs, // stories = 1
      ),
    ).toBe(false);
  });

  it("returns false for greater_than when value is less", () => {
    expect(
      evaluateConditions(
        [{ field: "stories", operator: "greater_than", value: 5 }],
        baseInputs, // stories = 1
      ),
    ).toBe(false);
  });

  it("returns false for greater_than when field is undefined", () => {
    const inputs: ProjectInputs = { totalFloorAreaM2: 100 };
    expect(
      evaluateConditions(
        [{ field: "stories", operator: "greater_than", value: 1 }],
        inputs,
      ),
    ).toBe(false);
  });
});

describe("deriveBaseQuantities smart defaults", () => {
  it("estimates doorCount from floor area when not provided", () => {
    const inputs: ProjectInputs = { totalFloorAreaM2: 120, stories: 1 };
    const q = deriveBaseQuantities(inputs);
    // Math.max(3, Math.round(120 / 15)) = Math.max(3, 8) = 8
    expect(q.doorCount).toBe(8);
  });

  it("estimates windowCount from floor area when not provided", () => {
    const inputs: ProjectInputs = { totalFloorAreaM2: 120, stories: 1 };
    const q = deriveBaseQuantities(inputs);
    // Math.max(2, Math.round(120 / 12)) = Math.max(2, 10) = 10
    expect(q.windowCount).toBe(10);
  });

  it("estimates bathroomCount from floor area when not provided", () => {
    const inputs: ProjectInputs = { totalFloorAreaM2: 120, stories: 1 };
    const q = deriveBaseQuantities(inputs);
    // Math.max(1, Math.round(120 / 50)) = Math.max(1, 2) = 2
    expect(q.bathroomCount).toBe(2);
  });

  it("defaults kitchenCount to 1 when not provided", () => {
    const inputs: ProjectInputs = { totalFloorAreaM2: 120, stories: 1 };
    const q = deriveBaseQuantities(inputs);
    expect(q.kitchenCount).toBe(1);
  });

  it("uses provided counts instead of smart defaults", () => {
    const inputs: ProjectInputs = {
      totalFloorAreaM2: 120,
      stories: 1,
      doorCount: 3,
      windowCount: 4,
      bathroomCount: 1,
      kitchenCount: 2,
    };
    const q = deriveBaseQuantities(inputs);
    expect(q.doorCount).toBe(3);
    expect(q.windowCount).toBe(4);
    expect(q.bathroomCount).toBe(1);
    expect(q.kitchenCount).toBe(2);
  });

  it("applies minimum values for small floor areas", () => {
    const inputs: ProjectInputs = { totalFloorAreaM2: 30, stories: 1 };
    const q = deriveBaseQuantities(inputs);
    // 30/15=2 < 3 → doorCount = 3 (minimum)
    expect(q.doorCount).toBe(3);
    // 30/12=2.5→3 >= 2 → windowCount = 3
    expect(q.windowCount).toBe(3);
    // 30/50=0.6→1 >= 1 → bathroomCount = 1
    expect(q.bathroomCount).toBe(1);
  });
});
