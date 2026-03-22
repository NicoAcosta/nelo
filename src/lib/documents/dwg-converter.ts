/**
 * Nelo — DWG to DXF Converter
 *
 * Uses @mlightcad/libredwg-web WASM to parse DWG binary data directly
 * on the main thread (no Web Workers needed). The higher-level
 * AcDbLibreDwgConverter.parse() is skipped because it forces Worker-based
 * parsing which is incompatible with Node.js serverless environments.
 *
 * Instead, we:
 * 1. Use LibreDwg (WASM) to parse DWG binary → low-level DWG data
 * 2. Use LibreDwg.convert() to get a DwgDatabase model
 * 3. Use AcDbLibreDwgConverter's process* methods to populate AcDbDatabase
 * 4. Call AcDbDatabase.dxfOut() to export DXF
 */

import {
  AcDbDatabase,
  acdbHostApplicationServices,
} from "@mlightcad/data-model";
import { AcDbLibreDwgConverter } from "@mlightcad/libredwg-converter";
import { LibreDwg, Dwg_File_Type } from "@mlightcad/libredwg-web";

/** Expose protected process methods for server-side use (no Web Worker). */
class ServerDwgConverter extends AcDbLibreDwgConverter {
  override processLineTypes(...args: Parameters<AcDbLibreDwgConverter["processLineTypes"]>) {
    return super.processLineTypes(...args);
  }
  override processTextStyles(...args: Parameters<AcDbLibreDwgConverter["processTextStyles"]>) {
    return super.processTextStyles(...args);
  }
  override processDimStyles(...args: Parameters<AcDbLibreDwgConverter["processDimStyles"]>) {
    return super.processDimStyles(...args);
  }
  override processLayers(...args: Parameters<AcDbLibreDwgConverter["processLayers"]>) {
    return super.processLayers(...args);
  }
  override processViewports(...args: Parameters<AcDbLibreDwgConverter["processViewports"]>) {
    return super.processViewports(...args);
  }
  override processHeader(...args: Parameters<AcDbLibreDwgConverter["processHeader"]>) {
    return super.processHeader(...args);
  }
  override processBlockTables(...args: Parameters<AcDbLibreDwgConverter["processBlockTables"]>) {
    return super.processBlockTables(...args);
  }
  override processObjects(...args: Parameters<AcDbLibreDwgConverter["processObjects"]>) {
    return super.processObjects(...args);
  }
  override processBlocks(...args: Parameters<AcDbLibreDwgConverter["processBlocks"]>) {
    return super.processBlocks(...args);
  }
  override processEntities(...args: Parameters<AcDbLibreDwgConverter["processEntities"]>) {
    return super.processEntities(...args);
  }
}

let libredwg: LibreDwg | null = null;

/** Initialize the WASM module once. */
async function getLibreDwg() {
  if (libredwg) return libredwg;

  const { join } = await import("node:path");
  const wasmDir = join(
    process.cwd(),
    "node_modules",
    "@mlightcad",
    "libredwg-web",
    "wasm",
  );

  libredwg = await LibreDwg.create(wasmDir);
  return libredwg;
}

/**
 * Convert a DWG file buffer to DXF string.
 * Throws on unsupported DWG versions or corrupt files.
 */
export async function convertDwgToDxf(
  dwgBuffer: ArrayBuffer,
): Promise<string> {
  const dwg = await getLibreDwg();

  // 1. Parse the DWG binary via WASM (main thread, no workers)
  const dwgData = dwg.dwg_read_data(dwgBuffer, Dwg_File_Type.DWG);
  if (!dwgData) {
    throw new Error(
      "Failed to read DWG file. The file may be corrupt or use an unsupported version.",
    );
  }

  try {
    // 2. Convert low-level DWG data to a high-level database model
    const model = dwg.convert(dwgData);

    // 3. Populate AcDbDatabase using the converter's process methods
    //    (bypasses parse() which requires Web Workers)
    const converter = new ServerDwgConverter({ useWorker: false });
    const db = new AcDbDatabase();
    acdbHostApplicationServices().workingDatabase = db;

    converter.processLineTypes(model, db);
    converter.processTextStyles(model, db);
    converter.processDimStyles(model, db);
    converter.processLayers(model, db);
    if (db.tables.layerTable.numEntries === 0) {
      db.createDefaultData({ layer: true });
    }
    converter.processViewports(model, db);
    converter.processHeader(model, db);
    converter.processBlockTables(model, db);
    converter.processObjects(model, db);
    if (db.objects.layout.numEntries === 0) {
      db.createDefaultData({ layout: true });
    }
    await converter.processBlocks(model, db);
    await converter.processEntities(model, db, 100, { value: 0 }, undefined);

    // 4. Export as DXF
    const dxfString = db.dxfOut();

    if (!dxfString || dxfString.trim().length === 0) {
      throw new Error(
        "DWG conversion produced empty DXF output. The file may be corrupt or use an unsupported DWG version.",
      );
    }

    return dxfString;
  } finally {
    dwg.dwg_free(dwgData);
  }
}
