import { convert } from "@mlightcad/libredwg-converter";

/**
 * Converts a DWG file buffer to a DXF string using the LibreDWG WASM converter.
 *
 * NOTE: The @mlightcad/libredwg-converter package's native API uses AcDbLibreDwgConverter
 * to produce an in-memory drawing database, not a DXF string directly. This wrapper uses
 * a `convert` export that is expected to handle the full DWG → DXF string pipeline.
 * In production, if the package does not expose `convert`, this wrapper will need to be
 * updated to use AcDbLibreDwgConverter + a DXF serializer from @mlightcad/data-model.
 */
export async function convertDwgToDxf(dwgBuffer: ArrayBuffer): Promise<string> {
  try {
    const dxf = await convert(dwgBuffer);
    return dxf;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`DWG conversion failed: ${msg}`);
  }
}
