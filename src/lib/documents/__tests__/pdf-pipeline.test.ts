import { describe, it, expect, vi } from "vitest";

// Mock pdfjs-dist — the actual module requires specific Node.js setup
vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: "Living Room", transform: [1, 0, 0, 1, 100, 500] },
            { str: "45.2 m2", transform: [1, 0, 0, 1, 100, 480] },
            { str: "3.50", transform: [1, 0, 0, 1, 200, 300] },
          ],
        }),
      }),
    }),
  }),
}));

import { extractFromPdf } from "../pdf-pipeline";

describe("extractFromPdf", () => {
  it("returns a DocumentAnalysis with metadata", async () => {
    const buffer = new ArrayBuffer(100);
    const result = await extractFromPdf(buffer, "plan.pdf");
    expect(result.metadata.fileType).toBe("pdf");
    expect(result.metadata.originalFileName).toBe("plan.pdf");
    expect(result.metadata.pageCount).toBe(1);
  });

  it("extracts text content from PDF pages", async () => {
    const buffer = new ArrayBuffer(100);
    const result = await extractFromPdf(buffer, "plan.pdf");
    expect(result.structuredData).not.toBeNull();
    if (result.structuredData) {
      expect(result.structuredData.roomLabels.length).toBeGreaterThan(0);
    }
  });

  it("returns valid structure even with empty text", async () => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({ items: [] }),
        }),
      }),
    });
    const buffer = new ArrayBuffer(100);
    const result = await extractFromPdf(buffer, "empty.pdf");
    expect(result.metadata.fileType).toBe("pdf");
  });
});
