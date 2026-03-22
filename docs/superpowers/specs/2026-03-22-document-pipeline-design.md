# Smart Document Pipeline — Design Spec

**Date**: 2026-03-22
**Status**: Approved
**Scope**: AutoCAD (DWG/DXF), PDF, and image file support for Nelo construction cost estimator

## Problem

Nelo currently only accepts `image/*` uploads (PNG, JPEG, WebP). Architects and engineers work primarily in AutoCAD — their floor plans live in `.dwg` and `.dxf` files. PDF exports are also extremely common. Without support for these formats, the app is unusable for its core professional audience.

Current limitations:
- Only `image/*` accepted (HTML `accept` attribute)
- Single file at a time
- 10MB client / 5MB request body limits
- No structured data extraction — everything goes through Claude vision
- Claude has to guess dimensions from pixels instead of reading actual measurements

## Solution

A unified document processing pipeline that routes each file type through the optimal extraction strategy, producing both **structured data** (dimensions, room labels, entity counts) and a **rendered image** for every upload. Claude receives both channels — precise numbers from parsing, spatial understanding from vision.

## Supported File Types

| Format | Extensions | MIME Types | Max Size | Strategy |
|--------|-----------|------------|----------|----------|
| AutoCAD Drawing | `.dwg` | `application/x-dwg`, `application/acad` | 20MB | WASM convert to DXF, then parse + render |
| AutoCAD Exchange | `.dxf` | `application/dxf`, `text/plain` | 20MB | Parse structured data + render SVG to PNG |
| PDF | `.pdf` | `application/pdf` | 20MB | Extract text + render pages to PNG |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp` | `image/*` | 10MB | Direct to Claude vision (current flow) |

Multiple files: up to 3 per message. Per-type limits enforced individually (a 15MB DWG + a 8MB image is fine; a 25MB DWG is rejected). No cumulative limit beyond the per-file caps.

## Architecture

### Document Processing Pipeline

```
                    DocumentProcessor
                    (routes by file type)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     CAD Pipeline    PDF Pipeline    Image Pipeline
     (DWG/DXF)       (PDF)          (passthrough)
          │               │               │
          └───────┬───────┘               │
                  │                       │
            DocumentAnalysis         DocumentAnalysis
            {                        {
              structuredData: {...}     structuredData: null
              renderedImage: PNG        renderedImage: original
              metadata: {...}           metadata: {...}
            }                        }
```

### Core Types

These are Zod schemas (source of truth), with inferred TypeScript types. Consistent with project pattern of Zod-first validation.

```typescript
// Zod schemas — single source of truth
const extractedDataSchema = z.object({
  roomLabels: z.array(z.object({
    name: z.string(),
    areaM2: z.number().optional(),
    position: z.tuple([z.number(), z.number()]).optional(),
  })),
  dimensions: z.array(z.object({
    value: z.number(),
    unit: z.string(),
    label: z.string().optional(),
  })),
  summary: z.object({
    layerNames: z.array(z.string()),
    wallSegmentCount: z.number(),
    doorCount: z.number(),
    windowCount: z.number(),
    hasStairs: z.boolean(),
    hasFurniture: z.boolean(),
  }),
});

const documentAnalysisSchema = z.object({
  structuredData: extractedDataSchema.nullable(),
  renderedImage: z.string(), // base64 data URL (consistent with existing imageData pattern)
  metadata: z.object({
    originalFileName: z.string(),
    fileType: z.enum(["dwg", "dxf", "pdf", "image"]),
    fileSizeBytes: z.number(),
    layerCount: z.number().optional(),
    pageCount: z.number().optional(),
    conversionPath: z.string().optional(), // e.g. "DWG → DXF → SVG → PNG"
  }),
});

type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;
type ExtractedData = z.infer<typeof extractedDataSchema>;
```

**Note**: `renderedImage` is a base64 data URL string (not `Buffer`), consistent with the existing `imageData: string` pattern in `analyze.ts`.

### CAD Pipeline (DWG/DXF)

1. **DWG input**: Convert to DXF via `@mlightcad/libredwg-converter` (WASM, runs in serverless)
2. **Parse DXF**: Use `dxf` package (v5.3.1, actively maintained) to extract:
   - TEXT/MTEXT entities → room labels with area annotations
   - DIMENSION entities → explicit measurements
   - LINE/LWPOLYLINE on wall layers → wall segment count
   - INSERT blocks → door/window counts (by block name patterns)
   - Layer list → building system summary
3. **Render**: `dxf.toSVG()` → `@resvg/resvg-js` → PNG buffer
4. **Return**: `DocumentAnalysis` with full `ExtractedData` + rendered PNG

### PDF Pipeline

1. **Load PDF**: `pdfjs-dist` (v5.5.x)
2. **Extract text**: Text content with positions (room labels, dimension annotations)
3. **Render pages**: Each page → PNG image
4. **Return**: `DocumentAnalysis` with text-based `ExtractedData` + rendered page images

### Image Pipeline (unchanged)

1. Pass image buffer through as `renderedImage`
2. `structuredData: null`
3. Claude vision handles everything (current behavior)

## Integration with Chat

### How Claude receives processed documents

Two channels in one message:

1. **Rendered image** → image part in the message (Claude vision)
2. **Structured data** → text preamble injected before the user's message

Example preamble:

```
Document Analysis (extracted from AutoCAD DXF):
- File: project.dwg (converted to DXF, 12 layers detected)
- Rooms found: Living Room (45.2 m2), Kitchen (12.8 m2), Bedroom 1 (18.5 m2), Bathroom (6.3 m2)
- Dimensions: 14 measurements found (walls range 2.10m - 8.50m)
- Elements: 6 doors, 8 windows, 1 staircase
- Layers: A-WALL, A-DOOR, A-GLAZ, A-DIMS, A-TEXT, A-FURN

Use these exact measurements for cost estimation. The attached image shows the spatial layout.
```

### Code changes

**Modified files:**
- `src/app/api/chat/route.ts` — receive pre-processed document results, inject preamble into messages
- `src/components/chat-input.tsx` — expand `accept`, allow multiple files, add file type icons + processing indicator
- `src/lib/ai/tools.ts` — update `analyzeFloorPlan` tool to leverage structured preamble data
- `src/lib/floor-plan/analyze.ts` — refactor to accept structured + visual input

**New files:**
- `src/lib/documents/processor.ts` — main DocumentProcessor router
- `src/lib/documents/cad-pipeline.ts` — DWG/DXF extraction + rendering
- `src/lib/documents/pdf-pipeline.ts` — PDF text extraction + rendering
- `src/lib/documents/types.ts` — Zod schemas + inferred types (DocumentAnalysis, ExtractedData)
- `src/lib/documents/preamble.ts` — builds the structured text preamble from ExtractedData for Claude
- `src/app/api/documents/process/route.ts` — dedicated document processing route (isolates heavy deps from chat route)

## Client-Side UX

### File upload

- Accept: `.dwg,.dxf,.pdf,.png,.jpg,.jpeg,.webp`
- Multi-select up to 3 files
- File preview chips showing: type icon, filename (truncated), size, remove button

### Processing state

After send, assistant message shows "Analyzing AutoCAD file..." / "Processing PDF..." shimmer before Claude streams. DWG conversion takes 2-5 seconds.

### Error states

- File too large → inline error below chip
- Unsupported format → hint: "Try exporting as DXF or PDF from AutoCAD"
- Processing failure → Claude responds explaining the issue, suggests alternative format

## Error Handling & Degradation

**Principle: never block the user.** Every failure falls back to the next best thing.

### DWG degradation chain
1. WASM convert to DXF → full structured + vision
2. Conversion fails → suggest user export as DXF from AutoCAD

### DXF degradation chain
1. Parse + render → full structured + vision
2. Render fails → structured data only (no image)
3. Parse fails → try rendering to image, send vision-only
4. Total fail → suggest user export as PDF

### PDF degradation chain
1. Extract text + render → text labels + vision
2. Text extraction empty → vision-only with rendered pages
3. Render fails → error message

### Image (no degradation needed)
Current flow, no changes.

### Degradation communication
When falling back from structured+vision to vision-only, Claude's preamble includes:
> "Note: structured extraction was unavailable for this file. Analysis is based on visual inspection only. Measurements are approximate."

### Processing timeout
30 seconds max for the document pipeline. Abort and return error fallback if exceeded.

### DWG version compatibility
LibreDWG supports R13 (1994) through 2024. R12 and earlier or cutting-edge 2026 formats may fail.

## Testing Strategy

### Unit tests (Vitest)

- `DocumentProcessor` routing: correct pipeline for each extension
- `cad-pipeline.ts`: parse sample DXF → verify room labels, dimensions, entity counts
- `pdf-pipeline.ts`: parse sample PDF → verify text extraction
- `types.ts`: Zod schema validation for `DocumentAnalysis` and `ExtractedData`
- File validation: extension checks, size limits, MIME type mapping
- Structured preamble builder: `ExtractedData` → correct text output

### Test fixtures

Located in `src/lib/documents/__fixtures__/`:
- `simple-apartment.dxf` — basic floor plan with rooms, dimensions, door blocks
- `no-dimensions.dxf` — floor plan without dimension entities (partial extraction)
- `empty.dxf` — valid DXF with no entities (edge case)

### Not unit tested

- WASM DWG conversion (integration test territory)
- Claude interpretation quality (prompt engineering)
- SVG→PNG rendering (trust `@resvg/resvg-js`)

### Manual QA checklist

- [ ] Upload real `.dwg` from architect → conversion + extraction works
- [ ] Upload real `.dxf` → dimensions appear in Claude's response
- [ ] Upload PDF floor plan → pages render, Claude analyzes
- [ ] Upload regular image → existing flow works
- [ ] Upload 21MB DWG → rejection with clear message (exceeds 20MB per-file limit)
- [ ] Upload 11MB image → rejection (exceeds 10MB image limit)
- [ ] Upload corrupt file → graceful error message
- [ ] Upload 3 files at once → all processed
- [ ] DXF with no dimension entities → partial extraction, no crash

## Dependencies

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `dxf` | ^5.3.1 | DXF parsing + SVG rendering | Low — actively maintained, Sep 2025 |
| `@mlightcad/libredwg-converter` | ^3.5.8 | DWG→DXF conversion (WASM) | Medium — actively maintained but untested in our stack |
| `pdfjs-dist` | ^5.5.x | PDF text extraction + page rendering | Low — Mozilla, actively maintained |
| `@resvg/resvg-js` | ^2.6.2 | SVG→PNG server-side rendering | Low — Rust-based, production-grade |
| `@napi-rs/canvas` | ^0.1.x | Canvas backend for pdfjs-dist page rendering | Medium — needed for PDF→PNG in serverless |
| `@vercel/blob` | ^0.27.x | Staging area for large file uploads (>4.5MB) | Low — first-party Vercel package |

## Infrastructure & Deployment

### Separate document processing route

Heavy dependencies (`dxf`, `@mlightcad/libredwg-converter` WASM, `pdfjs-dist`, `@resvg/resvg-js`) are isolated in a dedicated API route: `POST /api/documents/process`. This keeps the chat route's bundle lean and avoids cold start bloat.

**Upload flow:**
1. Client uploads file(s) to `POST /api/documents/process`
2. Document route processes files, returns `DocumentAnalysis[]` as JSON (with base64 rendered images)
3. Client sends chat message via `useChat` with the processed results embedded (preamble text + image data URLs)
4. Chat route receives pre-processed data — no heavy deps needed

### Vercel request body limits

Vercel serverless functions have a **4.5MB default body size limit**. CAD files can be 15-20MB.

**Solution**: Configure the document processing route with increased body size in `vercel.json`:

```json
{
  "functions": {
    "src/app/api/documents/process/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

For files exceeding 4.5MB, use **Vercel Blob** as a staging area:
1. Client uploads large file directly to Vercel Blob via `@vercel/blob` client upload (up to 5TB, bypasses function body limit)
2. Client sends the Blob URL to `POST /api/documents/process`
3. Document route fetches the file from Blob, processes it, deletes the Blob after processing

For files under 4.5MB, direct upload to the route works fine.

### Function timeout

Document processing route: `maxDuration: 60` seconds. DWG WASM conversion is the slowest step (~5-10s). Total pipeline including rendering should complete in under 30s. The remaining 30s is buffer.

Chat route: keeps its existing `maxDuration: 60`. It no longer does document processing, so all 60s is available for Claude streaming.

### WASM cold start mitigation

`@mlightcad/libredwg-converter` WASM binary adds ~5-10MB to the function bundle. Mitigation:
- Isolate in the dedicated `/api/documents/process` route (not loaded for regular chat)
- `memory: 1024` to ensure enough RAM for WASM execution
- Accept that first DWG upload per cold start takes ~3-5s extra; subsequent ones in the same instance are fast

### File type routing: extension-based, not MIME

Browsers report inconsistent MIME types for DWG/DXF files (sometimes `application/octet-stream`, sometimes `text/plain`). **Route by file extension on the server**, not MIME type. Client-side `accept` attribute uses extensions for the file picker filter.

### PDF rendering in serverless

`pdfjs-dist` requires a canvas backend to render pages to PNG. In Vercel serverless:
- Use `@napi-rs/canvas` (Rust-based, no system deps) as the canvas implementation
- Alternatively, extract text only (no page rendering) and let Claude work with the user's description + any embedded images
- Fallback: if canvas rendering fails, return text extraction only with a note that visual rendering was unavailable

## Out of Scope

- BIM/Revit files (.rvt, .ifc) — Phase 2
- Spreadsheets (.xlsx) with BOQs — Phase 2
- Client-side DXF viewer (WebGL) — nice-to-have, not MVP
- DXF writing/export — not needed
- Geometric room area calculation from polyline topology — vision AI handles this
