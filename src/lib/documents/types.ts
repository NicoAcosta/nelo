import { z } from "zod";

export const extractedDataSchema = z.object({
  roomLabels: z.array(
    z.object({
      name: z.string(),
      areaM2: z.number().optional(),
      position: z.tuple([z.number(), z.number()]).optional(),
    }),
  ),
  dimensions: z.array(
    z.object({
      value: z.number(),
      unit: z.string(),
      label: z.string().optional(),
    }),
  ),
  summary: z.object({
    layerNames: z.array(z.string()),
    wallSegmentCount: z.number(),
    doorCount: z.number(),
    windowCount: z.number(),
    hasStairs: z.boolean(),
    hasFurniture: z.boolean(),
  }),
});

export const documentAnalysisSchema = z.object({
  structuredData: extractedDataSchema.nullable(),
  renderedImage: z.string(),
  metadata: z.object({
    originalFileName: z.string(),
    fileType: z.enum(["dwg", "dxf", "pdf", "image"]),
    fileSizeBytes: z.number(),
    layerCount: z.number().optional(),
    pageCount: z.number().optional(),
    conversionPath: z.string().optional(),
  }),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;
export type SupportedFileType = DocumentAnalysis["metadata"]["fileType"];
