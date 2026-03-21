/**
 * Nelo — Floor Plan Analysis
 *
 * Uses a vision model to extract approximate construction data
 * from uploaded floor plan images.
 *
 * Accuracy is limited (~12% for precise measurements).
 * The UX is: extract → present to user → user confirms/corrects.
 */

import { generateText, Output } from "ai";
import { z } from "zod";
import { visionModel } from "@/lib/ai/models";
import type { FloorPlanExtraction } from "@/lib/estimate/types";

export const floorPlanExtractionSchema = z.object({
  rooms: z.array(
    z.object({
      type: z
        .string()
        .describe(
          "Tipo de ambiente: dormitorio, baño, cocina, living, comedor, lavadero, estudio, pasillo, balcón, terraza, garage, etc.",
        ),
      approximateAreaM2: z
        .number()
        .nullable()
        .describe("Superficie aproximada en m² (null si no se puede estimar)"),
    }),
  ),
  totalAreaM2: z
    .number()
    .nullable()
    .describe("Superficie total aproximada en m²"),
  doorCount: z
    .number()
    .nullable()
    .describe("Cantidad de puertas visibles en el plano"),
  windowCount: z
    .number()
    .nullable()
    .describe("Cantidad de ventanas visibles en el plano"),
  bathroomCount: z.number().nullable().describe("Cantidad de baños"),
  kitchenCount: z.number().nullable().describe("Cantidad de cocinas"),
  perimeterMl: z
    .number()
    .nullable()
    .describe("Perímetro estimado en metros lineales"),
  layoutDescription: z
    .string()
    .describe(
      "Descripción breve del layout: distribución, circulación, orientación",
    ),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe(
      "Confianza en la extracción: low si el plano es borroso o a mano, medium si es un plano técnico sin cotas, high si tiene cotas y escala",
    ),
  rawNotes: z
    .string()
    .describe(
      "Observaciones adicionales: cotas visibles, escala, inconsistencias, detalles relevantes",
    ),
});

const ANALYSIS_PROMPT = `Sos un asistente experto en lectura de planos de arquitectura argentinos.

Analizá la imagen del plano y extraé la siguiente información:
- Identificá cada ambiente (dormitorio, baño, cocina, living, etc.)
- Estimá la superficie aproximada de cada ambiente en m²
- Contá las puertas y ventanas visibles
- Estimá el perímetro total del edificio
- Describí la distribución general

IMPORTANTE:
- Si hay cotas (dimensiones escritas), usalas para calcular las superficies con precisión
- Si no hay cotas, estimá basándote en las proporciones del plano y tamaños típicos argentinos
- Sé honesto sobre tu nivel de confianza: "low" si estimás a ojo, "medium" si tenés algunas referencias, "high" si hay cotas claras
- En "rawNotes" anotá cualquier detalle relevante que veas: escala, orientación, niveles, detalles constructivos`;

/**
 * Analyzes a floor plan image using the vision model.
 * Returns structured extraction data.
 */
export async function analyzeFloorPlanImage(
  imageData: string, // base64 data URL or URL
): Promise<FloorPlanExtraction> {
  const { output } = await generateText({
    model: visionModel,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: ANALYSIS_PROMPT },
          {
            type: "image",
            image: imageData,
          },
        ],
      },
    ],
    output: Output.object({ schema: floorPlanExtractionSchema }),
  });

  if (!output) {
    return {
      rooms: [],
      totalAreaM2: null,
      doorCount: null,
      windowCount: null,
      bathroomCount: null,
      kitchenCount: null,
      perimeterMl: null,
      layoutDescription: "No se pudo analizar el plano",
      confidence: "low",
      rawNotes: "La extracción falló o no devolvió datos estructurados",
    };
  }

  return output;
}
