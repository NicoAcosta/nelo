import { describe, it, expect, vi, afterEach } from "vitest";
import { processDocument } from "../processor";

// Mock pipelines to isolate router logic
vi.mock("../cad-pipeline", () => ({
  extractFromDxf: vi.fn().mockResolvedValue({
    structuredData: { roomLabels: [], dimensions: [], summary: { layerNames: [], wallSegmentCount: 0, doorCount: 0, windowCount: 0, hasStairs: false, hasFurniture: false } },
    renderedImage: "data:image/png;base64,mock",
    metadata: { originalFileName: "test.dxf", fileType: "dxf", fileSizeBytes: 100 },
  }),
}));

vi.mock("../dwg-converter", () => ({
  convertDwgToDxf: vi.fn().mockResolvedValue("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF"),
}));

vi.mock("../pdf-pipeline", () => ({
  extractFromPdf: vi.fn().mockResolvedValue({
    structuredData: null,
    renderedImage: "data:image/png;base64,mock",
    metadata: { originalFileName: "test.pdf", fileType: "pdf", fileSizeBytes: 100 },
  }),
}));

describe("processDocument", () => {
  it("routes DXF files to CAD pipeline", async () => {
    const { extractFromDxf } = await import("../cad-pipeline");
    await processDocument(new ArrayBuffer(10), "plan.dxf");
    expect(extractFromDxf).toHaveBeenCalled();
  });

  it("routes DWG files through converter then CAD pipeline", async () => {
    const { convertDwgToDxf } = await import("../dwg-converter");
    const { extractFromDxf } = await import("../cad-pipeline");
    await processDocument(new ArrayBuffer(10), "plan.dwg");
    expect(convertDwgToDxf).toHaveBeenCalled();
    expect(extractFromDxf).toHaveBeenCalled();
  });

  it("routes PDF files to PDF pipeline", async () => {
    const { extractFromPdf } = await import("../pdf-pipeline");
    await processDocument(new ArrayBuffer(10), "plan.pdf");
    expect(extractFromPdf).toHaveBeenCalled();
  });

  it("returns passthrough for image files", async () => {
    const buffer = new ArrayBuffer(10);
    const result = await processDocument(buffer, "photo.png");
    expect(result.metadata.fileType).toBe("image");
    expect(result.structuredData).toBeNull();
  });

  it("throws on unsupported file type", async () => {
    await expect(processDocument(new ArrayBuffer(10), "model.rvt")).rejects.toThrow("Unsupported");
  });

  it("throws a timeout error when processing takes longer than 30s", async () => {
    const { extractFromDxf } = await import("../cad-pipeline");
    vi.mocked(extractFromDxf).mockImplementationOnce(
      () => new Promise<never>(() => {}), // never resolves
    );

    vi.useFakeTimers();

    const resultPromise = processDocument(new ArrayBuffer(10), "plan.dxf");

    vi.advanceTimersByTime(30_001);

    await expect(resultPromise).rejects.toThrow("timed out");

    vi.useRealTimers();
  });
});
