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

  it("detects standalone dimension values like '3.50'", async () => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: "3.50", transform: [1, 0, 0, 1, 200, 300] },
              { str: "4,20", transform: [1, 0, 0, 1, 250, 300] },
            ],
          }),
        }),
      }),
    });
    const buffer = new ArrayBuffer(100);
    const result = await extractFromPdf(buffer, "dims.pdf");
    expect(result.structuredData).not.toBeNull();
    const dims = result.structuredData!.dimensions;
    expect(dims.length).toBe(2);
    expect(dims[0].value).toBe(3.5);
    expect(dims[0].unit).toBe("m");
    expect(dims[1].value).toBe(4.2);
  });

  it("detects Spanish room keywords as room labels", async () => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: "Cocina", transform: [1, 0, 0, 1, 100, 400] },
              { str: "Dormitorio", transform: [1, 0, 0, 1, 200, 400] },
              { str: "Baño", transform: [1, 0, 0, 1, 300, 400] },
            ],
          }),
        }),
      }),
    });
    const buffer = new ArrayBuffer(100);
    const result = await extractFromPdf(buffer, "spanish.pdf");
    const roomNames = result.structuredData!.roomLabels.map((r) => r.name);
    expect(roomNames).toContain("Cocina");
    expect(roomNames).toContain("Dormitorio");
    expect(roomNames).toContain("Baño");
  });

  it("parses combined room+area text like 'Kitchen 18.0 m2'", async () => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: "Kitchen 18.0 m2", transform: [1, 0, 0, 1, 100, 500] },
            ],
          }),
        }),
      }),
    });
    const buffer = new ArrayBuffer(100);
    const result = await extractFromPdf(buffer, "combined.pdf");
    const rooms = result.structuredData!.roomLabels;
    expect(rooms.length).toBe(1);
    expect(rooms[0].name).toBe("Kitchen");
    expect(rooms[0].areaM2).toBe(18.0);
  });

  it("calls getPage for each page in a multi-page PDF", async () => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const getPageMock = vi.fn().mockResolvedValue({
      getTextContent: vi.fn().mockResolvedValue({ items: [] }),
    });
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 2,
        getPage: getPageMock,
      }),
    });
    const buffer = new ArrayBuffer(100);
    await extractFromPdf(buffer, "multipage.pdf");
    expect(getPageMock).toHaveBeenCalledTimes(2);
    expect(getPageMock).toHaveBeenCalledWith(1);
    expect(getPageMock).toHaveBeenCalledWith(2);
  });

  it("parses area annotations with comma decimals like '45,2 m²'", async () => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: "Living", transform: [1, 0, 0, 1, 100, 500] },
              { str: "45,2 m²", transform: [1, 0, 0, 1, 110, 490] },
            ],
          }),
        }),
      }),
    });
    const buffer = new ArrayBuffer(100);
    const result = await extractFromPdf(buffer, "comma.pdf");
    const rooms = result.structuredData!.roomLabels;
    expect(rooms.length).toBe(1);
    expect(rooms[0].areaM2).toBe(45.2);
  });
});
