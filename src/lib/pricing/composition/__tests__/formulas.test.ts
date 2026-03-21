/**
 * Composition Formula Engine Tests
 *
 * Verifies that computeUnitCost correctly computes:
 *   unit cost = (labor hours × UOCRA effective rate) + (material qty × retail price × wholesale discount)
 *
 * Per D-03: composition = (labor hours x UOCRA rate) + (material qty x market price)
 * Per D-05: wholesale discount varies by material type (bulk=0.70, standard=0.75, specialty=0.80)
 */

import { describe, it, expect } from "vitest";
import {
  computeUnitCost,
  getWholesaleDiscount,
  type CompositionFormula,
  type WholesaleCategory,
} from "../formulas";

describe("getWholesaleDiscount", () => {
  it("bulk returns 0.70", () => {
    expect(getWholesaleDiscount("bulk")).toBe(0.70);
  });

  it("standard returns 0.75", () => {
    expect(getWholesaleDiscount("standard")).toBe(0.75);
  });

  it("specialty returns 0.80", () => {
    expect(getWholesaleDiscount("specialty")).toBe(0.80);
  });
});

describe("computeUnitCost", () => {
  describe("masonry wall formula", () => {
    const masonryWall: CompositionFormula = {
      itemCode: "5.2.3",
      crewType: "masonry_wall_m2",
      materials: [
        {
          name: "ladrillo hueco DM20",
          quantity: 28,
          retailPricePerUnit: 350,
          wholesaleCategory: "standard" as WholesaleCategory,
        },
      ],
      description: "Muro exterior hueco ceramico DM20",
    };

    it("computes correct labor cost: 1.2h oficial + 0.8h ayudante = 21531", () => {
      // oficial: 11433, ayudante: 9764
      // 1.2 * 11433 + 0.8 * 9764 = 13719.6 + 7811.2 = 21530.8 → 21531
      const result = computeUnitCost(masonryWall);
      expect(result.laborCost).toBe(21531);
    });

    it("computes correct material cost: 28 * 350 * 0.75 = 7350", () => {
      const result = computeUnitCost(masonryWall);
      expect(result.materialCost).toBe(Math.round(28 * 350 * 0.75));
      expect(result.materialCost).toBe(7350);
    });

    it("computes correct total cost: 21531 + 7350 = 28881", () => {
      const result = computeUnitCost(masonryWall);
      expect(result.totalCost).toBe(21531 + 7350);
      expect(result.totalCost).toBe(28881);
    });

    it("returns itemCode from formula", () => {
      const result = computeUnitCost(masonryWall);
      expect(result.itemCode).toBe("5.2.3");
    });

    it("isPlaceholder is false", () => {
      const result = computeUnitCost(masonryWall);
      expect(result.isPlaceholder).toBe(false);
    });

    it("source is 'composition'", () => {
      const result = computeUnitCost(masonryWall);
      expect(result.source).toBe("composition");
    });

    it("has lastUpdated ISO string", () => {
      const result = computeUnitCost(masonryWall);
      expect(result.lastUpdated).toBeTruthy();
      expect(() => new Date(result.lastUpdated)).not.toThrow();
    });
  });

  describe("concrete formula", () => {
    const concrete: CompositionFormula = {
      itemCode: "4.1.1",
      crewType: "concrete_m3",
      materials: [],
      description: "Platea de fundacion",
    };

    it("computes correct labor cost: 3.0h oficial + 4.0h ayudante", () => {
      // 3.0 * 11433 + 4.0 * 9764 = 34299 + 39056 = 73355
      const result = computeUnitCost(concrete);
      expect(result.laborCost).toBe(Math.round(3.0 * 11433 + 4.0 * 9764));
      expect(result.laborCost).toBe(73355);
    });
  });

  describe("labor-only formula (no materials)", () => {
    const laborOnly: CompositionFormula = {
      itemCode: "test.labor.only",
      crewType: { oficialHours: 1.0, ayudanteHours: 0 },
      materials: [],
      description: "Labor only test",
    };

    it("materialCost is 0", () => {
      const result = computeUnitCost(laborOnly);
      expect(result.materialCost).toBe(0);
    });

    it("totalCost equals laborCost", () => {
      const result = computeUnitCost(laborOnly);
      expect(result.totalCost).toBe(result.laborCost);
    });
  });

  describe("inline crew (object instead of string key)", () => {
    const inlineCrew: CompositionFormula = {
      itemCode: "test.inline",
      crewType: { oficialHours: 2.0, ayudanteHours: 1.0 },
      materials: [
        {
          name: "test material",
          quantity: 10,
          retailPricePerUnit: 1000,
          wholesaleCategory: "bulk" as WholesaleCategory,
        },
      ],
      description: "Inline crew test",
    };

    it("uses inline crew hours directly", () => {
      // 2.0 * 11433 + 1.0 * 9764 = 22866 + 9764 = 32630
      const result = computeUnitCost(inlineCrew);
      expect(result.laborCost).toBe(Math.round(2.0 * 11433 + 1.0 * 9764));
    });

    it("applies bulk wholesale discount (0.70)", () => {
      // 10 * 1000 * 0.70 = 7000
      const result = computeUnitCost(inlineCrew);
      expect(result.materialCost).toBe(Math.round(10 * 1000 * 0.70));
      expect(result.materialCost).toBe(7000);
    });
  });

  describe("specialty material discount", () => {
    const specialtyFormula: CompositionFormula = {
      itemCode: "test.specialty",
      crewType: { oficialHours: 0, ayudanteHours: 0 },
      materials: [
        {
          name: "specialty item",
          quantity: 5,
          retailPricePerUnit: 2000,
          wholesaleCategory: "specialty" as WholesaleCategory,
        },
      ],
      description: "Specialty discount test",
    };

    it("applies specialty wholesale discount (0.80)", () => {
      // 5 * 2000 * 0.80 = 8000
      const result = computeUnitCost(specialtyFormula);
      expect(result.materialCost).toBe(Math.round(5 * 2000 * 0.80));
      expect(result.materialCost).toBe(8000);
    });
  });

  describe("multi-material formula", () => {
    const multiMaterial: CompositionFormula = {
      itemCode: "test.multi",
      crewType: { oficialHours: 0, ayudanteHours: 0 },
      materials: [
        { name: "mat1", quantity: 10, retailPricePerUnit: 100, wholesaleCategory: "standard" as WholesaleCategory },
        { name: "mat2", quantity: 5, retailPricePerUnit: 200, wholesaleCategory: "bulk" as WholesaleCategory },
      ],
      description: "Multi-material test",
    };

    it("sums all material costs", () => {
      // mat1: 10 * 100 * 0.75 = 750
      // mat2: 5 * 200 * 0.70 = 700
      // total: 750 + 700 = 1450
      const result = computeUnitCost(multiMaterial);
      expect(result.materialCost).toBe(
        Math.round(10 * 100 * 0.75) + Math.round(5 * 200 * 0.70),
      );
      expect(result.materialCost).toBe(1450);
    });
  });
});
