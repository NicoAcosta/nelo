import type { DocumentAnalysis } from "./types";

interface PreambleOptions {
  degraded?: boolean;
}

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
