import type { SupportedFileType } from "./types";

export const SUPPORTED_EXTENSIONS: Record<string, SupportedFileType> = {
  ".dwg": "dwg",
  ".dxf": "dxf",
  ".pdf": "pdf",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
};

export const FILE_SIZE_LIMITS: Record<SupportedFileType, number> = {
  dwg: 20 * 1024 * 1024,
  dxf: 20 * 1024 * 1024,
  pdf: 20 * 1024 * 1024,
  image: 10 * 1024 * 1024,
};

export const ACCEPT_STRING = Object.keys(SUPPORTED_EXTENSIONS).join(",");
export const MAX_FILES_PER_MESSAGE = 3;

export function detectFileType(fileName: string): SupportedFileType | null {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return null;
  const ext = fileName.slice(lastDot).toLowerCase();
  return SUPPORTED_EXTENSIONS[ext] ?? null;
}

interface ValidationResult {
  valid: boolean;
  fileType: SupportedFileType | null;
  error?: string;
}

export function validateFile(fileName: string, sizeBytes: number): ValidationResult {
  const fileType = detectFileType(fileName);

  if (!fileType) {
    const supported = Object.keys(SUPPORTED_EXTENSIONS).join(", ");
    return {
      valid: false,
      fileType: null,
      error: `Unsupported file type. Supported: ${supported}`,
    };
  }

  const maxSize = FILE_SIZE_LIMITS[fileType];
  const maxSizeMB = maxSize / (1024 * 1024);

  if (sizeBytes > maxSize) {
    return {
      valid: false,
      fileType,
      error: `File too large (${(sizeBytes / 1024 / 1024).toFixed(1)}MB). Max ${maxSizeMB}MB for ${fileType} files.`,
    };
  }

  return { valid: true, fileType };
}
