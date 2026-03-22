import { describe, it, expect } from "vitest";
import { extractedDataSchema, documentAnalysisSchema } from "../types";

describe("extractedDataSchema", () => {
  it("accepts valid extracted data", () => {
    const data = {
      roomLabels: [{ name: "Living Room", areaM2: 45.2 }],
      dimensions: [{ value: 3.5, unit: "m", label: "Wall A" }],
      summary: {
        layerNames: ["A-WALL", "A-DOOR"],
        wallSegmentCount: 12,
        doorCount: 3,
        windowCount: 4,
        hasStairs: false,
        hasFurniture: true,
      },
    };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects missing summary fields", () => {
    const data = {
      roomLabels: [],
      dimensions: [],
      summary: { layerNames: [] },
    };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("documentAnalysisSchema", () => {
  it("accepts null structuredData for images", () => {
    const data = {
      structuredData: null,
      renderedImage: "data:image/png;base64,abc",
      metadata: {
        originalFileName: "photo.jpg",
        fileType: "image",
        fileSizeBytes: 1024,
      },
    };
    const result = documentAnalysisSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid fileType", () => {
    const data = {
      structuredData: null,
      renderedImage: "data:image/png;base64,abc",
      metadata: {
        originalFileName: "file.xyz",
        fileType: "xyz",
        fileSizeBytes: 1024,
      },
    };
    const result = documentAnalysisSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
