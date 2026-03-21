/**
 * Nelo — Categories Configuration
 *
 * Single source of truth for all 26 construction categories.
 * Drives both the calculation engine AND the chatbot system prompt.
 *
 * Based on cotizador.xlsx structure (PyOO TPG2024 + FERES UT2).
 * Placeholder coefficients — will be calibrated with real data.
 */

import type {
  CategoryConfig,
  SubcategoryConfig,
  ItemConfig,
} from "@/lib/estimate/types";

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "trabajos_preliminares",
    code: "1",
    name: "Trabajos Preliminares",
    subcategories: [
      {
        id: "preliminares",
        code: "1",
        name: "Trabajos Preliminares",
        items: [
          { code: "1.01", description: "Limpieza general del terreno (incl. desmalezamiento)", unit: "m2", quantityCoefficient: { baseMeasurement: "footprint", multiplier: 1.5 }, referenceIncidence: 1.17 },
          { code: "1.02", description: "Obrador, depósito y sanitarios", unit: "m2", quantityCoefficient: { baseMeasurement: "fixed", multiplier: 4 }, referenceIncidence: 0.57 },
          { code: "1.03", description: "Nivelación del terreno", unit: "m3", conditions: [{ field: "hasBasement", operator: "not_exists" }] },
          { code: "1.04", description: "Tala de árboles", unit: "un", conditions: [{ field: "hasBasement", operator: "not_exists" }] },
          { code: "1.05", description: "Demolición parcial", unit: "m2", conditions: [{ field: "hasBasement", operator: "not_exists" }] },
        ],
      },
    ],
  },
  {
    id: "procedimientos_cumplimientos",
    code: "2",
    name: "Procedimientos y Cumplimientos",
    subcategories: [
      {
        id: "procedimientos",
        code: "2",
        name: "Procedimientos y Cumplimientos",
        items: [
          { code: "2.01", description: "Cerco de obra provisorio", unit: "ml", quantityCoefficient: { baseMeasurement: "perimeter", multiplier: 1.0 }, referenceIncidence: 0.29 },
          { code: "2.02", description: "Cartel de obra", unit: "m2", quantityCoefficient: { baseMeasurement: "fixed", multiplier: 2 }, referenceIncidence: 0.29 },
          { code: "2.03", description: "Replanteo y demarcación", unit: "m2", quantityCoefficient: { baseMeasurement: "footprint", multiplier: 1.0 }, referenceIncidence: 0.50 },
          { code: "2.04", description: "Agua de construcción", unit: "gl", quantityCoefficient: { baseMeasurement: "fixed", multiplier: 1 }, referenceIncidence: 0.17 },
          { code: "2.05", description: "Luz de obra", unit: "gl", quantityCoefficient: { baseMeasurement: "fixed", multiplier: 1 }, referenceIncidence: 0.49 },
        ],
      },
    ],
  },
  {
    id: "movimiento_suelos",
    code: "3",
    name: "Movimiento de Suelos",
    subcategories: [
      {
        id: "desmonte_excavacion",
        code: "3.1",
        name: "Desmonte y Excavación",
        items: [
          { code: "3.1.1", description: "Retiro de tierra vegetal esp. 0.30m", unit: "m3", quantityCoefficient: { baseMeasurement: "footprint", multiplier: 0.30 }, referenceIncidence: 0.19 },
          { code: "3.1.2", description: "Excavación para vigas de fundación", unit: "m3", quantityCoefficient: { baseMeasurement: "perimeter", multiplier: 0.12 } },
          { code: "3.1.3", description: "Excavación para tanque cisterna", unit: "m3", conditions: [{ field: "hasBasement", operator: "not_exists" }] },
          { code: "3.1.4", description: "Zanjas para instalaciones sanitarias", unit: "m3", quantityCoefficient: { baseMeasurement: "floor_area", multiplier: 0.02 } },
        ],
      },
      {
        id: "rellenos_compactacion",
        code: "3.2",
        name: "Rellenos y Compactación",
        items: [
          { code: "3.2.1", description: "Relleno con suelo seleccionado compactado", unit: "m3", quantityCoefficient: { baseMeasurement: "footprint", multiplier: 0.30 }, referenceIncidence: 2.08 },
          { code: "3.2.2", description: "Aporte y compactación de tosca h:0.30m", unit: "m3", quantityCoefficient: { baseMeasurement: "footprint", multiplier: 0.30 } },
        ],
      },
    ],
  },
  {
    id: "estructura_resistente",
    code: "4",
    name: "Estructura Resistente",
    subcategories: [
      {
        id: "hormigon_armado_insitu",
        code: "4.1",
        name: "Hormigón Armado (in situ)",
        items: [
          { code: "4.1.1", description: "Platea de fundación (35 kg/m³ de hierro)", unit: "m3", quantityCoefficient: { baseMeasurement: "footprint", multiplier: 0.22 }, referenceIncidence: 4.29, conditions: [{ field: "structureType", operator: "equals", value: "hormigon_armado" }] },
          { code: "4.1.2", description: "Vigas de encadenado", unit: "ml", quantityCoefficient: { baseMeasurement: "perimeter", multiplier: 1.0 }, referenceIncidence: 2.27, conditions: [{ field: "structureType", operator: "equals", value: "hormigon_armado" }] },
          { code: "4.1.3", description: "Columnas", unit: "m3", quantityCoefficient: { baseMeasurement: "floor_area", multiplier: 0.008 }, conditions: [{ field: "structureType", operator: "equals", value: "hormigon_armado" }] },
          { code: "4.1.4", description: "Vigas principales y secundarias", unit: "m3", quantityCoefficient: { baseMeasurement: "floor_area", multiplier: 0.012 }, conditions: [{ field: "structureType", operator: "equals", value: "hormigon_armado" }] },
          { code: "4.1.6", description: "Losa maciza", unit: "m3", quantityCoefficient: { baseMeasurement: "floor_area", multiplier: 0.20 }, conditions: [{ field: "slabType", operator: "equals", value: "maciza" }] },
          { code: "4.1.8", description: "Dinteles y refuerzos", unit: "ml", quantityCoefficient: { baseMeasurement: "door_count", multiplier: 1.2 }, conditions: [{ field: "structureType", operator: "equals", value: "hormigon_armado" }] },
        ],
      },
      {
        id: "hormigon_premoldeado",
        code: "4.2",
        name: "Hormigón Armado Premoldeado",
        items: [
          { code: "4.2.1", description: "Vigueta pretensada T50 + ladrillo cerámico + capa compresión", unit: "m2", quantityCoefficient: { baseMeasurement: "floor_area", multiplier: 1.0 }, referenceIncidence: 7.65, conditions: [{ field: "slabType", operator: "equals", value: "vigueta_ceramica" }] },
          { code: "4.2.2", description: "Vigueta pretensada + EPS + capa compresión", unit: "m2", quantityCoefficient: { baseMeasurement: "floor_area", multiplier: 1.0 }, conditions: [{ field: "slabType", operator: "equals", value: "vigueta_eps" }] },
        ],
      },
      {
        id: "steel_frame",
        code: "4.3",
        name: "Steel Frame",
        items: [
          { code: "4.3.1", description: "Perfilería galvanizada (montantes y soleras)", unit: "m2", quantityCoefficient: { baseMeasurement: "wall_area", multiplier: 1.0 }, conditions: [{ field: "structureType", operator: "equals", value: "steel_frame" }] },
          { code: "4.3.2", description: "Estructura de piso y techo en steel frame", unit: "m2", quantityCoefficient: { baseMeasurement: "floor_area", multiplier: 1.0 }, conditions: [{ field: "structureType", operator: "equals", value: "steel_frame" }] },
        ],
      },
    ],
  },
  {
    id: "mamposteria",
    code: "5",
    name: "Mampostería",
    subcategories: [
      {
        id: "ladrillo_comun",
        code: "5.1",
        name: "Ladrillo Común",
        items: [
          { code: "5.1.1", description: "Muro medianero ladrillo común esp.0.15m", unit: "m2", quantityCoefficient: { baseMeasurement: "wall_area", multiplier: 0.1 }, referenceIncidence: 0.41 },
        ],
      },
      {
        id: "ladrillo_ceramico_hueco",
        code: "5.2",
        name: "Ladrillo Cerámico Hueco",
        items: [
          { code: "5.2.1", description: "Tabique interior hueco cerámico 8×18×33", unit: "m2", quantityCoefficient: { baseMeasurement: "wall_area", multiplier: 0.3 }, conditions: [{ field: "structureType", operator: "not_equals", value: "steel_frame" }] },
          { code: "5.2.3", description: "Muro exterior hueco cerámico DM20 20×18×33", unit: "m2", quantityCoefficient: { baseMeasurement: "wall_area", multiplier: 0.6 }, referenceIncidence: 0.49, conditions: [{ field: "structureType", operator: "equals", value: "hormigon_armado" }] },
        ],
      },
      {
        id: "ladrillo_portante",
        code: "5.3",
        name: "Ladrillo Cerámico Portante",
        items: [
          { code: "5.3.1", description: "Muro portante cerámico esp. 0.20m", unit: "m2", quantityCoefficient: { baseMeasurement: "wall_area", multiplier: 0.8 }, referenceIncidence: 7.46, conditions: [{ field: "structureType", operator: "equals", value: "ladrillo_portante" }] },
          { code: "5.3.2", description: "Columna de bloque cerámico 20×20", unit: "ml", quantityCoefficient: { baseMeasurement: "stories", multiplier: 36 }, referenceIncidence: 3.83, conditions: [{ field: "structureType", operator: "equals", value: "ladrillo_portante" }] },
        ],
      },
      {
        id: "sistemas_secos",
        code: "5.5",
        name: "Sistemas Secos (Steel/Wood Frame)",
        items: [
          { code: "5.5.1", description: "Panel OSB + placa de yeso doble (interior)", unit: "m2", quantityCoefficient: { baseMeasurement: "wall_area", multiplier: 0.4 }, conditions: [{ field: "structureType", operator: "equals", value: "steel_frame" }] },
          { code: "5.5.2", description: "Panel cementicío (exterior)", unit: "m2", quantityCoefficient: { baseMeasurement: "wall_area", multiplier: 0.6 }, conditions: [{ field: "structureType", operator: "equals", value: "steel_frame" }] },
        ],
      },
    ],
  },
  // Remaining categories with simplified structure for now
  // These will be expanded with full subcategories as the data map lands
  ...[
    { id: "capas_aisladoras", code: "6", name: "Capas Aisladoras", referenceIncidence: 3.11 },
    { id: "cubierta_techo", code: "7", name: "Cubierta y Techo", referenceIncidence: 2.29 },
    { id: "revoques", code: "8", name: "Revoques", referenceIncidence: 8.84 },
    { id: "yeseria", code: "9", name: "Yesería", referenceIncidence: 2.57 },
    { id: "contrapisos", code: "10", name: "Contrapisos y Carpetas", referenceIncidence: 4.20 },
    { id: "carpetas", code: "11", name: "Carpetas", referenceIncidence: 1.63 },
    { id: "solados", code: "12", name: "Solados", referenceIncidence: 5.74 },
    { id: "zocalos", code: "13", name: "Zócalos", referenceIncidence: 0.36 },
    { id: "revestimientos", code: "14", name: "Revestimientos", referenceIncidence: 2.45 },
    { id: "carpinteria_metalica", code: "15", name: "Carpinterías y Herrerías Metálicas", referenceIncidence: 4.71 },
    { id: "carpinteria_aluminio", code: "16", name: "Carpintería de Aluminio", referenceIncidence: 3.20 },
    { id: "carpinteria_madera", code: "17", name: "Carpintería de Madera", referenceIncidence: 2.30 },
    { id: "escalera", code: "18", name: "Escalera", referenceIncidence: 1.61 },
    { id: "amoblamientos", code: "19", name: "Amoblamientos", referenceIncidence: 3.31 },
    { id: "instalacion_electrica", code: "20", name: "Instalaciones Eléctricas", referenceIncidence: 7.02 },
    { id: "instalacion_sanitaria", code: "21", name: "Instalaciones Sanitarias", referenceIncidence: 6.55 },
    { id: "instalacion_gas", code: "22", name: "Instalación de Gas", referenceIncidence: 3.54 },
    { id: "espejos", code: "23", name: "Espejos", referenceIncidence: 0.08 },
    { id: "pinturas", code: "24", name: "Pinturas", referenceIncidence: 1.86 },
    { id: "marmoleria", code: "25", name: "Marmolería", referenceIncidence: 0.88 },
    { id: "varios", code: "26", name: "Varios", referenceIncidence: 1.59 },
  ].map((cat): CategoryConfig => ({
    ...cat,
    subcategories: [{
      id: cat.id,
      code: cat.code,
      name: cat.name,
      items: [
        {
          code: `${cat.code}.0`,
          description: `${cat.name} (global placeholder)`,
          unit: "m2" as const,
          quantityCoefficient: { baseMeasurement: "floor_area" as const, multiplier: 1.0 },
          referenceIncidence: cat.referenceIncidence,
        },
      ],
    }],
  })),
];

