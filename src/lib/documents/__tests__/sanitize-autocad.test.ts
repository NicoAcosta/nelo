import { describe, it, expect } from "vitest";
import { sanitizeAutoCADText, cleanLayerName } from "../sanitize-autocad";

describe("sanitizeAutoCADText", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeAutoCADText("")).toBe("");
  });

  it("passes through plain text unchanged", () => {
    expect(sanitizeAutoCADText("KITCHEN")).toBe("KITCHEN");
    expect(sanitizeAutoCADText("Living Room")).toBe("Living Room");
  });

  // %%u — underline toggle
  it("strips %%u underline codes", () => {
    expect(sanitizeAutoCADText("%%uKITCHEN")).toBe("KITCHEN");
    expect(sanitizeAutoCADText("%%u2 CAR GARAGE")).toBe("2 CAR GARAGE");
    expect(sanitizeAutoCADText("%%uBEDROOM 2")).toBe("BEDROOM 2");
  });

  it("strips %%U (uppercase) underline codes", () => {
    expect(sanitizeAutoCADText("%%UKITCHEN")).toBe("KITCHEN");
  });

  // %%d — degree symbol
  it("replaces %%d with degree symbol", () => {
    expect(sanitizeAutoCADText("90%%d angle")).toBe("90° angle");
    expect(sanitizeAutoCADText("%%D45")).toBe("°45");
  });

  // %%p — plus/minus
  it("replaces %%p with plus/minus symbol", () => {
    expect(sanitizeAutoCADText("5%%p0.1")).toBe("5±0.1");
  });

  // %%c — diameter
  it("replaces %%c with diameter symbol", () => {
    expect(sanitizeAutoCADText("%%c20mm")).toBe("⌀20mm");
  });

  // MTEXT font codes: {\Ffont|flags;text}
  it("extracts text from \\F font codes with pipe flags", () => {
    expect(
      sanitizeAutoCADText("{\\Farchquik|c0;MIN. 22\"x 30\" ATTIC ACCESS}"),
    ).toBe("MIN. 22\"x 30\" ATTIC ACCESS");
  });

  // MTEXT font codes: {\ffont;text}
  it("extracts text from \\f font codes without flags", () => {
    expect(sanitizeAutoCADText("{\\fArial;Hello World}")).toBe("Hello World");
  });

  it("handles lowercase \\f font codes", () => {
    expect(sanitizeAutoCADText("{\\fTimes New Roman;Room Name}")).toBe(
      "Room Name",
    );
  });

  // Combined codes
  it("handles combined %%u and font codes", () => {
    expect(sanitizeAutoCADText("%%u{\\fArial;Bold Room}")).toBe("Bold Room");
  });

  it("handles multiple %%u codes in one string", () => {
    expect(sanitizeAutoCADText("%%uROOM%%u A")).toBe("ROOM A");
  });

  // \P paragraph break
  it("replaces \\P with space", () => {
    expect(sanitizeAutoCADText("Line 1\\PLine 2")).toBe("Line 1 Line 2");
  });

  // Whitespace normalization
  it("collapses multiple spaces", () => {
    expect(sanitizeAutoCADText("  ROOM   NAME  ")).toBe("ROOM NAME");
  });

  it("trims result", () => {
    expect(sanitizeAutoCADText("  KITCHEN  ")).toBe("KITCHEN");
  });
});

describe("cleanLayerName", () => {
  it("returns empty string for empty input", () => {
    expect(cleanLayerName("")).toBe("");
  });

  it("passes through simple layer names unchanged", () => {
    expect(cleanLayerName("A-WALL")).toBe("A-WALL");
    expect(cleanLayerName("0")).toBe("0");
    expect(cleanLayerName("Defpoints")).toBe("Defpoints");
  });

  it("strips xref prefix with $0$ separator", () => {
    expect(cleanLayerName("xref-Bishop-Overland-08$0$A-WALL")).toBe("A-WALL");
  });

  it("strips nested xref prefixes (greedy match)", () => {
    expect(cleanLayerName("xref-foo$0$xref-bar$0$A-DOOR")).toBe("A-DOOR");
  });

  it("handles complex xref names", () => {
    expect(
      cleanLayerName("xref-Bishop-Overland-08$0$A-GARAGE-DOOR"),
    ).toBe("A-GARAGE-DOOR");
    expect(
      cleanLayerName("xref-Bishop-Overland-08$0$S-STEM-WALL"),
    ).toBe("S-STEM-WALL");
    expect(
      cleanLayerName("xref-Bishop-Overland-08$0$R-OVERHANG"),
    ).toBe("R-OVERHANG");
  });
});
