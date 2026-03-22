import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { extractFromDxf } from "../cad-pipeline";

const fixturesDir = join(__dirname, "../__fixtures__");

describe("extractFromDxf", () => {
  it("extracts room labels from TEXT entities", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData).not.toBeNull();
    const labels = result.structuredData!.roomLabels;
    expect(labels.length).toBeGreaterThan(0);
    // Should find "Living Room", "Bedroom", and "Kitchen" (from MTEXT)
    const names = labels.map((l) => l.name);
    expect(names).toContain("Living Room");
    expect(names).toContain("Bedroom");
    expect(names).toContain("Kitchen");
  });

  it("extracts area from TEXT entities with m2 patterns", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    const labels = result.structuredData!.roomLabels;
    const livingRoom = labels.find((l) => l.name === "Living Room");
    expect(livingRoom).toBeDefined();
    expect(livingRoom!.areaM2).toBe(45.2);

    const bedroom = labels.find((l) => l.name === "Bedroom");
    expect(bedroom).toBeDefined();
    expect(bedroom!.areaM2).toBe(22.5);
  });

  it("extracts area from MTEXT entities with combined label and area", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    const labels = result.structuredData!.roomLabels;
    const kitchen = labels.find((l) => l.name === "Kitchen");
    expect(kitchen).toBeDefined();
    expect(kitchen!.areaM2).toBe(18.0);
  });

  it("extracts dimensions from DIMENSION entities", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData!.dimensions.length).toBeGreaterThan(0);
  });

  it("counts wall segments from LINE/LWPOLYLINE on wall layers", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    // 5 LINE entities + 1 LWPOLYLINE on WALLS layer
    expect(result.structuredData!.summary.wallSegmentCount).toBe(6);
  });

  it("counts doors from INSERT blocks matching door patterns", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    // DOOR_SINGLE and PUERTA_DOBLE
    expect(result.structuredData!.summary.doorCount).toBe(2);
  });

  it("counts windows from INSERT blocks matching window patterns", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    // WINDOW_1200 and VENTANA_600
    expect(result.structuredData!.summary.windowCount).toBe(2);
  });

  it("populates layer names in summary", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    const layerNames = result.structuredData!.summary.layerNames;
    expect(layerNames.length).toBeGreaterThan(0);
    expect(layerNames).toContain("WALLS");
    expect(layerNames).toContain("DOORS");
    expect(layerNames).toContain("WINDOWS");
  });

  it("detects stairs and furniture from layer names", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData!.summary.hasStairs).toBe(true);
    expect(result.structuredData!.summary.hasFurniture).toBe(true);
  });

  it("produces a rendered image as base64 data URL", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    expect(result.renderedImage).toMatch(/^data:image\/png;base64,/);
  });

  it("handles empty DXF without crashing", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "empty.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData).not.toBeNull();
    expect(result.structuredData!.roomLabels).toEqual([]);
    expect(result.structuredData!.dimensions).toEqual([]);
    expect(result.structuredData!.summary.wallSegmentCount).toBe(0);
    expect(result.structuredData!.summary.doorCount).toBe(0);
    expect(result.structuredData!.summary.windowCount).toBe(0);
  });

  it("handles DXF with no dimensions gracefully", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "no-dimensions.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData!.dimensions).toEqual([]);
    expect(result.structuredData!.roomLabels.length).toBeGreaterThan(0);
    const names = result.structuredData!.roomLabels.map((l) => l.name);
    expect(names).toContain("Bathroom");
  });

  it("returns correct metadata shape", async () => {
    const dxfContent = readFileSync(
      join(fixturesDir, "simple-apartment.dxf"),
      "utf-8",
    );
    const result = await extractFromDxf(dxfContent);
    expect(result.metadata.fileType).toBe("dxf");
    expect(result.metadata.layerCount).toBeGreaterThan(0);
  });
});
