/**
 * Nelo — AI SDK Tool Definitions
 *
 * Tools that the LLM can call during conversation.
 * Each tool has a Zod input schema and an execute function.
 * User-facing messages are locale-aware.
 */

import { tool } from "ai";
import { z } from "zod";
import { computeEstimate } from "@/lib/estimate/engine";
import type { ProjectInputs, Estimate } from "@/lib/estimate/types";
import type { Locale } from "@/lib/i18n/types";

/**
 * Creates locale-aware chat tools.
 * The locale determines the language of user-facing messages in tool results.
 */
export function createChatTools(locale: Locale = "en") {
  const isEn = locale === "en";

  const collectProjectData = tool({
    description:
      "Collect structured construction project data. Call after the user answers a question. Include all known fields so far.",
    inputSchema: z.object({
      totalFloorAreaM2: z.number().positive().optional().describe("Total covered floor area in m2"),
      stories: z.number().int().min(1).optional().describe("Number of stories"),
      structureType: z
        .enum(["hormigon_armado", "ladrillo_portante", "steel_frame", "wood_frame", "estructura_metalica"])
        .optional()
        .describe("Main structural system"),
      roofType: z
        .enum(["azotea_inaccesible", "azotea_transitable", "chapa_trapezoidal", "chapa_prepintada", "tejas_ceramicas", "panel_sandwich"])
        .optional()
        .describe("Roof / ceiling type"),
      finishLevel: z
        .enum(["economico", "medio", "premium"])
        .optional()
        .describe("Finish level"),
      locationZone: z
        .enum(["caba", "gba_norte", "gba_sur", "gba_oeste"])
        .optional()
        .describe("Buenos Aires zone"),
      footprintM2: z.number().optional().describe("Ground floor footprint area in m2"),
      perimeterMl: z.number().optional().describe("Building perimeter in linear meters"),
      ceilingHeightM: z.number().optional().describe("Floor-to-ceiling height in meters"),
      bedroomCount: z.number().optional().describe("Number of bedrooms"),
      bathroomCount: z.number().optional().describe("Number of bathrooms"),
      kitchenCount: z.number().optional().describe("Number of kitchens"),
      doorCount: z.number().optional().describe("Total door count"),
      windowCount: z.number().optional().describe("Total window count"),
      hasBasement: z.boolean().optional().describe("Has basement?"),
      hasGarage: z.boolean().optional().describe("Has covered garage?"),
      hasGasInstallation: z.boolean().optional().describe("Has gas installation?"),
      foundationType: z
        .enum(["platea", "platea_vigas", "zapatas_vigas", "pilotes"])
        .optional()
        .describe("Foundation type"),
      slabType: z
        .enum(["maciza", "vigueta_ceramica", "vigueta_eps", "pretensada", "chapa_colaborante"])
        .optional()
        .describe("Slab type"),
    }),
    execute: async (data) => {
      const filledFields = Object.entries(data).filter(
        ([, v]) => v !== undefined && v !== null,
      ).length;

      const message = isEn
        ? `Data collected: ${filledFields} fields. ${filledFields >= 6 ? "You can request the budget whenever you want." : `At least ${6 - filledFields} more fields needed for an Express estimate.`}`
        : `Datos recopilados: ${filledFields} campos. ${filledFields >= 6 ? "Podes pedir el presupuesto cuando quieras." : `Faltan al menos ${6 - filledFields} campos mas para un estimado Express.`}`;

      return {
        collected: data,
        fieldsProvided: filledFields,
        message,
      };
    },
  });

  const runEstimate = tool({
    description:
      "Calculate the estimated construction budget. Call when enough data has been collected (minimum: area, stories, structure, roof, finishes, zone).",
    inputSchema: z.object({
      totalFloorAreaM2: z.number().positive().describe("Total covered floor area in m2"),
      stories: z.number().int().min(1).describe("Number of stories"),
      structureType: z
        .enum(["hormigon_armado", "ladrillo_portante", "steel_frame", "wood_frame", "estructura_metalica"])
        .describe("Main structural system"),
      roofType: z
        .enum(["azotea_inaccesible", "azotea_transitable", "chapa_trapezoidal", "chapa_prepintada", "tejas_ceramicas", "panel_sandwich"])
        .describe("Roof type"),
      finishLevel: z
        .enum(["economico", "medio", "premium"])
        .describe("Finish level"),
      locationZone: z
        .enum(["caba", "gba_norte", "gba_sur", "gba_oeste"])
        .describe("Buenos Aires zone"),
      footprintM2: z.number().optional(),
      perimeterMl: z.number().optional(),
      ceilingHeightM: z.number().optional(),
      bedroomCount: z.number().optional(),
      bathroomCount: z.number().optional(),
      kitchenCount: z.number().optional(),
      doorCount: z.number().optional(),
      windowCount: z.number().optional(),
      hasBasement: z.boolean().optional(),
      hasGarage: z.boolean().optional(),
      hasGasInstallation: z.boolean().optional(),
      foundationType: z
        .enum(["platea", "platea_vigas", "zapatas_vigas", "pilotes"])
        .optional(),
      slabType: z
        .enum(["maciza", "vigueta_ceramica", "vigueta_eps", "pretensada", "chapa_colaborante"])
        .optional(),
    }),
    execute: async (inputs): Promise<Estimate> => {
      const projectInputs: ProjectInputs = {
        totalFloorAreaM2: inputs.totalFloorAreaM2,
        stories: inputs.stories,
        structureType: inputs.structureType,
        roofType: inputs.roofType,
        finishLevel: inputs.finishLevel,
        locationZone: inputs.locationZone,
        footprintM2: inputs.footprintM2,
        perimeterMl: inputs.perimeterMl,
        ceilingHeightM: inputs.ceilingHeightM,
        bedroomCount: inputs.bedroomCount,
        bathroomCount: inputs.bathroomCount,
        kitchenCount: inputs.kitchenCount,
        doorCount: inputs.doorCount,
        windowCount: inputs.windowCount,
        hasBasement: inputs.hasBasement,
        hasGarage: inputs.hasGarage,
        hasGasInstallation: inputs.hasGasInstallation,
        foundationType: inputs.foundationType,
        slabType: inputs.slabType,
      };
      return computeEstimate(projectInputs, locale);
    },
  });

  const analyzeFloorPlan = tool({
    description:
      "Analyze a floor plan. If a Document Analysis preamble is present in the conversation with extracted dimensions and room data, USE THOSE EXACT MEASUREMENTS rather than estimating from the image. The image confirms spatial layout; the preamble provides precise numbers. When no preamble exists, estimate from the image as before.",
    inputSchema: z.object({
      imageDataUrl: z
        .string()
        .optional()
        .describe("Image data URL (base64) if available"),
      estimatedRooms: z
        .array(
          z.object({
            type: z.string().describe("Room type: bedroom, bathroom, kitchen, living, dining, etc."),
            approximateAreaM2: z.number().nullable().describe("Approximate area in m2"),
          }),
        )
        .describe("List of rooms identified in the floor plan"),
      totalAreaM2: z.number().nullable().describe("Approximate total area in m2"),
      doorCount: z.number().nullable().describe("Number of doors identified"),
      windowCount: z.number().nullable().describe("Number of windows identified"),
      bathroomCount: z.number().nullable().describe("Number of bathrooms"),
      kitchenCount: z.number().nullable().describe("Number of kitchens"),
      perimeterMl: z.number().nullable().describe("Estimated perimeter in linear meters"),
      confidence: z
        .enum(["low", "medium", "high"])
        .describe("Confidence level: low if rough estimate, medium if some references, high if clear dimensions"),
      layoutDescription: z.string().describe("Brief description of the layout"),
    }),
    execute: async (extraction) => {
      const message = isEn
        ? `Data extracted from floor plan (confidence: ${extraction.confidence}). Please confirm if correct or tell me what to change.`
        : `Datos extraidos del plano (confianza: ${extraction.confidence}). Por favor confirma si son correctos o decime que corregir.`;

      return {
        extraction: {
          rooms: extraction.estimatedRooms,
          totalAreaM2: extraction.totalAreaM2,
          doorCount: extraction.doorCount,
          windowCount: extraction.windowCount,
          bathroomCount: extraction.bathroomCount,
          kitchenCount: extraction.kitchenCount,
          perimeterMl: extraction.perimeterMl,
          layoutDescription: extraction.layoutDescription,
          confidence: extraction.confidence,
          rawNotes: "",
        },
        message,
      };
    },
  });

  const presentOptions = tool({
    description:
      "Present clickable options to the user. Call this when asking a question that has predefined choices (structure type, roof type, finish level, location zone, stories, yes/no). Include the question in your text message, then call this tool with the options.",
    inputSchema: z.object({
      questionId: z
        .string()
        .describe("Unique ID for this question, e.g. 'structureType'"),
      options: z
        .array(
          z.object({
            value: z.string().describe("Machine value, e.g. 'hormigon_armado'"),
            label: z
              .string()
              .describe("Human-readable label in the user's language"),
          }),
        )
        .min(2)
        .max(9)
        .describe("The options to present. 2-9 items."),
    }),
    execute: async (input) => ({
      questionId: input.questionId,
      options: input.options,
    }),
  });

  return {
    collectProjectData,
    runEstimate,
    analyzeFloorPlan,
    presentOptions,
  };
}

/** Default tools (English locale) for backward compatibility */
export const chatTools = createChatTools("en");
