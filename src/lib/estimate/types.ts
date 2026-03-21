/**
 * Nelo — Shared Types
 *
 * This file is the single source of truth for all data structures.
 * Every module imports from here. Do not define types elsewhere.
 */

// ---------------------------------------------------------------------------
// User Input Types
// ---------------------------------------------------------------------------

export type UserMode = "consumer" | "professional";

export type StructureType =
  | "hormigon_armado"
  | "ladrillo_portante"
  | "steel_frame"
  | "wood_frame"
  | "estructura_metalica";

export type FoundationType =
  | "platea"
  | "platea_vigas"
  | "zapatas_vigas"
  | "pilotes";

export type SlabType =
  | "maciza"
  | "vigueta_ceramica"
  | "vigueta_eps"
  | "pretensada"
  | "chapa_colaborante";

export type RoofType =
  | "azotea_inaccesible"
  | "azotea_transitable"
  | "chapa_trapezoidal"
  | "chapa_prepintada"
  | "tejas_ceramicas"
  | "panel_sandwich";

export type FinishLevel = "economico" | "medio" | "premium";

export type ExteriorWallType =
  | "hueco_8cm"
  | "hueco_12cm"
  | "hueco_20cm"
  | "ladrillo_portante"
  | "panel_steel_frame"
  | "panel_wood_frame";

export type LocationZone = "caba" | "gba_norte" | "gba_sur" | "gba_oeste";

/**
 * Core project inputs collected from the user.
 * Express mode fills ~8 fields; Detailed mode fills all.
 * Fields are optional because they are collected progressively.
 */
export interface ProjectInputs {
  // General (Express mode — required)
  totalFloorAreaM2?: number;
  stories?: number;
  structureType?: StructureType;
  roofType?: RoofType;
  finishLevel?: FinishLevel;
  locationZone?: LocationZone;

  // Dimensions (derived from floor plan or user input)
  footprintM2?: number; // ground floor area
  perimeterMl?: number;
  ceilingHeightM?: number; // default 2.60

  // Rooms
  bedroomCount?: number;
  bathroomCount?: number;
  kitchenCount?: number;

  // Doors and windows
  doorCount?: number;
  windowCount?: number;
  doorTypes?: DoorSpec[];
  windowTypes?: WindowSpec[];

  // Structure details (Detailed mode)
  foundationType?: FoundationType;
  slabType?: SlabType;
  exteriorWallType?: ExteriorWallType;
  interiorWallType?: string;
  hasBasement?: boolean;
  hasGarage?: boolean;
  hasQuincho?: boolean;
  hasPool?: boolean;
  hasElevator?: boolean;

  // MEP
  hasGasInstallation?: boolean;
  gasType?: "natural" | "glp_envasado" | "glp_granel";
  heatingSystem?: string;
  coolingSystem?: string;
  waterHeaterType?: string;
  electricalQuality?: "economica" | "media" | "premium";

  // Insulation
  roofInsulation?: string;
  wallInsulation?: string;

  // Exterior finishes
  facadeFinish?: string;
  floorType?: string;
  bathroomFloorType?: string;
  bathroomWallType?: string;

  // Carpentry
  exteriorCarpentryType?: string;
  hasDVH?: boolean;
  interiorDoorType?: string;

  // Extras
  hasStaircase?: boolean;
  staircaseType?: string;
  hasSidewalk?: boolean;
  hasPerimeterFence?: boolean;
  hasGarden?: boolean;
  includesFees?: boolean;
  includesSafety?: boolean;

  // Metadata
  hasAzotea?: boolean;
  hasGreenRoof?: boolean;
  solarWaterHeater?: boolean;
}

export interface DoorSpec {
  type: string; // e.g., "P01", "P02"
  material: string; // "madera", "chapa", "mdf"
  width: number; // meters
  height: number; // meters
  quantity: number;
}

export interface WindowSpec {
  type: string; // e.g., "V01", "V02"
  material: string; // "aluminio", "pvc", "madera"
  width: number;
  height: number;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Calculation Output Types
// ---------------------------------------------------------------------------

/** A single priced line item in the estimate */
export interface LineItem {
  code: string; // e.g., "4.1.1"
  categoryId: string; // e.g., "estructura_resistente"
  description: string; // Spanish description
  unit: Unit;
  quantity: number;
  materialCostPerUnit: number; // ARS
  laborCostPerUnit: number; // ARS
  totalCostPerUnit: number; // ARS
  subtotal: number; // quantity × totalCostPerUnit
  isActive: boolean; // false if excluded by conditional logic
  source: "calculated" | "placeholder" | "user_override";
}

export type Unit = "m2" | "m3" | "ml" | "un" | "gl" | "mes";

/** Totals for one of the 26 categories */
export interface CategoryTotal {
  id: string;
  name: string; // Spanish name, e.g., "Estructura Resistente"
  subtotal: number; // ARS
  incidencePercent: number; // % of direct cost
  lineItems: LineItem[];
}

export type ConfidenceLevel = "quick" | "standard" | "detailed";

/** Full estimate output */
export interface Estimate {
  // Primary outputs
  pricePerM2: number; // ARS/m²
  totalPrice: number; // ARS (final with IVA)

