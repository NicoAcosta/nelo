import { describe, it, expect, vi } from "vitest";

// Mock the WASM module — actual WASM binary won't load in Vitest
vi.mock("@mlightcad/libredwg-converter", () => ({
  convert: vi.fn().mockResolvedValue("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF"),
}));

import { convertDwgToDxf } from "../dwg-converter";

describe("convertDwgToDxf", () => {
  it("returns a DXF string from a buffer", async () => {
    const buffer = new ArrayBuffer(100);
    const result = await convertDwgToDxf(buffer);
    expect(typeof result).toBe("string");
    expect(result).toContain("SECTION");
    expect(result).toContain("EOF");
  });

  it("throws a descriptive error on conversion failure", async () => {
    const { convert } = await import("@mlightcad/libredwg-converter");
    (convert as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Unsupported DWG version"));
    await expect(convertDwgToDxf(new ArrayBuffer(10))).rejects.toThrow("DWG conversion failed");
  });
});
