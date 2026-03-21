import { describe, it, expect } from "vitest";
import { computeEstimate } from "../engine";
import type { ProjectInputs } from "../types";

const minimalInputs: ProjectInputs = {
  totalFloorAreaM2: 100,
  stories: 1,
  structureType: "hormigon_armado",
};

describe("computeEstimate locale support", () => {
  it("returns English assumption labels when locale is 'en'", () => {
    const estimate = computeEstimate(minimalInputs, "en");
    const ceilingAssumption = estimate.assumptions.find(
      (a) => a.field === "ceilingHeightM",
    );
    expect(ceilingAssumption).toBeDefined();
    expect(ceilingAssumption!.label).toBe("Floor-to-ceiling height");
  });

  it("returns Spanish assumption labels when locale is 'es'", () => {
    const estimate = computeEstimate(minimalInputs, "es");
    const ceilingAssumption = estimate.assumptions.find(
      (a) => a.field === "ceilingHeightM",
    );
    expect(ceilingAssumption).toBeDefined();
    expect(ceilingAssumption!.label).toBe("Altura de piso a techo");
  });

  it("defaults to English labels when no locale passed", () => {
    const estimate = computeEstimate(minimalInputs);
    const ceilingAssumption = estimate.assumptions.find(
      (a) => a.field === "ceilingHeightM",
    );
    expect(ceilingAssumption).toBeDefined();
    expect(ceilingAssumption!.label).toBe("Floor-to-ceiling height");
  });

  it("uses English 'not specified' text when locale is 'en'", () => {
    const estimate = computeEstimate(minimalInputs, "en");
    const doorAssumption = estimate.assumptions.find(
      (a) => a.field === "doorCount",
    );
    expect(doorAssumption).toBeDefined();
    expect(doorAssumption!.assumedValue).toContain("not specified");
  });

  it("uses Spanish 'no especificado' text when locale is 'es'", () => {
    const estimate = computeEstimate(minimalInputs, "es");
    const doorAssumption = estimate.assumptions.find(
      (a) => a.field === "doorCount",
    );
    expect(doorAssumption).toBeDefined();
    expect(doorAssumption!.assumedValue).toContain("no especificado");
  });

  it("uses English category names in sumByCategory when locale is 'en'", () => {
    const estimate = computeEstimate(minimalInputs, "en");
    const hasSomeEnglish = estimate.categories.some(
      (c) => c.name === "Preliminary Work" || c.name === "Earthwork",
    );
    expect(hasSomeEnglish).toBe(true);
  });

  it("uses Spanish category names in sumByCategory when locale is 'es'", () => {
    const estimate = computeEstimate(minimalInputs, "es");
    const hasSomeSpanish = estimate.categories.some(
      (c) =>
        c.name === "Trabajos Preliminares" ||
        c.name === "Movimiento de Suelos",
    );
    expect(hasSomeSpanish).toBe(true);
  });
});