/** Flat list of all category IDs */
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** Get a category by ID */
export function getCategoryById(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Get all line items across all categories */
export function getAllItems(): ItemConfig[] {
  return CATEGORIES.flatMap((cat) =>
    cat.subcategories.flatMap((sub) => sub.items)
  );
}

/** Express mode questions — the 5-8 key inputs */
export const EXPRESS_QUESTIONS = [
  { field: "totalFloorAreaM2", label: "¿Cuántos metros cuadrados tiene tu proyecto?", type: "number" as const, unit: "m²" },
  { field: "stories", label: "¿Cuántas plantas tiene el edificio?", type: "select" as const, options: ["1", "2", "3", "Más de 3"] },
  { field: "structureType", label: "¿Cuál es el sistema estructural principal?", type: "select" as const, options: ["H°A° tradicional", "Ladrillo portante", "Steel frame", "Wood frame", "Estructura metálica"] },
  { field: "roofType", label: "¿Tipo de cubierta / techo?", type: "select" as const, options: ["Azotea inaccesible", "Azotea transitable", "Chapa trapezoidal", "Chapa prepintada", "Tejas cerámicas", "Panel sándwich"] },
  { field: "finishLevel", label: "¿Nivel de terminaciones?", type: "select" as const, options: ["Económico", "Medio", "Premium"] },
  { field: "locationZone", label: "¿En qué zona de Buenos Aires?", type: "select" as const, options: ["CABA", "GBA Norte", "GBA Sur", "GBA Oeste"] },
] as const;
