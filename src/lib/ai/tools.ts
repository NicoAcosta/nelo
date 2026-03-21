/**
 * Nelo — AI SDK Tool Definitions
 *
 * Tools that the LLM can call during conversation.
 * Each tool has a Zod input schema and an execute function.
 */

import { tool } from "ai";
import { z } from "zod";
import { computeEstimate } from "@/lib/estimate/engine";
import type { ProjectInputs, Estimate } from "@/lib/estimate/types";

/**
 * Collects structured project data from the conversation.
 * The LLM calls this after the user answers a question.
 */
export const collectProjectData = tool({
  description:
    "Recopila datos estructurados del proyecto de construcción. Llamar después de que el usuario responda una pregunta. Incluir todos los campos conocidos hasta el momento.",
  inputSchema: z.object({
    totalFloorAreaM2: z.number().optional().describe("Superficie cubierta total en m²"),
    stories: z.number().optional().describe("Cantidad de plantas"),
    structureType: z
      .enum(["hormigon_armado", "ladrillo_portante", "steel_frame", "wood_frame", "estructura_metalica"])
      .optional()
      .describe("Sistema estructural principal"),
    roofType: z
      .enum(["azotea_inaccesible", "azotea_transitable", "chapa_trapezoidal", "chapa_prepintada", "tejas_ceramicas", "panel_sandwich"])
      .optional()
      .describe("Tipo de cubierta / techo"),
    finishLevel: z
      .enum(["economico", "medio", "premium"])
      .optional()
      .describe("Nivel de terminaciones"),
    locationZone: z
      .enum(["caba", "gba_norte", "gba_sur", "gba_oeste"])
      .optional()
      .describe("Zona de Buenos Aires"),
    footprintM2: z.number().optional().describe("Superficie de pisada (planta baja) en m²"),
    perimeterMl: z.number().optional().describe("Perímetro del edificio en metros lineales"),
    ceilingHeightM: z.number().optional().describe("Altura de piso a techo en metros"),
    bedroomCount: z.number().optional().describe("Cantidad de dormitorios"),
    bathroomCount: z.number().optional().describe("Cantidad de baños"),
    kitchenCount: z.number().optional().describe("Cantidad de cocinas"),
    doorCount: z.number().optional().describe("Cantidad total de puertas"),
    windowCount: z.number().optional().describe("Cantidad total de ventanas"),
    hasBasement: z.boolean().optional().describe("¿Tiene subsuelo?"),
    hasGarage: z.boolean().optional().describe("¿Tiene cochera cubierta?"),
    hasGasInstallation: z.boolean().optional().describe("¿Tiene instalación de gas?"),
    foundationType: z
      .enum(["platea", "platea_vigas", "zapatas_vigas", "pilotes"])
      .optional()
      .describe("Tipo de fundación"),
    slabType: z
      .enum(["maciza", "vigueta_ceramica", "vigueta_eps", "pretensada", "chapa_colaborante"])
      .optional()
      .describe("Tipo de losa"),
  }),
  execute: async (data) => {
    // Return the collected data — the LLM accumulates this across turns
    const filledFields = Object.entries(data).filter(
      ([, v]) => v !== undefined && v !== null,
    ).length;

    return {
      collected: data,
      fieldsProvided: filledFields,
      message: `Datos recopilados: ${filledFields} campos. ${filledFields >= 6 ? "Podés pedir el presupuesto cuando quieras." : `Faltan al menos ${6 - filledFields} campos más para un estimado Express.`}`,
    };
  },
});

/**
 * Runs the full estimation pipeline.
 * The LLM calls this when enough data has been collected.
 */
export const runEstimate = tool({
  description:
    "Calcula el presupuesto estimado de construcción. Llamar cuando se tengan suficientes datos (mínimo: superficie, plantas, estructura, cubierta, terminaciones, zona).",
  inputSchema: z.object({
    totalFloorAreaM2: z.number().describe("Superficie cubierta total en m²"),
    stories: z.number().describe("Cantidad de plantas"),
    structureType: z
      .enum(["hormigon_armado", "ladrillo_portante", "steel_frame", "wood_frame", "estructura_metalica"])
      .describe("Sistema estructural principal"),
    roofType: z
      .enum(["azotea_inaccesible", "azotea_transitable", "chapa_trapezoidal", "chapa_prepintada", "tejas_ceramicas", "panel_sandwich"])
      .describe("Tipo de cubierta"),
    finishLevel: z
      .enum(["economico", "medio", "premium"])
      .describe("Nivel de terminaciones"),
    locationZone: z
      .enum(["caba", "gba_norte", "gba_sur", "gba_oeste"])
      .describe("Zona de Buenos Aires"),
    // Optional fields that improve accuracy
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
    return computeEstimate(projectInputs);
  },
});

/**
 * Analyzes an uploaded floor plan image.
 *
 * The LLM can see the image in the conversation (vision-capable model).
 * This tool lets it structure its analysis into a typed extraction.
 * It also triggers a dedicated vision call for higher-quality extraction.
 */
export const analyzeFloorPlan = tool({
  description:
    "Analiza una imagen de plano de planta. Cuando el usuario sube una imagen, describí lo que ves y llamá esta herramienta con los datos extraídos. El usuario va a confirmar o corregir.",
  inputSchema: z.object({
    imageDataUrl: z
      .string()
      .optional()
      .describe("Data URL de la imagen (base64) si está disponible"),
    estimatedRooms: z
      .array(
        z.object({
          type: z.string().describe("Tipo de ambiente: dormitorio, baño, cocina, living, comedor, etc."),
          approximateAreaM2: z.number().nullable().describe("Superficie aproximada en m²"),
        }),
      )
      .describe("Lista de ambientes identificados en el plano"),
    totalAreaM2: z.number().nullable().describe("Superficie total aproximada en m²"),
    doorCount: z.number().nullable().describe("Cantidad de puertas identificadas"),
    windowCount: z.number().nullable().describe("Cantidad de ventanas identificadas"),
    bathroomCount: z.number().nullable().describe("Cantidad de baños"),
    kitchenCount: z.number().nullable().describe("Cantidad de cocinas"),
    perimeterMl: z.number().nullable().describe("Perímetro estimado en metros lineales"),
    confidence: z
      .enum(["low", "medium", "high"])
      .describe("Nivel de confianza: low si estimaste a ojo, medium si hay algunas referencias, high si hay cotas claras"),
    layoutDescription: z.string().describe("Descripción breve de la distribución"),
  }),
  execute: async (extraction) => {
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
      message: `Datos extraídos del plano (confianza: ${extraction.confidence}). Por favor confirmá si son correctos o decime qué corregir.`,
    };
  },
});

/** All tools available to the chat API */
export const chatTools = {
  collectProjectData,
  runEstimate,
  analyzeFloorPlan,
};
