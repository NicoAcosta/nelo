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
    return computeEstimate(inputs as ProjectInputs);
  },
});

/**
 * Analyzes an uploaded floor plan image.
 * Uses the vision model to extract approximate data.
 */
export const analyzeFloorPlan = tool({
  description:
    "Analiza una imagen de plano de planta subida por el usuario. Extrae datos aproximados: cantidad de ambientes, superficie estimada, puertas, ventanas. Llamar cuando el usuario sube una imagen de plano.",
  inputSchema: z.object({
    imageDescription: z
      .string()
      .describe("Descripción de lo que se ve en el plano, incluyendo ambientes, dimensiones visibles, puertas, ventanas"),
    estimatedRooms: z
      .array(
        z.object({
          type: z.string().describe("Tipo de ambiente: dormitorio, baño, cocina, living, comedor, etc."),
          approximateAreaM2: z.number().nullable().describe("Superficie aproximada en m²"),
        }),
      )
      .describe("Lista de ambientes identificados"),
    totalAreaM2: z.number().nullable().describe("Superficie total aproximada en m²"),
    doorCount: z.number().nullable().describe("Cantidad de puertas identificadas"),
    windowCount: z.number().nullable().describe("Cantidad de ventanas identificadas"),
    bathroomCount: z.number().nullable().describe("Cantidad de baños"),
    kitchenCount: z.number().nullable().describe("Cantidad de cocinas"),
    confidence: z
      .enum(["low", "medium", "high"])
      .describe("Nivel de confianza en la extracción"),
  }),
  execute: async (extraction) => {
    return {
      extraction,
      message: `Datos extraídos del plano (confianza: ${extraction.confidence}). Por favor confirmá si son correctos.`,
    };
  },
});

/** All tools available to the chat API */
export const chatTools = {
  collectProjectData,
  runEstimate,
  analyzeFloorPlan,
};
