import type { DocumentAnalysis, ExtractedData } from "./types";

// Polyfill browser globals that pdfjs-dist expects at module load time.
// We only use pdfjs for text extraction (no rendering), so stubs are fine.
function ensurePdfjsPolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    globalThis.DOMMatrix = class DOMMatrix {
      a: number; b: number; c: number; d: number; e: number; f: number;
      constructor(init?: string | number[]) {
        const v = Array.isArray(init) ? init : [1, 0, 0, 1, 0, 0];
        this.a = v[0] ?? 1; this.b = v[1] ?? 0;
        this.c = v[2] ?? 0; this.d = v[3] ?? 1;
        this.e = v[4] ?? 0; this.f = v[5] ?? 0;
      }
    } as unknown as typeof DOMMatrix;
  }
  if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = class Path2D { constructor(_d?: string) {} } as unknown as typeof Path2D;
  }
}

async function loadPdfjs() {
  ensurePdfjsPolyfills();
  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return mod.getDocument;
}

/** Room-type keywords to match in PDF text items — same as CAD pipeline */
const ROOM_KEYWORDS = [
  // English
  "living",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining",
  "office",
  "garage",
  "laundry",
  "hallway",
  "closet",
  "balcony",
  "terrace",
  "studio",
  "lobby",
  "entry",
  "foyer",
  "room",
  "suite",
  "pantry",
  "attic",
  "basement",
  // Spanish
  "cocina",
  "dormitorio",
  "habitación",
  "habitacion",
  "baño",
  "bano",
  "comedor",
  "sala",
  "estar",
  "lavadero",
  "pasillo",
  "placard",
  "balcón",
  "balcon",
  "terraza",
  "estudio",
  "recepción",
  "recepcion",
  "vestíbulo",
  "vestibulo",
  "garaje",
  "cochera",
];

/** Regex to match area annotations like "45.2 m2", "45,2 m²", "12.5m2" */
const AREA_PATTERN = /(\d+[.,]\d+)\s*m[²2]/i;

/** Regex to match standalone dimension values like "3.50" or "4,20" */
const DIMENSION_PATTERN = /^\d+[.,]\d+$/;

/** Check if a string looks like a room label */
function isRoomLabel(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return ROOM_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Extract area value from a string, returns undefined if not found */
function extractArea(text: string): number | undefined {
  const match = text.match(AREA_PATTERN);
  if (!match) return undefined;
  return parseFloat(match[1].replace(",", "."));
}

interface PdfTextItem {
  str: string;
  transform: number[];
}

interface TextEntry {
  text: string;
  x: number;
  y: number;
  isRoom: boolean;
  area: number | undefined;
}

/**
 * Extract construction-relevant data from a PDF buffer.
 *
 * Uses pdfjs-dist to read text content from each page, then parses
 * room labels, area annotations, and dimension values from the text items.
 * PDF-to-PNG rendering requires @napi-rs/canvas which may not be available
 * in all environments — renderedImage falls back to an empty string.
 */
export async function extractFromPdf(
  pdfBuffer: ArrayBuffer,
  fileName: string,
): Promise<DocumentAnalysis> {
  const getDocument = await loadPdfjs();
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const allTextEntries: TextEntry[] = [];

  // Extract text from every page
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items as PdfTextItem[]) {
      const text = (item.str || "").trim();
      if (!text) continue;

      // PDF transform matrix: [a, b, c, d, e, f] where e=x, f=y
      const x = item.transform?.[4] ?? 0;
      const y = item.transform?.[5] ?? 0;

      allTextEntries.push({
        text,
        x,
        y,
        isRoom: isRoomLabel(text),
        area: extractArea(text),
      });
    }
  }

  // --- Room labels ---
  const roomLabels: ExtractedData["roomLabels"] = [];
  const standaloneRooms: TextEntry[] = [];
  const areaAnnotations: TextEntry[] = [];

  for (const te of allTextEntries) {
    if (te.isRoom && te.area !== undefined) {
      // Combined text has both room name and area (e.g. "Kitchen 18.0 m2")
      const nameMatch = te.text.match(AREA_PATTERN);
      const name = nameMatch
        ? te.text.substring(0, nameMatch.index).trim()
        : te.text;
      roomLabels.push({
        name,
        areaM2: te.area,
        position: [te.x, te.y],
      });
    } else if (te.isRoom) {
      standaloneRooms.push(te);
    } else if (te.area !== undefined) {
      areaAnnotations.push(te);
    }
  }

  // Match standalone room labels with nearby area annotations by proximity
  for (const room of standaloneRooms) {
    let bestArea: number | undefined;
    let bestDist = Infinity;

    let bestIdx = -1;
    for (let i = 0; i < areaAnnotations.length; i++) {
      const ann = areaAnnotations[i];
      const dx = room.x - ann.x;
      const dy = room.y - ann.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestArea = ann.area;
        bestIdx = i;
      }
    }

    // Only associate if within a reasonable proximity (PDF points, ~50pt ≈ 1.75cm)
    roomLabels.push({
      name: room.text,
      areaM2: bestDist < 100 ? bestArea : undefined,
      position: [room.x, room.y],
    });

    // Remove matched area annotation by index so duplicates aren't confused
    if (bestDist < 100 && bestIdx >= 0) {
      areaAnnotations.splice(bestIdx, 1);
    }
  }

  // --- Dimensions ---
  // Look for standalone numeric strings that match dimension patterns (e.g. "3.50")
  const dimensions: ExtractedData["dimensions"] = [];
  for (const te of allTextEntries) {
    if (!te.isRoom && te.area === undefined && DIMENSION_PATTERN.test(te.text)) {
      const value = parseFloat(te.text.replace(",", "."));
      if (value > 0) {
        dimensions.push({
          value,
          unit: "m",
          label: undefined,
        });
      }
    }
  }

  // PDFs don't have CAD-style layers, doors, windows, or furniture blocks,
  // so we populate the summary with zero/false defaults.
  const structuredData: ExtractedData = {
    roomLabels,
    dimensions,
    summary: {
      layerNames: [],
      wallSegmentCount: 0,
      doorCount: 0,
      windowCount: 0,
      hasStairs: false,
      hasFurniture: false,
    },
  };

  // PDF-to-PNG rendering requires @napi-rs/canvas which may not be available.
  // Fall back to empty string — the AI vision step will handle the original file.
  const renderedImage = "";

  return {
    structuredData,
    renderedImage,
    metadata: {
      originalFileName: fileName,
      fileType: "pdf",
      fileSizeBytes: pdfBuffer.byteLength,
      pageCount: numPages,
      conversionPath: "pdf → pdfjs text extraction",
    },
  };
}
