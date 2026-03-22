import { describe, it, expect } from "vitest";
import { detectFileType, validateFile, SUPPORTED_EXTENSIONS, FILE_SIZE_LIMITS } from "../validation";

describe("detectFileType", () => {
  it("detects DWG files", () => {
    expect(detectFileType("project.dwg")).toBe("dwg");
    expect(detectFileType("PROJECT.DWG")).toBe("dwg");
  });

  it("detects DXF files", () => {
    expect(detectFileType("floor-plan.dxf")).toBe("dxf");
  });

  it("detects PDF files", () => {
    expect(detectFileType("plan.pdf")).toBe("pdf");
  });

  it("detects image files", () => {
    expect(detectFileType("photo.png")).toBe("image");
    expect(detectFileType("scan.jpg")).toBe("image");
    expect(detectFileType("plan.jpeg")).toBe("image");
    expect(detectFileType("render.webp")).toBe("image");
  });

  it("returns null for unsupported extensions", () => {
    expect(detectFileType("model.rvt")).toBeNull();
    expect(detectFileType("data.xlsx")).toBeNull();
    expect(detectFileType("noext")).toBeNull();
  });
});

describe("validateFile", () => {
  it("accepts a valid DXF file", () => {
    const result = validateFile("plan.dxf", 5 * 1024 * 1024);
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe("dxf");
  });

  it("rejects oversized DWG", () => {
    const result = validateFile("big.dwg", 25 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("rejects oversized image (10MB limit)", () => {
    const result = validateFile("photo.png", 11 * 1024 * 1024);
    expect(result.valid).toBe(false);
  });

  it("accepts image under 10MB", () => {
    const result = validateFile("photo.png", 9 * 1024 * 1024);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported extension", () => {
    const result = validateFile("model.rvt", 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported");
  });
});
