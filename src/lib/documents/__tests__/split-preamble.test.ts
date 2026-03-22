import { describe, it, expect } from "vitest";
import { splitPreambleFromDisplay } from "../split-preamble";

describe("splitPreambleFromDisplay", () => {
  it("returns original text when no preamble markers", () => {
    const result = splitPreambleFromDisplay("Hello world");
    expect(result.displayText).toBe("Hello world");
    expect(result.hasPreamble).toBe(false);
    expect(result.files).toEqual([]);
  });

  it("returns empty string for empty input", () => {
    const result = splitPreambleFromDisplay("");
    expect(result.displayText).toBe("");
    expect(result.hasPreamble).toBe(false);
  });

  it("splits preamble from display text for DXF", () => {
    const text = [
      "<!-- doc-analysis -->",
      "Document Analysis (extracted from AutoCAD DXF):",
      "- File: house-floor-plan.dxf, 24 layers detected",
      "- Rooms found: KITCHEN, BEDROOM",
      "- Dimensions: 63 measurements found",
      "<!-- doc-analysis -->",
      "",
      "Analyze this floor plan",
    ].join("\n");

    const result = splitPreambleFromDisplay(text);
    expect(result.displayText).toBe("Analyze this floor plan");
    expect(result.hasPreamble).toBe(true);
    expect(result.files).toEqual([
      { name: "house-floor-plan.dxf", type: "DXF" },
    ]);
  });

  it("splits preamble from display text for PDF", () => {
    const text = [
      "<!-- doc-analysis -->",
      "Document Analysis (extracted from PDF):",
      "- File: blueprint.pdf",
      "- Rooms found: Living, Kitchen",
      "<!-- doc-analysis -->",
      "",
      "Check this blueprint",
    ].join("\n");

    const result = splitPreambleFromDisplay(text);
    expect(result.displayText).toBe("Check this blueprint");
    expect(result.hasPreamble).toBe(true);
    expect(result.files).toEqual([{ name: "blueprint.pdf", type: "PDF" }]);
  });

  it("handles DWG file type", () => {
    const text = [
      "<!-- doc-analysis -->",
      "Document Analysis (extracted from AutoCAD DWG):",
      "- File: project.dwg, 10 layers detected",
      "<!-- doc-analysis -->",
      "",
      "Analyze",
    ].join("\n");

    const result = splitPreambleFromDisplay(text);
    expect(result.files).toEqual([{ name: "project.dwg", type: "DWG" }]);
  });

  it("handles multiple files", () => {
    const text = [
      "<!-- doc-analysis -->",
      "Document Analysis (extracted from AutoCAD DXF):",
      "- File: floor1.dxf, 10 layers",
      "",
      "Document Analysis (extracted from PDF):",
      "- File: floor2.pdf",
      "<!-- doc-analysis -->",
      "",
      "Analyze both",
    ].join("\n");

    const result = splitPreambleFromDisplay(text);
    expect(result.displayText).toBe("Analyze both");
    expect(result.hasPreamble).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(result.files[0]).toEqual({ name: "floor1.dxf", type: "DXF" });
    expect(result.files[1]).toEqual({ name: "floor2.pdf", type: "PDF" });
  });

  it("trims display text", () => {
    const text = [
      "<!-- doc-analysis -->",
      "Document Analysis (extracted from AutoCAD DXF):",
      "- File: test.dxf",
      "<!-- doc-analysis -->",
      "",
      "  Analyze this  ",
    ].join("\n");

    const result = splitPreambleFromDisplay(text);
    expect(result.displayText).toBe("Analyze this");
  });

  it("handles single unclosed marker gracefully", () => {
    const text = "<!-- doc-analysis -->\nSome text without closing marker";
    const result = splitPreambleFromDisplay(text);
    expect(result.hasPreamble).toBe(false);
    expect(result.displayText).toBe(text);
  });

  it("handles markers with unrecognized content format", () => {
    const text = [
      "<!-- doc-analysis -->",
      "Some random text with no File: line",
      "<!-- doc-analysis -->",
      "",
      "User message",
    ].join("\n");

    const result = splitPreambleFromDisplay(text);
    expect(result.displayText).toBe("User message");
    expect(result.hasPreamble).toBe(true);
    expect(result.files).toEqual([]);
  });

  it("handles file name with comma-separated metadata", () => {
    const text = [
      "<!-- doc-analysis -->",
      "Document Analysis (extracted from AutoCAD DXF):",
      "- File: my floor plan.dxf, 24 layers detected",
      "<!-- doc-analysis -->",
      "",
      "Go",
    ].join("\n");

    const result = splitPreambleFromDisplay(text);
    expect(result.files).toEqual([
      { name: "my floor plan.dxf", type: "DXF" },
    ]);
  });
});
