import { detectFileType } from "./validation";
import { extractFromDxf } from "./cad-pipeline";
import { convertDwgToDxf } from "./dwg-converter";
import { extractFromPdf } from "./pdf-pipeline";
import type { DocumentAnalysis } from "./types";

const PROCESSING_TIMEOUT_MS = 30_000;

export async function processDocument(
  fileBuffer: ArrayBuffer,
  fileName: string,
): Promise<DocumentAnalysis> {
  const fileType = detectFileType(fileName);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${fileName}`);
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Document processing timed out (30s)")), PROCESSING_TIMEOUT_MS),
  );

  const processPromise = (async (): Promise<DocumentAnalysis> => {
    switch (fileType) {
      case "dwg": {
        const dxfContent = await convertDwgToDxf(fileBuffer);
        const analysis = await extractFromDxf(dxfContent);
        return {
          ...analysis,
          metadata: {
            ...analysis.metadata,
            originalFileName: fileName,
            fileType: "dwg",
            fileSizeBytes: fileBuffer.byteLength,
            conversionPath: "DWG → DXF → SVG → PNG",
          },
        };
      }
      case "dxf": {
        const dxfContent = new TextDecoder().decode(fileBuffer);
        const analysis = await extractFromDxf(dxfContent);
        return {
          ...analysis,
          metadata: {
            ...analysis.metadata,
            originalFileName: fileName,
            fileType: "dxf",
            fileSizeBytes: fileBuffer.byteLength,
          },
        };
      }
      case "pdf": {
        return extractFromPdf(fileBuffer, fileName);
      }
      case "image": {
        const uint8 = new Uint8Array(fileBuffer);
        const base64 = Buffer.from(uint8).toString("base64");
        const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
        };
        const mime = mimeMap[ext] ?? "image/png";
        return {
          structuredData: null,
          renderedImage: `data:${mime};base64,${base64}`,
          metadata: {
            originalFileName: fileName,
            fileType: "image",
            fileSizeBytes: fileBuffer.byteLength,
          },
        };
      }
    }
  })();

  return Promise.race([processPromise, timeoutPromise]);
}
