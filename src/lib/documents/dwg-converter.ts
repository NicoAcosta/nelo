/**
 * Nelo — DWG to DXF Converter
 *
 * Wraps @mlightcad/libredwg-converter WASM for DWG→DXF conversion.
 *
 * The package exports AcDbLibreDwgConverter which converts DWG binary data
 * into an in-memory drawing database. Full DXF serialization would require
 * additional work with @mlightcad/data-model.
 *
 * Current status: This module provides the interface but DWG conversion
 * is not yet fully wired. The processor router will fall back to suggesting
 * the user export as DXF from AutoCAD.
 */

/**
 * Convert a DWG file buffer to DXF string.
 * Throws on unsupported DWG versions or corrupt files.
 */
export async function convertDwgToDxf(dwgBuffer: ArrayBuffer): Promise<string> {
  // The @mlightcad/libredwg-converter package exports AcDbLibreDwgConverter
  // which produces an in-memory database, not a DXF string directly.
  // Full DWG→DXF requires additional serialization work.
  // For now, throw a descriptive error so the processor's degradation chain kicks in.
  throw new Error(
    "DWG conversion failed: Direct DWG parsing is not yet supported. Please export your file as DXF from AutoCAD.",
  );
}
