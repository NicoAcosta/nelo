/**
 * Strip AutoCAD formatting codes from TEXT/MTEXT entity strings.
 *
 * DXF files embed formatting codes that are meaningful only inside AutoCAD.
 * This function removes them so extracted text is clean for display and LLM consumption.
 */
export function sanitizeAutoCADText(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. MTEXT curly-brace font codes: {\Ffont|flags;content} or {\ffont;content}
  //    Extract the inner content, discard the font directive.
  //    Loop handles nested font codes (inner braces resolved first).
  let prev;
  do {
    prev = text;
    text = text.replace(/\{\\[fF][^;]*;([^}]*)\}/g, "$1");
  } while (text !== prev);

  // 2. %%u — underline toggle (case-insensitive), just strip it
  text = text.replace(/%%[uU]/g, "");

  // 3. %%d — degree symbol
  text = text.replace(/%%[dD]/g, "°");

  // 4. %%p — plus/minus
  text = text.replace(/%%[pP]/g, "±");

  // 5. %%c — diameter
  text = text.replace(/%%[cC]/g, "⌀");

  // 6. \P — MTEXT paragraph break → space (case-insensitive for non-Autodesk writers)
  text = text.replace(/\\[pP]/g, " ");

  // 7. Collapse multiple whitespace and trim
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Strip xref prefixes from AutoCAD layer names.
 *
 * Xref layers use `$0$` as separator: `xref-SomeName$0$ACTUAL-LAYER`.
 * Greedy match handles nested xrefs.
 */
export function cleanLayerName(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^.*\$0\$/, "");
}