  // Cost structure
  directCost: number;
  overheadPercent: number;
  overheadAmount: number;
  profitPercent: number;
  profitAmount: number;
  subtotalBeforeTax: number;
  ivaPercent: number; // 21%
  ivaAmount: number;

  // Breakdown
  categories: CategoryTotal[];
  totalLineItems: number;
  activeLineItems: number; // after exclusion logic

  // Confidence
  confidence: ConfidenceLevel;
  confidenceRange: { low: number; high: number }; // percentage bounds
  inputsProvided: number;
  inputsTotal: number;

  // Metadata
  assumptions: Assumption[];
  locationZone: LocationZone;
  floorAreaM2: number;
  priceBaseDate: string; // ISO date
  iccBaseValue: number;
  iccCurrentValue: number;
}

export interface Assumption {
  field: string;
  label: string; // human-readable Spanish
  assumedValue: string;
  source: "default" | "floor_plan" | "user";
}

// ---------------------------------------------------------------------------
// Floor Plan Extraction Types
// ---------------------------------------------------------------------------

export interface FloorPlanExtraction {
  rooms: ExtractedRoom[];
  totalAreaM2: number | null;
  doorCount: number | null;
  windowCount: number | null;
  bathroomCount: number | null;
  kitchenCount: number | null;
  perimeterMl: number | null;
  layoutDescription: string;
  confidence: "low" | "medium" | "high";
  rawNotes: string; // any additional observations from the vision model
}

export interface ExtractedRoom {
  type: string; // "dormitorio", "baño", "cocina", "living", etc.
  approximateAreaM2: number | null;
}

// ---------------------------------------------------------------------------
// Category & Pricing Config Types
// ---------------------------------------------------------------------------

/** Definition of a construction category (rubro) */
export interface CategoryConfig {
  id: string;
  code: string; // e.g., "4"
  name: string; // Spanish, e.g., "Estructura Resistente"
  subcategories: SubcategoryConfig[];
}

export interface SubcategoryConfig {
  id: string;
  code: string; // e.g., "4.1"
  name: string;
  items: ItemConfig[];
}

export interface ItemConfig {
  code: string; // e.g., "4.1.1"
  description: string;
  unit: Unit;
  /** Coefficient to derive quantity from base measurements */
  quantityCoefficient?: QuantityCoefficient;
  /** Conditions under which this item is active */
  conditions?: ItemCondition[];
  /** Reference incidence % from FERES data */
  referenceIncidence?: number;
}

export interface QuantityCoefficient {
  /** Which base measurement to multiply */
  baseMeasurement:
    | "floor_area"
    | "footprint"
    | "perimeter"
    | "wall_area"
    | "roof_area"
    | "stories"
    | "door_count"
    | "window_count"
    | "bathroom_count"
    | "kitchen_count"
    | "fixed"; // for GL items
  /** Multiplier applied to the base measurement */
  multiplier: number;
}

export interface ItemCondition {
  field: keyof ProjectInputs;
  operator: "equals" | "not_equals" | "exists" | "not_exists";
  value?: string | number | boolean;
}

/** Unit cost entry for a specific line item in a specific region */
export interface UnitCost {
  itemCode: string;
  materialCost: number; // ARS per unit
  laborCost: number; // ARS per unit
  totalCost: number; // ARS per unit
  lastUpdated: string; // ISO date
  source: string; // e.g., "UOCRA + market research"
  isPlaceholder: boolean;
}

/** ICC index values for price updates */
export interface ICCIndex {
  date: string; // ISO date (monthly)
  generalValue: number;
  chapters: Record<string, number>; // chapter-level breakdown
}

// ---------------------------------------------------------------------------
// Price Update Formula
// ---------------------------------------------------------------------------

/**
 * Updates a base price using the ICC construction cost index.
 * price_updated = price_base × (ICC_current / ICC_base)
 */
export function updatePrice(
  priceBase: number,
  iccBase: number,
  iccCurrent: number,
): number {
  if (iccBase <= 0) return priceBase;
  return priceBase * (iccCurrent / iccBase);
}
