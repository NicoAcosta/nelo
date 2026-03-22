# Smart Document Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Accept AutoCAD (DWG/DXF), PDF, and image uploads in Nelo's chat, extract structured construction data from CAD files, and feed both structured data + rendered images to Claude for higher-accuracy cost estimation.

**Architecture:** A dedicated `/api/documents/process` route handles heavy file processing (DXF parsing, DWG→DXF WASM conversion, PDF text extraction, SVG→PNG rendering). The client uploads files there first, receives structured analysis results, then includes the analysis as a text preamble + rendered image in the chat message. The chat route stays lean.

**Tech Stack:** `dxf` (DXF parsing + SVG), `@mlightcad/libredwg-converter` (DWG→DXF WASM), `pdfjs-dist` (PDF text), `@resvg/resvg-js` (SVG→PNG), `@vercel/blob` (large file staging), Zod v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-03-22-document-pipeline-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/documents/types.ts` | Zod schemas for `DocumentAnalysis`, `ExtractedData`, file validation constants |
| `src/lib/documents/validation.ts` | File extension/size validation, type detection from extension |
| `src/lib/documents/cad-pipeline.ts` | DXF parsing → structured extraction + SVG→PNG rendering |
| `src/lib/documents/dwg-converter.ts` | DWG→DXF conversion via WASM (isolated for testability) |
| `src/lib/documents/pdf-pipeline.ts` | PDF text extraction + page rendering |
| `src/lib/documents/preamble.ts` | Builds structured text preamble from `ExtractedData` for Claude |
| `src/lib/documents/processor.ts` | Main router: file extension → correct pipeline → `DocumentAnalysis` |
| `src/app/api/documents/process/route.ts` | API route for document processing (isolated heavy deps) |
| `src/lib/documents/__tests__/types.test.ts` | Schema validation tests |
| `src/lib/documents/__tests__/validation.test.ts` | File validation tests |
| `src/lib/documents/__tests__/cad-pipeline.test.ts` | DXF extraction tests |
| `src/lib/documents/__tests__/preamble.test.ts` | Preamble builder tests |
| `src/lib/documents/__tests__/processor.test.ts` | Router logic tests |
| `src/lib/documents/__tests__/dwg-converter.test.ts` | DWG converter tests (mocked WASM) |
| `src/lib/documents/__tests__/pdf-pipeline.test.ts` | PDF extraction tests |
| `src/lib/documents/__fixtures__/simple-apartment.dxf` | Test fixture |
| `src/lib/documents/__fixtures__/no-dimensions.dxf` | Test fixture |
| `src/lib/documents/__fixtures__/empty.dxf` | Test fixture |

### Modified files
| File | Change |
|------|--------|
| `src/components/chat-input.tsx` | Multi-file support, expanded accept list, file type icons, per-type size limits |
| `src/app/chat/page.tsx` | Process files via `/api/documents/process` before sending to chat, show processing state |
| `src/app/api/chat/route.ts` | Bump body limit to 10MB (messages now include base64 rendered images) |
| `src/lib/ai/tools.ts` | Update `analyzeFloorPlan` tool description to leverage structured preamble data |
| `src/lib/floor-plan/analyze.ts` | Refactor to accept optional pre-extracted structured data alongside vision |
| `vercel.json` | Add function config for document processing route |
| `package.json` | Add new dependencies |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install production dependencies**

```bash
cd /Users/nico/dev/arqui && npm install dxf@^5.3.1 @resvg/resvg-js@^2.6.2 pdfjs-dist@^5.5.0 @vercel/blob@^0.27.0 @napi-rs/canvas@^0.1.0
```

- [ ] **Step 2: Install DWG WASM converter**

```bash
cd /Users/nico/dev/arqui && npm install @mlightcad/libredwg-converter@^3.5.8
```

- [ ] **Step 3: Verify dependencies installed**

```bash
cd /Users/nico/dev/arqui && node -e "require('dxf'); console.log('dxf OK')" && node -e "require('@resvg/resvg-js'); console.log('resvg OK')"
```
Expected: Both print OK.

- [ ] **Step 4: Run existing tests to verify no breakage**

```bash
cd /Users/nico/dev/arqui && npm test
```
Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/nico/dev/arqui && git add package.json package-lock.json && git commit -m "chore: add document pipeline dependencies (dxf, resvg, pdfjs, libredwg, blob)"
```

---

## Task 2: Document types and validation

**Files:**
- Create: `src/lib/documents/types.ts`
- Create: `src/lib/documents/validation.ts`
- Test: `src/lib/documents/__tests__/types.test.ts`
- Test: `src/lib/documents/__tests__/validation.test.ts`

- [ ] **Step 1: Write failing tests for types**

