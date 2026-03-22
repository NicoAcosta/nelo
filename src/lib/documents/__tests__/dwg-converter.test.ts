import { describe, it, expect } from "vitest";
import { convertDwgToDxf } from "../dwg-converter";

describe("convertDwgToDxf", () => {
  it("throws on corrupt/invalid buffer", async () => {
    await expect(convertDwgToDxf(new ArrayBuffer(10))).rejects.toThrow(
      /DWG|corrupt|unsupported|invalid|parse/i,
    );
  });

  it("throws on zero-length buffer", async () => {
    await expect(convertDwgToDxf(new ArrayBuffer(0))).rejects.toThrow();
  });
});
