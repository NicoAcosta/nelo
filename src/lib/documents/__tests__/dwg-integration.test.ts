import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";

const DWG_PATH = "/tmp/test-sample.dwg";

describe.skipIf(!existsSync(DWG_PATH))("DWG integration", () => {
  it("converts a real DWG file to DXF via processDocument", async () => {
    const { processDocument } = await import("../processor");
    const buffer = readFileSync(DWG_PATH);

    const result = await processDocument(buffer.buffer, "test-sample.dwg");

    expect(result.metadata.fileType).toBe("dwg");
    expect(result.metadata.conversionPath).toBe("DWG → DXF → SVG → PNG");
    expect(result.renderedImage).toBeTruthy();
    expect(result.renderedImage).toContain("data:image/png;base64");
    expect(result.structuredData).toBeDefined();
  }, 30_000);
});
