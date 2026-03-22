import { describe, it, expect } from "vitest";
import { convertDwgToDxf } from "../dwg-converter";

describe("convertDwgToDxf", () => {
  it("throws a descriptive error indicating DWG is not yet supported", async () => {
    await expect(convertDwgToDxf(new ArrayBuffer(10))).rejects.toThrow(
      "DWG conversion failed",
    );
  });

  it("suggests exporting as DXF in the error message", async () => {
    await expect(convertDwgToDxf(new ArrayBuffer(10))).rejects.toThrow(
      "export your file as DXF",
    );
  });
});
