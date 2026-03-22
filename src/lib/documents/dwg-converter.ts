/**
 * Nelo — DWG to DXF Converter
 *
 * Uses @mlightcad/libredwg-converter (WASM) to parse DWG binary data
 * into an in-memory AcDbDatabase, then exports it as a DXF string
 * via AcDbDatabase.dxfOut().
 */

import {
  AcDbDatabase,
  AcDbDatabaseConverterManager,
  AcDbFileType,
} from "@mlightcad/data-model";
import { AcDbLibreDwgConverter } from "@mlightcad/libredwg-converter";

let converterRegistered = false;

/** Ensure the DWG converter is registered exactly once. */
function ensureConverterRegistered(): void {
  if (converterRegistered) return;
  const dwgConverter = new AcDbLibreDwgConverter({ useWorker: false });
  AcDbDatabaseConverterManager.instance.register(
    AcDbFileType.DWG,
    dwgConverter,
  );
  converterRegistered = true;
}

/**
 * Convert a DWG file buffer to DXF string.
 * Throws on unsupported DWG versions or corrupt files.
 */
export async function convertDwgToDxf(
  dwgBuffer: ArrayBuffer,
): Promise<string> {
  ensureConverterRegistered();

  const db = new AcDbDatabase();
  try {
    await db.read(dwgBuffer, { readOnly: true }, AcDbFileType.DWG);

    const dxfString = db.dxfOut();

    if (!dxfString || dxfString.trim().length === 0) {
      throw new Error(
        "DWG conversion produced empty DXF output. The file may be corrupt or use an unsupported DWG version.",
      );
    }

    return dxfString;
  } finally {
    db.close();
  }
}