Create `src/lib/documents/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { extractedDataSchema, documentAnalysisSchema } from "../types";

describe("extractedDataSchema", () => {
  it("accepts valid extracted data", () => {
    const data = {
      roomLabels: [{ name: "Living Room", areaM2: 45.2 }],
      dimensions: [{ value: 3.5, unit: "m", label: "Wall A" }],
      summary: {
        layerNames: ["A-WALL", "A-DOOR"],
        wallSegmentCount: 12,
        doorCount: 3,
        windowCount: 4,
        hasStairs: false,
        hasFurniture: true,
      },
    };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects missing summary fields", () => {
    const data = {
      roomLabels: [],
      dimensions: [],
      summary: { layerNames: [] },
    };
    const result = extractedDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("documentAnalysisSchema", () => {
  it("accepts null structuredData for images", () => {
    const data = {
      structuredData: null,
      renderedImage: "data:image/png;base64,abc",
      metadata: {
        originalFileName: "photo.jpg",
        fileType: "image",
        fileSizeBytes: 1024,
      },
    };
    const result = documentAnalysisSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid fileType", () => {
    const data = {
      structuredData: null,
      renderedImage: "data:image/png;base64,abc",
      metadata: {
        originalFileName: "file.xyz",
        fileType: "xyz",
        fileSizeBytes: 1024,
      },
    };
    const result = documentAnalysisSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/types.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement types.ts**

Create `src/lib/documents/types.ts`:

```typescript
/**
 * Nelo — Document Pipeline Types
 *
 * Zod schemas are the source of truth. TypeScript types are inferred.
 * Consistent with project pattern (see lib/estimate/types.ts).
 */

import { z } from "zod";

export const extractedDataSchema = z.object({
  roomLabels: z.array(
    z.object({
      name: z.string(),
      areaM2: z.number().optional(),
      position: z.tuple([z.number(), z.number()]).optional(),
    }),
  ),
  dimensions: z.array(
    z.object({
      value: z.number(),
      unit: z.string(),
      label: z.string().optional(),
    }),
  ),
  summary: z.object({
    layerNames: z.array(z.string()),
    wallSegmentCount: z.number(),
    doorCount: z.number(),
    windowCount: z.number(),
    hasStairs: z.boolean(),
    hasFurniture: z.boolean(),
  }),
});

