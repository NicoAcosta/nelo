import { Helper } from "dxf";
import { Resvg } from "@resvg/resvg-js";
import type { DocumentAnalysis, ExtractedData } from "./types";

/** Room-type keywords to match in TEXT/MTEXT strings */
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

/** Check if layer name relates to walls */
function isWallLayer(layer: string): boolean {
  const lower = (layer || "").toLowerCase();
  return (
    lower.includes("wall") || lower.includes("muro") || lower.includes("pared")
  );
}

/** Check if an INSERT block name matches door patterns */
function isDoorBlock(blockName: string): boolean {
  const lower = (blockName || "").toLowerCase();
  return lower.includes("door") || lower.includes("puerta");
}

/** Check if an INSERT block name matches window patterns */
function isWindowBlock(blockName: string): boolean {
  const lower = (blockName || "").toLowerCase();
  return lower.includes("window") || lower.includes("ventana");
}

/** Check if layer name relates to stairs */
function hasStairLayer(layer: string): boolean {
  const lower = (layer || "").toLowerCase();
  return lower.includes("stair") || lower.includes("escalera");
}

/** Check if layer name relates to furniture */
function hasFurnitureLayer(layer: string): boolean {
  const lower = (layer || "").toLowerCase();
  return lower.includes("furn") || lower.includes("mueble");
}

interface DxfEntity {
  type: string;
  layer?: string;
  string?: string;
  x?: number;
  y?: number;
  block?: string;
  start?: { x: number; y: number; z: number };
  measureStart?: { x: number; y: number; z: number };
  measureEnd?: { x: number; y: number; z: number };
  [key: string]: unknown;
}

interface ParsedDxf {
  header: Record<string, unknown>;
  entities: DxfEntity[];
  tables: { layers: Record<string, unknown> };
  blocks: unknown[];
}

/**
 * Extract construction-relevant data from a DXF string.
 *
 * Parses the DXF, walks entities to find room labels, dimensions,
 * wall segments, doors, windows, and renders a PNG preview.
 */
export async function extractFromDxf(
  dxfContent: string,
): Promise<DocumentAnalysis> {
  const helper = new Helper(dxfContent);
  const parsed = helper.parsed as ParsedDxf;
  const entities = parsed.entities;

  // Collect unique layer names from the TABLES section
  const layerNames = Object.keys(parsed.tables.layers || {});

  // --- Room labels ---
  // Strategy: collect TEXT/MTEXT entities. Room names are identified by keywords.
  // Area annotations (e.g. "45.2 m2") are associated with the nearest preceding
  // or following room label by proximity.

  interface TextEntity {
    text: string;
    x: number;
    y: number;
    isRoom: boolean;
    area: number | undefined;
  }

  const textEntities: TextEntity[] = [];

  for (const entity of entities) {
    if (entity.type === "TEXT" || entity.type === "MTEXT") {
      const text = (entity.string || "").trim();
      if (!text) continue;
      textEntities.push({
        text,
        x: entity.x ?? 0,
        y: entity.y ?? 0,
        isRoom: isRoomLabel(text),
        area: extractArea(text),
      });
    }
  }

  // For MTEXT that contains both a room name and area in one string (e.g. "Kitchen 18.0 m2"),
  // parse it as a single room label with area.
  const roomLabels: ExtractedData["roomLabels"] = [];

  // First, handle combined MTEXT entries (room name + area in one string)
  const standaloneRooms: TextEntity[] = [];
  const areaAnnotations: TextEntity[] = [];

  for (const te of textEntities) {
    if (te.isRoom && te.area !== undefined) {
      // Combined: has both room name and area
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

    for (const ann of areaAnnotations) {
      const dx = room.x - ann.x;
      const dy = room.y - ann.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestArea = ann.area;
      }
    }

    // Only associate if within a reasonable distance (e.g. 5 units)
    roomLabels.push({
      name: room.text,
      areaM2: bestDist < 5 ? bestArea : undefined,
      position: [room.x, room.y],
    });

    // Remove matched area annotation so it isn't reused
    if (bestDist < 5) {
      const idx = areaAnnotations.findIndex((a) => a.area === bestArea);
      if (idx >= 0) areaAnnotations.splice(idx, 1);
    }
  }

  // --- Dimensions ---
  const dimensions: ExtractedData["dimensions"] = [];
  for (const entity of entities) {
    if (entity.type === "DIMENSION") {
      const ms = entity.measureStart;
      const me = entity.measureEnd;
      if (ms && me) {
        const dx = (me.x ?? 0) - (ms.x ?? 0);
        const dy = (me.y ?? 0) - (ms.y ?? 0);
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
          dimensions.push({
            value: Math.round(length * 100) / 100,
            unit: "m",
            label: undefined,
          });
        }
      }
    }
  }

  // --- Wall segments ---
  const wallTypes = new Set(["LINE", "LWPOLYLINE", "POLYLINE"]);
  let wallSegmentCount = 0;
  for (const entity of entities) {
    if (wallTypes.has(entity.type) && isWallLayer(entity.layer || "")) {
      wallSegmentCount++;
    }
  }

  // --- Doors & Windows ---
  let doorCount = 0;
  let windowCount = 0;
  for (const entity of entities) {
    if (entity.type === "INSERT") {
      if (isDoorBlock(entity.block || "")) doorCount++;
      if (isWindowBlock(entity.block || "")) windowCount++;
    }
  }

  // --- Stairs & Furniture from layer names ---
  const hasStairs = layerNames.some((l) => hasStairLayer(l));
  const hasFurniture = layerNames.some((l) => hasFurnitureLayer(l));

  // --- Render SVG to PNG ---
  let renderedImage = "";
  try {
    const svgString = helper.toSVG();
    const resvg = new Resvg(svgString, {
      fitTo: { mode: "width", value: 1024 },
      background: "white",
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    const base64 = Buffer.from(pngBuffer).toString("base64");
    renderedImage = `data:image/png;base64,${base64}`;
  } catch {
    // If SVG rendering fails (e.g. empty DXF with 0x0 viewBox), use a 1x1 transparent PNG
    renderedImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  }

  const structuredData: ExtractedData = {
    roomLabels,
    dimensions,
    summary: {
      layerNames,
      wallSegmentCount,
      doorCount,
      windowCount,
      hasStairs,
      hasFurniture,
    },
  };

  return {
    structuredData,
    renderedImage,
    metadata: {
      originalFileName: "unknown.dxf",
      fileType: "dxf",
      fileSizeBytes: Buffer.byteLength(dxfContent, "utf-8"),
      layerCount: layerNames.length,
      conversionPath: "dxf → parse → svg → png",
    },
  };
}
