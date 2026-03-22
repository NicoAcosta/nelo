/**
 * Split a document analysis preamble from the user's display text.
 *
 * When a user uploads a file, the preamble (extracted rooms, dimensions, layers)
 * is wrapped in `<!-- doc-analysis -->` markers and prepended to the message.
 * This function separates the display text from the preamble so the chat bubble
 * shows only the user's intent, not the raw technical data.
 */

const MARKER = "<!-- doc-analysis -->";

/** Regex to extract file name from preamble line: "- File: name.ext, ..." */
const FILE_NAME_RE = /^- File:\s*(.+?)(?:,|$)/m;

/** Regex to extract file type from preamble header: "extracted from AutoCAD DXF" or "extracted from PDF" */
const FILE_TYPE_RE = /extracted from (?:AutoCAD\s+)?(\w+)/i;

export interface PreambleFile {
  name: string;
  type: string; // e.g., "DXF", "DWG", "PDF"
}

export interface SplitResult {
  displayText: string;
  hasPreamble: boolean;
  files: PreambleFile[];
}

export function splitPreambleFromDisplay(text: string): SplitResult {
  if (!text) {
    return { displayText: "", hasPreamble: false, files: [] };
  }

  const firstIdx = text.indexOf(MARKER);
  if (firstIdx === -1) {
    return { displayText: text, hasPreamble: false, files: [] };
  }

  const secondIdx = text.indexOf(MARKER, firstIdx + MARKER.length);
  if (secondIdx === -1) {
    return { displayText: text, hasPreamble: false, files: [] };
  }

  // Extract preamble content between markers
  const preambleContent = text.slice(firstIdx + MARKER.length, secondIdx);

  // Extract display text after the closing marker
  const displayText = text.slice(secondIdx + MARKER.length).trim();

  // Parse files from preamble — split by "Document Analysis" sections
  const sections = preambleContent.split(/Document Analysis/);
  const files: PreambleFile[] = [];

  for (const section of sections) {
    if (!section.trim()) continue;

    const nameMatch = section.match(FILE_NAME_RE);
    const typeMatch = section.match(FILE_TYPE_RE);

    if (nameMatch) {
      files.push({
        name: nameMatch[1].trim(),
        type: typeMatch ? typeMatch[1].toUpperCase() : "FILE",
      });
    }
  }

  return { displayText, hasPreamble: true, files };
}