export const documentAnalysisSchema = z.object({
  structuredData: extractedDataSchema.nullable(),
  renderedImage: z.string(), // base64 data URL
  metadata: z.object({
    originalFileName: z.string(),
    fileType: z.enum(["dwg", "dxf", "pdf", "image"]),
    fileSizeBytes: z.number(),
    layerCount: z.number().optional(),
    pageCount: z.number().optional(),
    conversionPath: z.string().optional(),
  }),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;
export type SupportedFileType = DocumentAnalysis["metadata"]["fileType"];
```

- [ ] **Step 4: Run types test to verify it passes**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/types.test.ts
```
Expected: PASS.

- [ ] **Step 5: Write failing tests for validation**

Create `src/lib/documents/__tests__/validation.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { detectFileType, validateFile, SUPPORTED_EXTENSIONS, FILE_SIZE_LIMITS } from "../validation";

describe("detectFileType", () => {
  it("detects DWG files", () => {
    expect(detectFileType("project.dwg")).toBe("dwg");
    expect(detectFileType("PROJECT.DWG")).toBe("dwg");
  });

  it("detects DXF files", () => {
    expect(detectFileType("floor-plan.dxf")).toBe("dxf");
  });

  it("detects PDF files", () => {
    expect(detectFileType("plan.pdf")).toBe("pdf");
  });

  it("detects image files", () => {
    expect(detectFileType("photo.png")).toBe("image");
    expect(detectFileType("scan.jpg")).toBe("image");
    expect(detectFileType("plan.jpeg")).toBe("image");
    expect(detectFileType("render.webp")).toBe("image");
  });

  it("returns null for unsupported extensions", () => {
    expect(detectFileType("model.rvt")).toBeNull();
    expect(detectFileType("data.xlsx")).toBeNull();
    expect(detectFileType("noext")).toBeNull();
  });
});

describe("validateFile", () => {
  it("accepts a valid DXF file", () => {
    const result = validateFile("plan.dxf", 5 * 1024 * 1024);
    expect(result.valid).toBe(true);
    expect(result.fileType).toBe("dxf");
  });

  it("rejects oversized DWG", () => {
    const result = validateFile("big.dwg", 25 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("rejects oversized image (10MB limit)", () => {
    const result = validateFile("photo.png", 11 * 1024 * 1024);
    expect(result.valid).toBe(false);
  });

  it("accepts image under 10MB", () => {
    const result = validateFile("photo.png", 9 * 1024 * 1024);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported extension", () => {
    const result = validateFile("model.rvt", 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported");
  });
});
```

- [ ] **Step 6: Run validation test to verify it fails**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/validation.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 7: Implement validation.ts**

Create `src/lib/documents/validation.ts`:

```typescript
/**
 * Nelo — File Validation
 *
 * Extension-based routing (not MIME type) because browsers report
 * inconsistent MIME types for DWG/DXF files.
 */

import type { SupportedFileType } from "./types";

export const SUPPORTED_EXTENSIONS: Record<string, SupportedFileType> = {
  ".dwg": "dwg",
  ".dxf": "dxf",
  ".pdf": "pdf",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
};

/** Max file size in bytes per file type */
export const FILE_SIZE_LIMITS: Record<SupportedFileType, number> = {
  dwg: 20 * 1024 * 1024,
  dxf: 20 * 1024 * 1024,
  pdf: 20 * 1024 * 1024,
  image: 10 * 1024 * 1024,
};

/** Client-side accept string for the file input */
export const ACCEPT_STRING = Object.keys(SUPPORTED_EXTENSIONS).join(",");

/** Max files per message */
export const MAX_FILES_PER_MESSAGE = 3;

/**
 * Detect file type from filename extension. Case-insensitive.
 * Returns null for unsupported extensions.
 */
export function detectFileType(fileName: string): SupportedFileType | null {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return null;
  const ext = fileName.slice(lastDot).toLowerCase();
  return SUPPORTED_EXTENSIONS[ext] ?? null;
}

interface ValidationResult {
  valid: boolean;
  fileType: SupportedFileType | null;
  error?: string;
}

/**
 * Validate a file by name and size.
 * Returns { valid, fileType, error? }.
 */
export function validateFile(fileName: string, sizeBytes: number): ValidationResult {
  const fileType = detectFileType(fileName);

  if (!fileType) {
    const supported = Object.keys(SUPPORTED_EXTENSIONS).join(", ");
    return {
      valid: false,
      fileType: null,
      error: `Unsupported file type. Supported: ${supported}`,
    };
  }

  const maxSize = FILE_SIZE_LIMITS[fileType];
  const maxSizeMB = maxSize / (1024 * 1024);

  if (sizeBytes > maxSize) {
    return {
      valid: false,
      fileType,
      error: `File too large (${(sizeBytes / 1024 / 1024).toFixed(1)}MB). Max ${maxSizeMB}MB for ${fileType} files.`,
    };
  }

  return { valid: true, fileType };
}
```

- [ ] **Step 8: Run validation test to verify it passes**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/validation.test.ts
```
Expected: PASS.

- [ ] **Step 9: Run all tests**

```bash
cd /Users/nico/dev/arqui && npm test
```
Expected: All tests pass.

- [ ] **Step 10: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/lib/documents/types.ts src/lib/documents/validation.ts src/lib/documents/__tests__/types.test.ts src/lib/documents/__tests__/validation.test.ts && git commit -m "feat: add document pipeline types and file validation"
```

---

## Task 3: DXF parsing and CAD pipeline

**Files:**
- Create: `src/lib/documents/cad-pipeline.ts`
- Create: `src/lib/documents/__fixtures__/simple-apartment.dxf`
- Create: `src/lib/documents/__fixtures__/no-dimensions.dxf`
- Create: `src/lib/documents/__fixtures__/empty.dxf`
- Test: `src/lib/documents/__tests__/cad-pipeline.test.ts`

**Docs to check before coding:**
- `dxf` package API: https://github.com/skymakerolof/dxf — check `parseString`, `toSVG`, `groupEntitiesByLayer` exports
- `@resvg/resvg-js` API: https://github.com/nicolo-ribaudo/resvg-js — check `Resvg` constructor and `render().asPng()`

- [ ] **Step 1: Create minimal DXF test fixtures**

Create `src/lib/documents/__fixtures__/empty.dxf`:
```
0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF
```

Create `src/lib/documents/__fixtures__/simple-apartment.dxf` — a minimal DXF with TEXT, DIMENSION, and LINE entities. Use the `dxf` package docs to verify entity syntax. The fixture should contain:
- A TEXT entity with "Living Room" on layer "A-TEXT"
- A DIMENSION entity with value 4.5 on layer "A-DIMS"
- A LINE entity on layer "A-WALL"
- A TEXT entity with "45.2 m2" on layer "A-TEXT"

Create `src/lib/documents/__fixtures__/no-dimensions.dxf` — same as simple-apartment but without DIMENSION entities.

**Note:** DXF file syntax is specific. Read the dxf package test fixtures on GitHub for correct entity formatting before creating these. The fixtures must parse correctly with `dxf.parseString()`.

- [ ] **Step 2: Write failing test for cad-pipeline**

Create `src/lib/documents/__tests__/cad-pipeline.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { extractFromDxf } from "../cad-pipeline";

const fixturesDir = join(__dirname, "../__fixtures__");

describe("extractFromDxf", () => {
  it("extracts room labels from TEXT entities", async () => {
    const dxfContent = readFileSync(join(fixturesDir, "simple-apartment.dxf"), "utf-8");
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData).not.toBeNull();
    expect(result.structuredData!.roomLabels.length).toBeGreaterThan(0);
  });

  it("extracts dimensions from DIMENSION entities", async () => {
    const dxfContent = readFileSync(join(fixturesDir, "simple-apartment.dxf"), "utf-8");
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData!.dimensions.length).toBeGreaterThan(0);
  });

  it("populates layer names in summary", async () => {
    const dxfContent = readFileSync(join(fixturesDir, "simple-apartment.dxf"), "utf-8");
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData!.summary.layerNames.length).toBeGreaterThan(0);
  });

  it("produces a rendered image as base64 data URL", async () => {
    const dxfContent = readFileSync(join(fixturesDir, "simple-apartment.dxf"), "utf-8");
    const result = await extractFromDxf(dxfContent);
    expect(result.renderedImage).toMatch(/^data:image\/png;base64,/);
  });

  it("handles empty DXF without crashing", async () => {
    const dxfContent = readFileSync(join(fixturesDir, "empty.dxf"), "utf-8");
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData).not.toBeNull();
    expect(result.structuredData!.roomLabels).toEqual([]);
    expect(result.structuredData!.dimensions).toEqual([]);
  });

  it("handles DXF with no dimensions gracefully", async () => {
    const dxfContent = readFileSync(join(fixturesDir, "no-dimensions.dxf"), "utf-8");
    const result = await extractFromDxf(dxfContent);
    expect(result.structuredData!.dimensions).toEqual([]);
    expect(result.structuredData!.roomLabels.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/cad-pipeline.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 4: Implement cad-pipeline.ts**

Create `src/lib/documents/cad-pipeline.ts`. Key implementation notes:

```typescript
/**
 * Nelo — CAD Pipeline
 *
 * Extracts structured construction data from DXF files and renders to PNG.
 * Uses the `dxf` package for parsing + SVG generation, and `@resvg/resvg-js` for SVG→PNG.
 *
 * Check `dxf` package API before implementing:
 * - parseString(dxfContent) → parsed object with .entities array
 * - toSVG(parsed) → SVG string (NOTE: does not render TEXT entities)
 * - Each entity has: .type, .layer, and type-specific fields
 *
 * Entity types we care about:
 * - TEXT/MTEXT: .text field → room labels, area annotations
 * - DIMENSION: .measurement field → explicit dimensions
 * - LINE: .start/.end → wall segments
 * - LWPOLYLINE: .vertices → wall outlines
 * - INSERT: .name → block references (doors, windows)
 */

import type { DocumentAnalysis, ExtractedData } from "./types";

// Import dxf — check actual export names from the package
// import { parseString, toSVG } from "dxf";
// Import resvg — check actual API
// import { Resvg } from "@resvg/resvg-js";

/**
 * Extract structured data from DXF content string and render to PNG.
 *
 * Implementation approach:
 * 1. Parse DXF string with dxf.parseString()
 * 2. Walk entities array, classify by type and layer:
 *    - TEXT/MTEXT on label layers → roomLabels (parse "45.2 m2" patterns for areaM2)
 *    - DIMENSION entities → dimensions array
 *    - LINE/LWPOLYLINE on wall layers → count wall segments
 *    - INSERT blocks matching door/window patterns → count doors/windows
 * 3. Collect unique layer names
 * 4. Render to SVG via dxf.toSVG(), then SVG→PNG via Resvg
 * 5. Convert PNG buffer to base64 data URL
 */
export async function extractFromDxf(dxfContent: string): Promise<DocumentAnalysis> {
  // Implementation here — see notes above for approach
  // Room label parsing: regex for patterns like "45.2 m2", "45,2 m²", "Living Room"
  // Door/window detection: INSERT block names containing "door", "puerta", "window", "ventana"
  // Wall detection: entities on layers containing "wall", "muro", "pared"
  // Stair detection: layers containing "stair", "escalera"
  // Furniture detection: layers containing "furn", "mueble"
}
```

The actual implementation must:
- Read the `dxf` package source/README to confirm exact API (`parseString` vs `parse`, entity field names)
- Handle the case where `toSVG()` returns empty/minimal SVG
- Use `@resvg/resvg-js` Resvg class to render SVG string → PNG buffer
- Convert PNG buffer to `data:image/png;base64,...` string
- Wrap errors and return a minimal `DocumentAnalysis` on failure

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/cad-pipeline.test.ts
```
Expected: PASS.

- [ ] **Step 6: Run all tests**

```bash
cd /Users/nico/dev/arqui && npm test
```
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/lib/documents/cad-pipeline.ts src/lib/documents/__tests__/cad-pipeline.test.ts src/lib/documents/__fixtures__ && git commit -m "feat: add DXF parsing and CAD extraction pipeline"
```

---

## Task 4: DWG converter

**Files:**
- Create: `src/lib/documents/dwg-converter.ts`
- Test: `src/lib/documents/__tests__/dwg-converter.test.ts`

- [ ] **Step 1: Write failing test for dwg-converter**

Create `src/lib/documents/__tests__/dwg-converter.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/dwg-converter.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement dwg-converter.ts**

Create `src/lib/documents/dwg-converter.ts`:

```typescript
/**
 * Nelo — DWG to DXF Converter
 *
 * Thin wrapper around @mlightcad/libredwg-converter WASM.
 * Check package README for actual API before implementing.
 *
 * Expected usage pattern (verify from package docs):
 * - Import the WASM converter
 * - Pass DWG ArrayBuffer → receive DXF string
 * - Handle conversion errors (unsupported DWG versions, corrupt files)
 */

/**
 * Convert a DWG file buffer to DXF string.
 * Throws on unsupported DWG versions or corrupt files.
 */
export async function convertDwgToDxf(dwgBuffer: ArrayBuffer): Promise<string> {
  // Check @mlightcad/libredwg-converter package docs for actual API
  // The package may export a function like:
  //   import { convert } from "@mlightcad/libredwg-converter";
  //   const dxfContent = await convert(dwgBuffer, "dxf");
  //
  // Or it may require initializing a WASM module first.
  // READ THE PACKAGE README before implementing.
  //
  // IMPORTANT: Wrap in try/catch and throw with prefix "DWG conversion failed: ..."
  // so the test expectation matches.
  try {
    // ... actual conversion call here
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`DWG conversion failed: ${msg}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/dwg-converter.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/lib/documents/dwg-converter.ts && git commit -m "feat: add DWG to DXF WASM converter wrapper"
```

---

## Task 5: PDF pipeline

**Files:**
- Create: `src/lib/documents/pdf-pipeline.ts`
- Test: `src/lib/documents/__tests__/pdf-pipeline.test.ts`

**Docs to check:** `pdfjs-dist` API — specifically `getDocument()`, `page.getTextContent()`, and whether `page.render()` works without a canvas in Node.js.

**Note:** PDF page-to-PNG rendering requires a canvas backend (`@napi-rs/canvas`). If unavailable in the serverless environment, fall back to text-only extraction.

- [ ] **Step 1: Write failing test for pdf-pipeline**

Create `src/lib/documents/__tests__/pdf-pipeline.test.ts`:

```typescript
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
    // Should find room labels from text items
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/pdf-pipeline.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement pdf-pipeline.ts**

Create `src/lib/documents/pdf-pipeline.ts`:

```typescript
/**
 * Nelo — PDF Pipeline
 *
 * Extracts text content from PDF floor plans.
 * Text extraction: pdfjs-dist getTextContent() — works without canvas.
 * Page rendering: requires @napi-rs/canvas — may not work in all environments.
 *
 * Strategy:
 * 1. Load PDF with pdfjs-dist getDocument()
 * 2. For each page: extract text items with positions
 * 3. Parse room labels and dimension annotations from text
 * 4. Attempt to render first page to PNG (if canvas available)
 * 5. Return DocumentAnalysis with whatever succeeded
 *
 * Check pdfjs-dist Node.js API before implementing:
 * - Import from "pdfjs-dist/legacy/build/pdf.mjs" for Node.js
 * - getDocument({ data: arrayBuffer }) → pdf
 * - pdf.getPage(pageNum) → page
 * - page.getTextContent() → { items: TextItem[] }
 * - TextItem has: str, transform (position matrix)
 */

import type { DocumentAnalysis } from "./types";

/**
 * Extract text and optionally render a PDF file.
 * Returns DocumentAnalysis with text-based ExtractedData.
 */
export async function extractFromPdf(
  pdfBuffer: ArrayBuffer,
  fileName: string,
): Promise<DocumentAnalysis> {
  // Implementation:
  // 1. Load PDF
  // 2. Extract text from all pages
  // 3. Parse room labels: look for room-type words (dormitorio, living, cocina, baño, etc.)
  // 4. Parse dimensions: regex for patterns like "3.50", "4,20 m", etc.
  // 5. Attempt page render to PNG (try/catch — may fail without canvas)
  // 6. If render fails, return a placeholder image or empty string
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/pdf-pipeline.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/lib/documents/pdf-pipeline.ts src/lib/documents/__tests__/pdf-pipeline.test.ts && git commit -m "feat: add PDF text extraction pipeline"
```

---

## Task 6: Preamble builder

**Files:**
- Create: `src/lib/documents/preamble.ts`
- Test: `src/lib/documents/__tests__/preamble.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/documents/__tests__/preamble.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildPreamble } from "../preamble";
import type { DocumentAnalysis } from "../types";

const mockAnalysis: DocumentAnalysis = {
  structuredData: {
    roomLabels: [
      { name: "Living Room", areaM2: 45.2 },
      { name: "Kitchen", areaM2: 12.8 },
      { name: "Bedroom 1", areaM2: 18.5 },
    ],
    dimensions: [
      { value: 3.5, unit: "m", label: "Wall A" },
      { value: 8.5, unit: "m", label: "Wall B" },
    ],
    summary: {
      layerNames: ["A-WALL", "A-DOOR", "A-GLAZ", "A-TEXT"],
      wallSegmentCount: 12,
      doorCount: 3,
      windowCount: 5,
      hasStairs: false,
      hasFurniture: true,
    },
  },
  renderedImage: "data:image/png;base64,abc",
  metadata: {
    originalFileName: "project.dwg",
    fileType: "dwg",
    fileSizeBytes: 5000000,
    layerCount: 4,
    conversionPath: "DWG → DXF → SVG → PNG",
  },
};

describe("buildPreamble", () => {
  it("includes room labels with areas", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("Living Room");
    expect(preamble).toContain("45.2");
    expect(preamble).toContain("Kitchen");
  });

  it("includes dimension count and range", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("2 measurements");
    expect(preamble).toContain("3.5");
    expect(preamble).toContain("8.5");
  });

  it("includes element counts", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("3 doors");
    expect(preamble).toContain("5 windows");
  });

  it("includes file name and layer count", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("project.dwg");
    expect(preamble).toContain("4 layers");
  });

  it("instructs Claude to use exact measurements", () => {
    const preamble = buildPreamble(mockAnalysis);
    expect(preamble).toContain("exact measurements");
  });

  it("returns empty string when structuredData is null", () => {
    const imageOnly: DocumentAnalysis = {
      ...mockAnalysis,
      structuredData: null,
      metadata: { ...mockAnalysis.metadata, fileType: "image" },
    };
    const preamble = buildPreamble(imageOnly);
    expect(preamble).toBe("");
  });

  it("adds degradation note when specified", () => {
    const preamble = buildPreamble(mockAnalysis, { degraded: true });
    expect(preamble).toContain("visual inspection only");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/preamble.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement preamble.ts**

Create `src/lib/documents/preamble.ts`:

```typescript
/**
 * Nelo — Structured Preamble Builder
 *
 * Converts ExtractedData into a text preamble that gets injected
 * into the conversation before Claude processes a floor plan.
 * Claude receives this alongside the rendered image.
 */

import type { DocumentAnalysis } from "./types";

interface PreambleOptions {
  degraded?: boolean; // true if structured extraction failed, vision-only fallback
}

/**
 * Build a structured text preamble from document analysis results.
 * Returns empty string if no structured data is available.
 */
export function buildPreamble(
  analysis: DocumentAnalysis,
  options: PreambleOptions = {},
): string {
  if (options.degraded) {
    return "Note: structured extraction was unavailable for this file. Analysis is based on visual inspection only. Measurements are approximate.";
  }

  const { structuredData, metadata } = analysis;
  if (!structuredData) return "";

  const lines: string[] = [];

  // Header
  const fileTypeLabel =
    metadata.fileType === "dwg" || metadata.fileType === "dxf"
      ? "AutoCAD " + metadata.fileType.toUpperCase()
      : metadata.fileType.toUpperCase();
  const layerInfo = metadata.layerCount ? `, ${metadata.layerCount} layers detected` : "";
  lines.push(`Document Analysis (extracted from ${fileTypeLabel}):`);
  lines.push(`- File: ${metadata.originalFileName}${layerInfo}`);

  // Rooms
  if (structuredData.roomLabels.length > 0) {
    const roomParts = structuredData.roomLabels.map((r) =>
      r.areaM2 ? `${r.name} (${r.areaM2} m2)` : r.name,
    );
    lines.push(`- Rooms found: ${roomParts.join(", ")}`);
  }

  // Dimensions
  if (structuredData.dimensions.length > 0) {
    const values = structuredData.dimensions.map((d) => d.value).sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    lines.push(
      `- Dimensions: ${values.length} measurements found (range ${min}m – ${max}m)`,
    );
  }

  // Elements
  const { summary } = structuredData;
  const elements: string[] = [];
  if (summary.doorCount > 0) elements.push(`${summary.doorCount} doors`);
  if (summary.windowCount > 0) elements.push(`${summary.windowCount} windows`);
  if (summary.hasStairs) elements.push("staircase");
  if (elements.length > 0) {
    lines.push(`- Elements: ${elements.join(", ")}`);
  }

  // Layers
  if (summary.layerNames.length > 0) {
    lines.push(`- Layers: ${summary.layerNames.join(", ")}`);
  }

  lines.push("");
  lines.push(
    "Use these exact measurements for cost estimation. The attached image shows the spatial layout.",
  );

  return lines.join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/preamble.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/lib/documents/preamble.ts src/lib/documents/__tests__/preamble.test.ts && git commit -m "feat: add structured preamble builder for Claude"
```

---

## Task 7: Document processor router

**Files:**
- Create: `src/lib/documents/processor.ts`
- Test: `src/lib/documents/__tests__/processor.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/documents/__tests__/processor.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
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
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/processor.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement processor.ts**

Create `src/lib/documents/processor.ts`:

```typescript
/**
 * Nelo — Document Processor
 *
 * Routes files to the correct extraction pipeline based on extension.
 * Returns a unified DocumentAnalysis regardless of input type.
 */

import { detectFileType } from "./validation";
import { extractFromDxf } from "./cad-pipeline";
import { convertDwgToDxf } from "./dwg-converter";
import { extractFromPdf } from "./pdf-pipeline";
import type { DocumentAnalysis } from "./types";

const PROCESSING_TIMEOUT_MS = 30_000;

/**
 * Process a document file and return structured analysis + rendered image.
 * Routes by file extension to the appropriate pipeline.
 */
export async function processDocument(
  fileBuffer: ArrayBuffer,
  fileName: string,
): Promise<DocumentAnalysis> {
  const fileType = detectFileType(fileName);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${fileName}`);
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Document processing timed out (30s)")), PROCESSING_TIMEOUT_MS),
  );

  const processPromise = (async (): Promise<DocumentAnalysis> => {
    switch (fileType) {
      case "dwg": {
        const dxfContent = await convertDwgToDxf(fileBuffer);
        const analysis = await extractFromDxf(dxfContent);
        return {
          ...analysis,
          metadata: {
            ...analysis.metadata,
            originalFileName: fileName,
            fileType: "dwg",
            fileSizeBytes: fileBuffer.byteLength,
            conversionPath: "DWG → DXF → SVG → PNG",
          },
        };
      }
      case "dxf": {
        const dxfContent = new TextDecoder().decode(fileBuffer);
        const analysis = await extractFromDxf(dxfContent);
        return {
          ...analysis,
          metadata: {
            ...analysis.metadata,
            originalFileName: fileName,
            fileType: "dxf",
            fileSizeBytes: fileBuffer.byteLength,
          },
        };
      }
      case "pdf": {
        return extractFromPdf(fileBuffer, fileName);
      }
      case "image": {
        // Passthrough — convert buffer to base64 data URL
        const uint8 = new Uint8Array(fileBuffer);
        const base64 = Buffer.from(uint8).toString("base64");
        // Detect image MIME from extension
        const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
        };
        const mime = mimeMap[ext] ?? "image/png";
        return {
          structuredData: null,
          renderedImage: `data:${mime};base64,${base64}`,
          metadata: {
            originalFileName: fileName,
            fileType: "image",
            fileSizeBytes: fileBuffer.byteLength,
          },
        };
      }
    }
  })();

  return Promise.race([processPromise, timeoutPromise]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/lib/documents/__tests__/processor.test.ts
```
Expected: PASS.

- [ ] **Step 5: Run all tests**

```bash
cd /Users/nico/dev/arqui && npm test
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/lib/documents/processor.ts src/lib/documents/__tests__/processor.test.ts && git commit -m "feat: add document processor router"
```

---

## Task 8: API route for document processing

**Files:**
- Create: `src/app/api/documents/process/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the API route**

Create `src/app/api/documents/process/route.ts`:

```typescript
/**
 * Nelo — Document Processing API Route
 *
 * Dedicated route for heavy document processing (DXF parsing, DWG WASM, PDF).
 * Isolated from the chat route to keep chat's bundle lean.
 *
 * Client uploads file(s) as multipart/form-data.
 * Returns DocumentAnalysis[] as JSON.
 */

import { NextResponse } from "next/server";
import { processDocument } from "@/lib/documents/processor";
import { validateFile, MAX_FILES_PER_MESSAGE } from "@/lib/documents/validation";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_MESSAGE) {
      return NextResponse.json(
        { error: `Too many files (max ${MAX_FILES_PER_MESSAGE})` },
        { status: 400 },
      );
    }

    // Validate all files first
    for (const file of files) {
      const validation = validateFile(file.name, file.size);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, fileName: file.name },
          { status: 400 },
        );
      }
    }

    // Process all files
    const results = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return processDocument(buffer, file.name);
      }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Document processing error:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json(
      { error: "Document processing failed", detail: message },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Update vercel.json**

Add function config for the document processing route:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-prices",
      "schedule": "0 8 * * *"
    }
  ],
  "functions": {
    "app/api/documents/process/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/app/api/documents/process/route.ts vercel.json && git commit -m "feat: add document processing API route with Vercel function config"
```

---

## Task 9: Update ChatInput for multi-file support

**Files:**
- Modify: `src/components/chat-input.tsx:1-147`
- Modify: `src/components/__tests__/chat-input.test.tsx`

- [ ] **Step 1: Read existing chat-input test to understand patterns**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/components/__tests__/chat-input.test.tsx
```

- [ ] **Step 2: Update ChatInput component**

Key changes to `src/components/chat-input.tsx`:
- Import `ACCEPT_STRING`, `MAX_FILES_PER_MESSAGE`, `validateFile` from `@/lib/documents/validation`
- Replace `selectedFile: File | null` state with `selectedFiles: File[]` array
- Replace `accept="image/*"` with `accept={ACCEPT_STRING}` and add `multiple` attribute
- Update `handleFileChange` to validate each file with `validateFile()` and accumulate up to MAX_FILES_PER_MESSAGE
- Update file preview section to show multiple chips with file type icons
- Update `handleSend` to create DataTransfer with all selected files
- Update `onSend` prop type: `(message: string, files?: FileList) => void` (unchanged signature, but now FileList may have multiple entries)
- Add file type icon helper: DWG/DXF → drafting icon, PDF → document icon, image → image icon

- [ ] **Step 3: Update chat-input tests**

Update `src/components/__tests__/chat-input.test.tsx`:
- Add test: accepts DXF file
- Add test: accepts DWG file
- Add test: rejects oversized DWG (>20MB)
- Add test: allows up to 3 files
- Add test: rejects 4th file with error message
- Add test: shows file type icon per attachment

- [ ] **Step 4: Run tests**

```bash
cd /Users/nico/dev/arqui && npx vitest run src/components/__tests__/chat-input.test.tsx
```
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/components/chat-input.tsx src/components/__tests__/chat-input.test.tsx && git commit -m "feat: expand ChatInput to accept CAD, PDF, and multiple files"
```

---

## Task 10: Update chat page to use document pipeline

**Files:**
- Modify: `src/app/chat/page.tsx:1-263`
- Modify: `src/app/api/chat/route.ts:1-100`

- [ ] **Step 1: Update chat page handleSend**

Modify `src/app/chat/page.tsx` `handleSend` function:

```typescript
// New flow:
// 1. If files present, POST them to /api/documents/process
// 2. Get back DocumentAnalysis[] results
// 3. Build preamble text from structured data
// 4. Send to useChat with: preamble + user text as text, rendered images as files

async function handleSend(text: string, files?: FileList) {
  if (files && files.length > 0) {
    setIsProcessing(true); // new state for processing indicator
    try {
      // Upload to document processing route
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
      const response = await fetch("/api/documents/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        // Fall back to sending files directly (image-only path)
        sendMessage({ text, files });
        return;
      }

      const { results } = await response.json() as { results: DocumentAnalysis[] };

      // Build preamble from all results with structured data
      const preambles = results
        .map((r: DocumentAnalysis) => buildPreamble(r))
        .filter(Boolean);
      const preambleText = preambles.length > 0
        ? preambles.join("\n\n") + "\n\n" + text
        : text;

      // Convert rendered images from base64 data URLs to File objects
      // so useChat sends the RENDERED PNGs to Claude (not the original DWG/DXF)
      const renderedFiles: File[] = results
        .filter((r: DocumentAnalysis) => r.renderedImage)
        .map((r: DocumentAnalysis, i: number) => {
          const base64 = r.renderedImage.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
          return new File([bytes], `rendered-${i}.png`, { type: "image/png" });
        });

      // Create FileList from rendered images
      const dt = new DataTransfer();
      for (const f of renderedFiles) dt.items.add(f);

      sendMessage({ text: preambleText, files: dt.files });
    } catch {
      // Fallback: send files directly
      sendMessage({ text, files });
    } finally {
      setIsProcessing(false);
    }
  } else {
    sendMessage({ text });
  }
}
```

Also add a processing state indicator in the UI (shimmer with "Processing document..." text) that shows while `isProcessing` is true.

- [ ] **Step 2: Update chat route body limit**

Modify `src/app/api/chat/route.ts`:
- Change `MAX_BODY_BYTES` from `5 * 1024 * 1024` to `10 * 1024 * 1024` (messages now include base64 rendered images from the document pipeline)

- [ ] **Step 3: Manual test**

Start dev server and test:
1. Upload a PNG image → existing flow works
2. Upload a DXF file → processing indicator shows → Claude receives structured preamble
3. Send text without files → normal chat works

```bash
cd /Users/nico/dev/arqui && npm run dev
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/app/chat/page.tsx src/app/api/chat/route.ts && git commit -m "feat: integrate document pipeline into chat flow"
```

---

## Task 11: Update analyzeFloorPlan tool and floor plan analysis

**Files:**
- Modify: `src/lib/ai/tools.ts:143-191`
- Modify: `src/lib/floor-plan/analyze.ts:84-120`

Per spec: the `analyzeFloorPlan` tool and the floor plan analysis function should leverage structured preamble data when available. When a document has been pre-processed and the preamble includes exact dimensions, Claude should use those numbers rather than guessing from the image.

- [ ] **Step 1: Update analyzeFloorPlan tool description**

In `src/lib/ai/tools.ts`, update the `analyzeFloorPlan` tool's `description` to:

```typescript
description:
  "Analyze a floor plan. If a Document Analysis preamble is present in the conversation with extracted dimensions and room data, USE THOSE EXACT MEASUREMENTS rather than estimating from the image. The image confirms spatial layout; the preamble provides precise numbers. When no preamble exists, estimate from the image as before.",
```

- [ ] **Step 2: Update analyzeFloorPlanImage to accept optional pre-extracted data**

In `src/lib/floor-plan/analyze.ts`, update the function signature and prompt:

```typescript
export async function analyzeFloorPlanImage(
  imageData: string,
  preExtracted?: ExtractedData | null,
): Promise<FloorPlanExtraction> {
```

When `preExtracted` is provided, append to the analysis prompt:
```
The following data was extracted programmatically from the CAD file:
- Rooms: [list from preExtracted.roomLabels]
- Dimensions: [list from preExtracted.dimensions]
- Elements: [counts from preExtracted.summary]

Use these exact values. Only estimate values not covered by the extraction.
```

- [ ] **Step 3: Run existing floor plan tests**

```bash
cd /Users/nico/dev/arqui && npm test
```
Expected: All tests pass (the function still works without preExtracted data).

- [ ] **Step 4: Commit**

```bash
cd /Users/nico/dev/arqui && git add src/lib/ai/tools.ts src/lib/floor-plan/analyze.ts && git commit -m "feat: update floor plan analysis to leverage structured CAD extraction data"
```

---

## Task 12: Final integration test and cleanup

**Files:**
- All document pipeline files

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/nico/dev/arqui && npm test
```
Expected: All tests pass.

- [ ] **Step 2: Run build**

```bash
cd /Users/nico/dev/arqui && npm run build
```
Expected: Build succeeds without errors.

- [ ] **Step 3: Run lint**

```bash
cd /Users/nico/dev/arqui && npm run lint
```
Expected: No lint errors in new files.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
cd /Users/nico/dev/arqui && git add -A && git status
```
Only commit if there are changes. Message: `chore: document pipeline cleanup and lint fixes`
