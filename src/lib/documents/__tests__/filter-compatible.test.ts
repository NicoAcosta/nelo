import { describe, it, expect } from "vitest";
import { filterClaudeCompatible } from "../filter-compatible";

function fakeFile(name: string): File {
  return new File(["x"], name, { type: "application/octet-stream" });
}

describe("filterClaudeCompatible", () => {
  it("keeps PNG files", () => {
    const result = filterClaudeCompatible([fakeFile("photo.png")]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("photo.png");
  });

  it("keeps JPG and JPEG files", () => {
    const result = filterClaudeCompatible([
      fakeFile("a.jpg"),
      fakeFile("b.jpeg"),
    ]);
    expect(result).toHaveLength(2);
  });

  it("keeps WebP files", () => {
    const result = filterClaudeCompatible([fakeFile("img.webp")]);
    expect(result).toHaveLength(1);
  });

  it("keeps PDF files", () => {
    const result = filterClaudeCompatible([fakeFile("doc.pdf")]);
    expect(result).toHaveLength(1);
  });

  it("filters out DWG files", () => {
    const result = filterClaudeCompatible([fakeFile("plan.dwg")]);
    expect(result).toHaveLength(0);
  });

  it("filters out DXF files", () => {
    const result = filterClaudeCompatible([fakeFile("plan.dxf")]);
    expect(result).toHaveLength(0);
  });

  it("filters mixed files keeping only compatible ones", () => {
    const result = filterClaudeCompatible([
      fakeFile("plan.dwg"),
      fakeFile("photo.png"),
      fakeFile("drawing.dxf"),
      fakeFile("doc.pdf"),
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toEqual(["photo.png", "doc.pdf"]);
  });

  it("returns empty array when no files are compatible", () => {
    const result = filterClaudeCompatible([
      fakeFile("plan.dwg"),
      fakeFile("model.rvt"),
    ]);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(filterClaudeCompatible([])).toHaveLength(0);
  });

  it("handles uppercase extensions", () => {
    const result = filterClaudeCompatible([fakeFile("PHOTO.PNG")]);
    expect(result).toHaveLength(1);
  });
});
