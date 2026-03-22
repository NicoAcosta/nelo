/**
 * Filter files to only those Claude can process directly (images and PDFs).
 * Used as a fallback when the document processing pipeline fails.
 */

const COMPATIBLE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];

export function filterClaudeCompatible(files: File[]): File[] {
  return files.filter((f) => {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    return COMPATIBLE_EXTENSIONS.includes(ext);
  });
}
