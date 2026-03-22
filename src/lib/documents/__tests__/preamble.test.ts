import { describe, it, expect } from "vitest";
import { buildPreamble } from "../preamble";
import type { DocumentAnalysis } from "../types";

const mockAnalysis: DocumentAnalysis = {
  structuredData: {
    roomLabels: [
      { name: "Living Room", areaM2: 45.2 },
      { name: "Kitchen", areaM2: 12.8 },
      { name: "Bedroom 1", areaM2: 18.5 },
    ],
    dimensions: [
      { value: 3.5, unit: "m", label: "Wall A" },
      { value: 8.5, unit: "m", label: "Wall B" },
    ],
    summary: {
      layerNames: ["A-WALL", "A-DOOR", "A-GLAZ", "A-TEXT"],
      wallSegmentCount: 12,
      doorCount: 3,
      windowCount: 5,
      hasStairs: false,
      hasFurniture: true,
    },
  },
  renderedImage: "data:image/png;base64,abc",
  metadata: {
    originalFileName: "project.dwg",
    fileType: "dwg",
    fileSizeBytes: 5000000,
    layerCount: 4,
    conversionPath: "DWG → DXF → SVG → PNG",
  },
};

describe("buildPreamble", () => {
  it("includes room labels with areas", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("Living Room");
    expect(preamble).toContain("45.2");
    expect(preamble).toContain("Kitchen");
  });

  it("includes dimension count and range", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("2 measurements");
    expect(preamble).toContain("3.5");
    expect(preamble).toContain("8.5");
  });

  it("includes element counts", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("3 doors");
    expect(preamble).toContain("5 windows");
  });

  it("includes file name and layer count", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("project.dwg");
    expect(preamble).toContain("4 layers");
  });

  it("instructs Claude to use exact measurements", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("exact measurements");
  });

  it("returns empty string when structuredData is null", () => {
    const imageOnly: DocumentAnalysis = {
      ...mockAnalysis,
      structuredData: null,
      metadata: { ...mockAnalysis.metadata, fileType: "image" },
    };
    const preamble = buildPreamble(imageOnly);
    expect(preamble).toBe("");
  });

  it("adds degradation note when specified", () => {
    const preamble = buildPreamble(mockAnalysis, { degraded: true });
    expect(preamble).toContain("visual inspection only");
  });

  it("includes staircase in elements when hasStairs is true", () => {
    const withStairs: DocumentAnalysis = {
      ...mockAnalysis,
      structuredData: {
        ...mockAnalysis.structuredData!,
        summary: {
          ...mockAnalysis.structuredData!.summary,
          hasStairs: true,
        },
      },
    };
    const preamble = buildPreamble(withStairs);
    expect(preamble).toContain("staircase");
  });

  it("shows a single value instead of a range when min equals max", () => {
    const singleDimension: DocumentAnalysis = {
      ...mockAnalysis,
      structuredData: {
        ...mockAnalysis.structuredData!,
        dimensions: [{ value: 5.0, unit: "m", label: "Wall A" }],
      },
    };
    const preamble = buildPreamble(singleDimension);
    expect(preamble).toContain("5");
    expect(preamble).not.toContain("5 –");
    expect(preamble).not.toContain("– 5");
  });

  it("shows room name without parenthetical when areaM2 is absent", () => {
    const noAreaRooms: DocumentAnalysis = {
      ...mockAnalysis,
      structuredData: {
        ...mockAnalysis.structuredData!,
        roomLabels: [{ name: "Storage" }],
      },
    };
    const preamble = buildPreamble(noAreaRooms);
    expect(preamble).toContain("Storage");
    expect(preamble).not.toContain("Storage (");
  });

  it("omits rooms, dimensions, and elements lines when all are empty", () => {
    const empty: DocumentAnalysis = {
      ...mockAnalysis,
      structuredData: {
        roomLabels: [],
        dimensions: [],
        summary: {
          layerNames: [],
          wallSegmentCount: 0,
          doorCount: 0,
          windowCount: 0,
          hasStairs: false,
          hasFurniture: false,
        },
      },
    };
    const preamble = buildPreamble(empty);
    expect(preamble).not.toContain("Rooms found");
    expect(preamble).not.toContain("Dimensions");
    expect(preamble).not.toContain("Elements");
    expect(preamble).not.toContain("Layers");
  });
});
