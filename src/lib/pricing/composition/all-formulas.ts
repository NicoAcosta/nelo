/**
 * Nelo — Complete Composition Formulas (Categories 1–26)
 *
 * Defines how to compute the unit cost for every line item using:
 *   unit cost = (labor hours × UOCRA effective rate) + (material qty × retail price × wholesale discount)
 *
 * Per D-03: composition = (labor hours × UOCRA rate) + (material qty × market price).
 * Per D-13: FERES incidence percentages NOT used — each price derived from composition independently.
 * Per D-14: lump-sum items (Seguridad e Higiene, PGA) computed as % of direct cost.
 *
 * Material retail prices sourced from MercadoLibre AMBA ranges (Mar 2026).
 * Labor rates from UOCRA paritaria Feb-Mar 2026 via CREW_COMPOSITIONS.
 */

import type { CompositionFormula } from "./formulas";

// ---------------------------------------------------------------------------
// Lump-Sum Items (D-14)
// Items calculated as % of direct cost rather than per-unit composition.
// ---------------------------------------------------------------------------

export const LUMP_SUM_ITEMS: Record<string, { percentOfDirectCost: number; description: string }> = {
  "25.0": {
    percentOfDirectCost: 1.75, // Midpoint of 1.5–2% per Argentine construction standards
    description: "Seguridad e Higiene (1.75% of direct cost)",
  },
  "26.0": {
    percentOfDirectCost: 0.75, // Midpoint of 0.5–1% per Argentine construction standards
    description: "Plan de Gestión Ambiental (0.75% of direct cost)",
  },
};

// ---------------------------------------------------------------------------
// Category 1: Trabajos Preliminares
// ---------------------------------------------------------------------------

const CAT1_FORMULAS: CompositionFormula[] = [
  {
    itemCode: "1.01",
    description: "Limpieza general del terreno (incl. desmalezamiento) — m2",
    // 0.1 hr oficial + 0.2 hr ayudante per m2 for light clearing
    crewType: { oficialHours: 0.1, ayudanteHours: 0.2 },
    materials: [
      // Bolsa de residuos y pequeñas herramientas — minimal material cost
      { name: "Bolsa de residuos 90L (5 bolsas/m2)", quantity: 0.05, retailPricePerUnit: 1200, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "1.02",
    description: "Obrador, depósito y sanitarios — m2 de obrador",
    // Modular unit requires carpenter + helper: ~3 hr oficial + 2 hr ayudante to erect 1 m2
    crewType: { oficialHours: 3.0, ayudanteHours: 2.0 },
    materials: [
      // Maderas y chapas para obrador provisorio
      { name: "Tablón de madera 3×0.20m", quantity: 2.0, retailPricePerUnit: 8500, wholesaleCategory: "standard" },
      { name: "Chapa galvanizada acanalada 1m2", quantity: 1.2, retailPricePerUnit: 6500, wholesaleCategory: "standard" },
      { name: "Puerta chapa 0.80×2.0m (amortización)", quantity: 0.1, retailPricePerUnit: 45000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "1.03",
    description: "Nivelación del terreno — m3",
    crewType: { oficialHours: 0.5, ayudanteHours: 1.0 },
    materials: [
      // Mainly labor; small equipment amortization
      { name: "Alquiler de motosierra/maquinaria (amort.)", quantity: 0.1, retailPricePerUnit: 5000, wholesaleCategory: "specialty" },
    ],
  },
  {
    itemCode: "1.04",
    description: "Tala de árboles — unidad",
    crewType: { oficialHours: 4.0, ayudanteHours: 4.0 },
    materials: [
      { name: "Alquiler de motosierra", quantity: 1.0, retailPricePerUnit: 8000, wholesaleCategory: "specialty" },
      { name: "Equipo protección personal", quantity: 1.0, retailPricePerUnit: 3000, wholesaleCategory: "specialty" },
    ],
  },
  {
    itemCode: "1.05",
    description: "Demolición parcial — m2",
    crewType: { oficialHours: 1.5, ayudanteHours: 2.0 },
    materials: [
      { name: "Alquiler de compresor/martillo neumático (amort. por m2)", quantity: 0.2, retailPricePerUnit: 8000, wholesaleCategory: "specialty" },
      { name: "Bolsa de escombros (acondicionamiento)", quantity: 0.5, retailPricePerUnit: 2000, wholesaleCategory: "standard" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Category 2: Procedimientos y Cumplimientos
// ---------------------------------------------------------------------------

const CAT2_FORMULAS: CompositionFormula[] = [
  {
    itemCode: "2.01",
    description: "Cerco de obra provisorio — ml",
    // ~1 hr oficial + 0.5 hr ayudante per ml to set fence post and panel
    crewType: { oficialHours: 1.0, ayudanteHours: 0.5 },
    materials: [
      { name: "Panel de cerco metálico 2.5m (amortización por ml)", quantity: 0.4, retailPricePerUnit: 12000, wholesaleCategory: "standard" },
      { name: "Poste metálico 2m (amortización)", quantity: 0.2, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "2.02",
    description: "Cartel de obra — m2",
    crewType: { oficialHours: 2.0, ayudanteHours: 1.5 },
    materials: [
      { name: "Chapa galvanizada 1×2m", quantity: 0.5, retailPricePerUnit: 9500, wholesaleCategory: "standard" },
      { name: "Pintura vinílica 1L", quantity: 0.5, retailPricePerUnit: 6000, wholesaleCategory: "standard" },
      { name: "Estructura tubular (amortización por m2)", quantity: 1.0, retailPricePerUnit: 5000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "2.03",
    description: "Replanteo y demarcación — m2",
    // Topographer-equivalent work: ~0.15 hr oficial + 0.05 hr ayudante per m2
    crewType: { oficialHours: 0.15, ayudanteHours: 0.05 },
    materials: [
      { name: "Tiza y clavos para replanteo (por m2)", quantity: 1.0, retailPricePerUnit: 150, wholesaleCategory: "standard" },
      { name: "Hilo de albañil 50m (amort. por m2)", quantity: 0.02, retailPricePerUnit: 3500, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "2.04",
    description: "Agua de construcción — global (lump sum)",
    // Monthly water service — priced as lump sum global, scaled to a 100m2 project
    crewType: { oficialHours: 0, ayudanteHours: 4.0 },
    materials: [
      { name: "Tasa de agua (servicio mensual x6 meses)", quantity: 6, retailPricePerUnit: 15000, wholesaleCategory: "specialty" },
      { name: "Mangueras y accesorios", quantity: 1, retailPricePerUnit: 8000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "2.05",
    description: "Luz de obra — global (lump sum)",
    crewType: { oficialHours: 4.0, ayudanteHours: 2.0 },
    materials: [
      { name: "Tablero eléctrico provisorio", quantity: 1, retailPricePerUnit: 45000, wholesaleCategory: "specialty" },
      { name: "Cable 2.5mm rollo 20m", quantity: 1, retailPricePerUnit: 11000, wholesaleCategory: "specialty" },
      { name: "Lamparas LED obra (x4)", quantity: 4, retailPricePerUnit: 3500, wholesaleCategory: "standard" },
      { name: "Tasa electricidad (x6 meses)", quantity: 6, retailPricePerUnit: 8000, wholesaleCategory: "specialty" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Category 3: Movimiento de Suelos
// ---------------------------------------------------------------------------

const CAT3_FORMULAS: CompositionFormula[] = [
  {
    itemCode: "3.1.1",
    description: "Retiro de tierra vegetal esp. 0.30m — m3",
    // Mostly manual/mechanical — 0.3 hr oficial + 0.5 hr ayudante per m3
    crewType: { oficialHours: 0.3, ayudanteHours: 0.5 },
    materials: [
      { name: "Alquiler miniexcavadora (amort. por m3)", quantity: 0.15, retailPricePerUnit: 15000, wholesaleCategory: "specialty" },
    ],
  },
  {
    itemCode: "3.1.2",
    description: "Excavación para vigas de fundación — m3",
    crewType: { oficialHours: 0.5, ayudanteHours: 1.0 },
    materials: [
      { name: "Alquiler retroexcavadora (amort. por m3)", quantity: 0.2, retailPricePerUnit: 18000, wholesaleCategory: "specialty" },
    ],
  },
  {
    itemCode: "3.1.3",
    description: "Excavación para tanque cisterna — m3",
    crewType: { oficialHours: 1.0, ayudanteHours: 2.0 },
    materials: [
      { name: "Alquiler retroexcavadora (amort. por m3)", quantity: 0.3, retailPricePerUnit: 18000, wholesaleCategory: "specialty" },
    ],
  },
  {
    itemCode: "3.1.4",
    description: "Zanjas para instalaciones sanitarias — m3",
    // Narrow trenches — mostly manual
    crewType: { oficialHours: 1.5, ayudanteHours: 2.5 },
    materials: [
      { name: "Apuntamiento tablas (amort. por m3)", quantity: 0.1, retailPricePerUnit: 5000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "3.2.1",
    description: "Relleno con suelo seleccionado compactado — m3",
    crewType: { oficialHours: 0.5, ayudanteHours: 1.0 },
    materials: [
      { name: "Suelo seleccionado (m3 puesto en obra)", quantity: 1.2, retailPricePerUnit: 18000, wholesaleCategory: "bulk" },
      { name: "Alquiler pisón compactador (amort. por m3)", quantity: 0.15, retailPricePerUnit: 5000, wholesaleCategory: "specialty" },
    ],
  },
  {
    itemCode: "3.2.2",
    description: "Aporte y compactación de tosca h:0.30m — m3",
    crewType: { oficialHours: 0.4, ayudanteHours: 0.8 },
    materials: [
      { name: "Tosca (m3 puesto en obra)", quantity: 1.2, retailPricePerUnit: 15000, wholesaleCategory: "bulk" },
      { name: "Alquiler pisón compactador (amort. por m3)", quantity: 0.15, retailPricePerUnit: 5000, wholesaleCategory: "specialty" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Category 4: Estructura Resistente
// ---------------------------------------------------------------------------

const CAT4_FORMULAS: CompositionFormula[] = [
  {
    itemCode: "4.1.1",
    description: "Platea de fundación (35 kg/m³ de hierro) — m3",
    // concrete_m3: 3.0 hr oficial + 4.0 hr ayudante per m3
    crewType: "concrete_m3",
    materials: [
      // H-21 hormigón: ~7 bolsas cemento/m3 + arena + piedra
      { name: "Cemento 50kg (7 bolsas/m3)", quantity: 7, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.6 m3/m3 hormigón)", quantity: 0.6, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Piedra partida 6-19mm m3 (0.8 m3/m3)", quantity: 0.8, retailPricePerUnit: 38000, wholesaleCategory: "bulk" },
      // 35 kg hierro/m3 — bars Fe-ADN 420
      { name: "Hierro 10mm barra 12m (35kg/m3)", quantity: 1.25, retailPricePerUnit: 28000, wholesaleCategory: "bulk" },
      { name: "Alambre recocido 0.7kg/m3", quantity: 0.7, retailPricePerUnit: 3500, wholesaleCategory: "standard" },
      { name: "Tabla encofrado (amort. 5 usos)", quantity: 1.0, retailPricePerUnit: 4000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "4.1.2",
    description: "Vigas de encadenado — ml",
    // Smaller cross-section, ~1.5 hr oficial + 2.0 hr ayudante per ml
    crewType: { oficialHours: 1.5, ayudanteHours: 2.0 },
    materials: [
      { name: "Cemento 50kg (2.5 bolsas/ml)", quantity: 2.5, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.2m3/ml)", quantity: 0.2, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Piedra partida m3 (0.25m3/ml)", quantity: 0.25, retailPricePerUnit: 38000, wholesaleCategory: "bulk" },
      { name: "Hierro 8mm barra 12m (12kg/ml)", quantity: 0.67, retailPricePerUnit: 18000, wholesaleCategory: "bulk" },
      { name: "Tabla encofrado (amort.)", quantity: 0.5, retailPricePerUnit: 4000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "4.1.3",
    description: "Columnas — m3",
    // Columns require formwork and careful pouring: ~4.0 hr + 4.0 hr per m3
    crewType: { oficialHours: 4.0, ayudanteHours: 4.0 },
    materials: [
      { name: "Cemento 50kg (7 bolsas/m3)", quantity: 7, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.6m3/m3)", quantity: 0.6, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Piedra partida m3 (0.8m3/m3)", quantity: 0.8, retailPricePerUnit: 38000, wholesaleCategory: "bulk" },
      { name: "Hierro 10mm barra 12m (80kg/m3)", quantity: 2.9, retailPricePerUnit: 28000, wholesaleCategory: "bulk" },
      { name: "Encofrado metálico (amort. 10 usos)", quantity: 1.5, retailPricePerUnit: 8000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "4.1.4",
    description: "Vigas principales y secundarias — m3",
    crewType: { oficialHours: 3.5, ayudanteHours: 3.5 },
    materials: [
      { name: "Cemento 50kg (7 bolsas/m3)", quantity: 7, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.6m3/m3)", quantity: 0.6, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Piedra partida m3 (0.8m3/m3)", quantity: 0.8, retailPricePerUnit: 38000, wholesaleCategory: "bulk" },
      { name: "Hierro 10mm barra 12m (60kg/m3)", quantity: 2.1, retailPricePerUnit: 28000, wholesaleCategory: "bulk" },
      { name: "Tabla encofrado (amort.)", quantity: 2.0, retailPricePerUnit: 4000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "4.1.6",
    description: "Losa maciza — m3",
    // Slabs: high formwork complexity ~3.5 hr + 4.0 hr per m3
    crewType: { oficialHours: 3.5, ayudanteHours: 4.0 },
    materials: [
      { name: "Cemento 50kg (7 bolsas/m3)", quantity: 7, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.6m3/m3)", quantity: 0.6, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Piedra partida m3 (0.8m3/m3)", quantity: 0.8, retailPricePerUnit: 38000, wholesaleCategory: "bulk" },
      { name: "Hierro 8mm barra 12m (40kg/m3)", quantity: 2.2, retailPricePerUnit: 18000, wholesaleCategory: "bulk" },
      { name: "Tabla encofrado (amort.)", quantity: 3.0, retailPricePerUnit: 4000, wholesaleCategory: "standard" },
      { name: "Puntales metálicos (amort.)", quantity: 1.0, retailPricePerUnit: 6000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "4.1.8",
    description: "Dinteles y refuerzos — ml",
    crewType: { oficialHours: 1.0, ayudanteHours: 1.0 },
    materials: [
      { name: "Cemento 50kg (1 bolsa/ml)", quantity: 1, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.08m3/ml)", quantity: 0.08, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Hierro 8mm barra 12m (8kg/ml)", quantity: 0.44, retailPricePerUnit: 18000, wholesaleCategory: "bulk" },
      { name: "Tabla encofrado (amort.)", quantity: 0.3, retailPricePerUnit: 4000, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "4.2.1",
    description: "Vigueta pretensada T50 + ladrillo cerámico + capa compresión — m2",
    crewType: { oficialHours: 0.8, ayudanteHours: 1.2 },
    materials: [
      { name: "Vigueta pretensada T50 (2.4m por m2)", quantity: 2.4, retailPricePerUnit: 6800, wholesaleCategory: "standard" },
      { name: "Ladrillo cerámico celosía 20x25cm (3.5/m2)", quantity: 3.5, retailPricePerUnit: 550, wholesaleCategory: "standard" },
      { name: "Cemento 50kg (1.5 bolsas/m2 para capa)", quantity: 1.5, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.1m3/m2)", quantity: 0.1, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Hierro 6mm (malla capa compresión 3kg/m2)", quantity: 0.15, retailPricePerUnit: 14000, wholesaleCategory: "bulk" },
    ],
  },
  {
    itemCode: "4.2.2",
    description: "Vigueta pretensada + EPS + capa compresión — m2",
    crewType: { oficialHours: 0.8, ayudanteHours: 1.2 },
    materials: [
      { name: "Vigueta pretensada T50 (2.4m por m2)", quantity: 2.4, retailPricePerUnit: 6800, wholesaleCategory: "standard" },
      { name: "Bloque EPS 40x120cm (0.8/m2)", quantity: 0.8, retailPricePerUnit: 4200, wholesaleCategory: "standard" },
      { name: "Cemento 50kg (1.5 bolsas/m2)", quantity: 1.5, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.1m3/m2)", quantity: 0.1, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Hierro 6mm (malla 3kg/m2)", quantity: 0.15, retailPricePerUnit: 14000, wholesaleCategory: "bulk" },
    ],
  },
  {
    itemCode: "4.3.1",
    description: "Perfilería galvanizada — m2 de muro steel frame",
    crewType: { oficialHours: 1.2, ayudanteHours: 0.8 },
    materials: [
      { name: "Montante galvanizado 89mm x 3m (2.2/m2)", quantity: 2.2, retailPricePerUnit: 4200, wholesaleCategory: "standard" },
      { name: "Solera galvanizada 89mm x 3m (0.8/m2)", quantity: 0.8, retailPricePerUnit: 3800, wholesaleCategory: "standard" },
      { name: "Tornillos autoperforantes (caja/m2 amort.)", quantity: 0.05, retailPricePerUnit: 3500, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "4.3.2",
    description: "Estructura de piso y techo en steel frame — m2",
    crewType: { oficialHours: 1.5, ayudanteHours: 1.0 },
    materials: [
      { name: "Viga de borde galvanizada 150mm x 3m", quantity: 0.7, retailPricePerUnit: 5500, wholesaleCategory: "standard" },
      { name: "Viga de piso galvanizada 150mm x 4m", quantity: 2.0, retailPricePerUnit: 7000, wholesaleCategory: "standard" },
      { name: "Tornillos y fijaciones (amort./m2)", quantity: 0.1, retailPricePerUnit: 3500, wholesaleCategory: "standard" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Category 5: Mampostería
// ---------------------------------------------------------------------------

const CAT5_FORMULAS: CompositionFormula[] = [
  {
    itemCode: "5.1.1",
    description: "Muro medianero ladrillo común esp.0.15m — m2",
    // masonry_wall_m2: 1.2 hr oficial + 0.8 hr ayudante
    crewType: "masonry_wall_m2",
    materials: [
      // ~50 ladrillos comunes por m2 de muro de 1 pie
      { name: "Ladrillo común 6×12×25cm (50/m2)", quantity: 50, retailPricePerUnit: 120, wholesaleCategory: "standard" },
      { name: "Cemento 50kg (0.5 bolsas/m2)", quantity: 0.5, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Cal 25kg (0.3 bolsas/m2)", quantity: 0.3, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
      { name: "Arena fina m3 (0.04m3/m2)", quantity: 0.04, retailPricePerUnit: 40000, wholesaleCategory: "bulk" },
    ],
  },
  {
    itemCode: "5.2.1",
    description: "Tabique interior hueco cerámico 8×18×33 — m2",
    crewType: "masonry_wall_m2",
    materials: [
      // ~9 ladrillos hueco 8cm por m2
      { name: "Ladrillo hueco 8×18×33cm (9/m2)", quantity: 9, retailPricePerUnit: 180, wholesaleCategory: "standard" },
      { name: "Cemento 50kg (0.3 bolsas/m2)", quantity: 0.3, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Cal 25kg (0.2 bolsas/m2)", quantity: 0.2, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
      { name: "Arena fina m3 (0.02m3/m2)", quantity: 0.02, retailPricePerUnit: 40000, wholesaleCategory: "bulk" },
    ],
  },
  {
    itemCode: "5.2.3",
    description: "Muro exterior hueco cerámico DM20 20×18×33 — m2",
    // Heavier blocks, slightly more labor
    crewType: { oficialHours: 1.4, ayudanteHours: 0.9 },
    materials: [
      // ~6 ladrillos hueco DM20 por m2
      { name: "Ladrillo hueco DM20 20×18×33cm (6/m2)", quantity: 6, retailPricePerUnit: 350, wholesaleCategory: "standard" },
      { name: "Cemento 50kg (0.4 bolsas/m2)", quantity: 0.4, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Cal 25kg (0.25 bolsas/m2)", quantity: 0.25, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
      { name: "Arena fina m3 (0.03m3/m2)", quantity: 0.03, retailPricePerUnit: 40000, wholesaleCategory: "bulk" },
    ],
  },
  {
    itemCode: "5.3.1",
    description: "Muro portante cerámico esp. 0.20m — m2",
    crewType: { oficialHours: 1.5, ayudanteHours: 1.0 },
    materials: [
      // ~12 ladrillos hueco 18cm (portante) por m2
      { name: "Ladrillo cerámico portante 18×18×33cm (12/m2)", quantity: 12, retailPricePerUnit: 280, wholesaleCategory: "standard" },
      { name: "Cemento 50kg (0.5 bolsas/m2)", quantity: 0.5, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Cal 25kg (0.3 bolsas/m2)", quantity: 0.3, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
      { name: "Arena fina m3 (0.04m3/m2)", quantity: 0.04, retailPricePerUnit: 40000, wholesaleCategory: "bulk" },
    ],
  },
  {
    itemCode: "5.3.2",
    description: "Columna de bloque cerámico 20×20 — ml",
    crewType: { oficialHours: 1.2, ayudanteHours: 0.8 },
    materials: [
      { name: "Bloque cerámico portante 20×20×33cm (5/ml)", quantity: 5, retailPricePerUnit: 400, wholesaleCategory: "standard" },
      { name: "Cemento 50kg (0.4 bolsas/ml)", quantity: 0.4, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena fina m3 (0.03m3/ml)", quantity: 0.03, retailPricePerUnit: 40000, wholesaleCategory: "bulk" },
      { name: "Hierro 8mm (2 barras/ml)", quantity: 0.11, retailPricePerUnit: 18000, wholesaleCategory: "bulk" },
    ],
  },
  {
    itemCode: "5.5.1",
    description: "Panel OSB + placa de yeso doble (interior steel frame) — m2",
    crewType: { oficialHours: 0.8, ayudanteHours: 0.5 },
    materials: [
      { name: "Panel OSB 12mm 1.22×2.44m (0.34 paneles/m2)", quantity: 0.34, retailPricePerUnit: 28000, wholesaleCategory: "standard" },
      { name: "Placa de yeso 12.5mm 1.2×2.4m (0.35/m2)", quantity: 0.35, retailPricePerUnit: 9500, wholesaleCategory: "standard" },
      { name: "Tornillos y fijaciones", quantity: 1.0, retailPricePerUnit: 500, wholesaleCategory: "standard" },
      { name: "Cinta + masilla (terminación)", quantity: 0.5, retailPricePerUnit: 2500, wholesaleCategory: "standard" },
    ],
  },
  {
    itemCode: "5.5.2",
    description: "Panel cementicío (exterior steel frame) — m2",
    crewType: { oficialHours: 1.0, ayudanteHours: 0.6 },
    materials: [
      { name: "Panel cementicío 10mm 1.2×2.4m (0.35/m2)", quantity: 0.35, retailPricePerUnit: 22000, wholesaleCategory: "standard" },
      { name: "Tornillos autoperforantes + malla fibra", quantity: 1.0, retailPricePerUnit: 800, wholesaleCategory: "standard" },
      { name: "Sellador elastomérico exterior (0.3L/m2)", quantity: 0.3, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Categories 6-13: Simplified (global per-m2 items using .0 code)
// These represent the full category cost per m2 of floor area.
// ---------------------------------------------------------------------------

const CAT6_TO_13_FORMULAS: CompositionFormula[] = [
  // Cat 6: Capas Aisladoras (Waterproofing & Insulation Layers) — per m2 floor area
  {
    itemCode: "6.0",
    description: "Capas aisladoras e impermeabilizaciones — m2 de planta",
    // Membrana 4mm + relleno perimetral + aislación térmica
    crewType: { oficialHours: 0.6, ayudanteHours: 0.3 },
    materials: [
      { name: "Membrana asfáltica 4mm rollo 10m2 (0.12 rollos/m2)", quantity: 0.12, retailPricePerUnit: 45000, wholesaleCategory: "standard" },
      { name: "Imprimación asfáltica 20L (0.05 latas/m2)", quantity: 0.05, retailPricePerUnit: 22000, wholesaleCategory: "standard" },
      { name: "Cal hidráulica para base (0.1 bolsas/m2)", quantity: 0.1, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
    ],
  },

  // Cat 7: Cubierta y Techo — per m2 de cubierta (~= planta)
  {
    itemCode: "7.0",
    description: "Cubierta y techo (losa inaccesible + membrana) — m2",
    crewType: { oficialHours: 1.2, ayudanteHours: 0.8 },
    materials: [
      { name: "Membrana asfáltica 4mm rollo 10m2 (0.12/m2)", quantity: 0.12, retailPricePerUnit: 45000, wholesaleCategory: "standard" },
      { name: "EPS 50mm (aislación térmica 1m2/m2)", quantity: 1.0, retailPricePerUnit: 4800, wholesaleCategory: "standard" },
      { name: "Hormigón de pendiente (0.5 bolsas cemento/m2)", quantity: 0.5, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Mortero para babeta/babetas", quantity: 0.5, retailPricePerUnit: 2500, wholesaleCategory: "standard" },
    ],
  },

  // Cat 8: Revoques — per m2 de muro (equivalent ~2.5 m2 revoque per m2 planta)
  {
    itemCode: "8.0",
    description: "Revoques interiores y exteriores — m2 de superficie",
    // plaster_m2: 0.8 hr oficial + 0.4 hr ayudante per m2
    crewType: "plaster_m2",
    materials: [
      { name: "Cemento 50kg (0.3 bolsas/m2)", quantity: 0.3, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Cal 25kg (0.4 bolsas/m2)", quantity: 0.4, retailPricePerUnit: 4500, wholesaleCategory: "standard" },
      { name: "Arena fina m3 (0.035m3/m2)", quantity: 0.035, retailPricePerUnit: 40000, wholesaleCategory: "bulk" },
    ],
  },

  // Cat 9: Yesería — per m2 de superficie
  {
    itemCode: "9.0",
    description: "Yesería y enlucidos — m2",
    crewType: { oficialHours: 0.5, ayudanteHours: 0.2 },
    materials: [
      { name: "Yeso en polvo bolsa 40kg (0.5 bolsas/m2)", quantity: 0.5, retailPricePerUnit: 3800, wholesaleCategory: "standard" },
      { name: "Pasta de yeso lista (1L/m2)", quantity: 1.0, retailPricePerUnit: 800, wholesaleCategory: "standard" },
    ],
  },

  // Cat 10: Contrapisos y Carpetas — per m2 de planta
  {
    itemCode: "10.0",
    description: "Contrapisos y carpetas de cemento — m2",
    // ~0.6 hr oficial + 0.5 hr ayudante per m2 (e:0.10m contrapiso)
    crewType: { oficialHours: 0.6, ayudanteHours: 0.5 },
    materials: [
      { name: "Cemento 50kg (1.2 bolsas/m2)", quantity: 1.2, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.08m3/m2)", quantity: 0.08, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Tosca/cascote m3 (0.07m3/m2)", quantity: 0.07, retailPricePerUnit: 15000, wholesaleCategory: "bulk" },
    ],
  },

  // Cat 11: Carpetas — per m2 de planta
  {
    itemCode: "11.0",
    description: "Carpetas de nivelación — m2",
    crewType: { oficialHours: 0.4, ayudanteHours: 0.3 },
    materials: [
      { name: "Cemento 50kg (0.8 bolsas/m2)", quantity: 0.8, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena fina m3 (0.04m3/m2)", quantity: 0.04, retailPricePerUnit: 40000, wholesaleCategory: "bulk" },
    ],
  },

  // Cat 12: Solados (Flooring) — per m2
  {
    itemCode: "12.0",
    description: "Solados — porcellanato 60×60 — m2",
    // floor_tile_m2: 0.9 hr oficial + 0.5 hr ayudante
    crewType: "floor_tile_m2",
    materials: [
      { name: "Porcellanato 60×60 m2 (1.1 m2/m2 con cortes)", quantity: 1.1, retailPricePerUnit: 18000, wholesaleCategory: "standard" },
      { name: "Adhesivo para porcellanato 25kg (1 bolsa/3m2)", quantity: 0.33, retailPricePerUnit: 8500, wholesaleCategory: "standard" },
      { name: "Fragüe/lechada 1kg/m2", quantity: 1.0, retailPricePerUnit: 600, wholesaleCategory: "standard" },
    ],
  },

  // Cat 13: Zócalos — per ml
  {
    itemCode: "13.0",
    description: "Zócalos cerámicos h=10cm — ml",
    crewType: { oficialHours: 0.25, ayudanteHours: 0.1 },
    materials: [
      { name: "Zócalo cerámico 10cm (1.05 ml/ml)", quantity: 1.05, retailPricePerUnit: 1800, wholesaleCategory: "standard" },
      { name: "Adhesivo (0.05 bolsas/ml)", quantity: 0.05, retailPricePerUnit: 8500, wholesaleCategory: "standard" },
      { name: "Fragüe (0.1kg/ml)", quantity: 0.1, retailPricePerUnit: 600, wholesaleCategory: "standard" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Categories 14-26: See bottom of file (defined in same export)
// ---------------------------------------------------------------------------

const CAT14_TO_24_FORMULAS: CompositionFormula[] = [
  // Cat 14: Revestimientos (Wall Cladding) — per m2
  {
    itemCode: "14.0",
    description: "Revestimientos cerámicos de muros (baños/cocinas) — m2",
    crewType: { oficialHours: 0.9, ayudanteHours: 0.5 },
    materials: [
      { name: "Cerámica mural 30×60cm m2 (1.1 con cortes)", quantity: 1.1, retailPricePerUnit: 12500, wholesaleCategory: "standard" },
      { name: "Adhesivo para cerámica 25kg (1 bolsa/3m2)", quantity: 0.33, retailPricePerUnit: 8500, wholesaleCategory: "standard" },
      { name: "Fragüe 1kg/m2", quantity: 1.0, retailPricePerUnit: 600, wholesaleCategory: "standard" },
    ],
  },

  // Cat 15: Carpinterías y Herrerías Metálicas — per m2 equivalente
  {
    itemCode: "15.0",
    description: "Carpinterías y herrerías metálicas — m2 de abertura",
    crewType: { oficialHours: 2.0, ayudanteHours: 1.0 },
    materials: [
      // Steel door/window frame average
      { name: "Marco metálico chapa 18 (precio por m2)", quantity: 1.0, retailPricePerUnit: 35000, wholesaleCategory: "standard" },
      { name: "Hoja puerta chapa 18 (amort./m2)", quantity: 1.0, retailPricePerUnit: 45000, wholesaleCategory: "standard" },
      { name: "Cerradura cilíndrica (amort. por m2)", quantity: 0.3, retailPricePerUnit: 18000, wholesaleCategory: "specialty" },
      { name: "Pintura anticorrosiva (0.5L/m2)", quantity: 0.5, retailPricePerUnit: 5000, wholesaleCategory: "standard" },
    ],
  },

  // Cat 16: Carpintería de Aluminio — per m2 de ventana
  {
    itemCode: "16.0",
    description: "Carpintería de aluminio (ventanas/puertas balcón) — m2",
    crewType: { oficialHours: 1.5, ayudanteHours: 0.8 },
    materials: [
      { name: "Perfil aluminio anodizado 90mm m2 apertura", quantity: 1.0, retailPricePerUnit: 85000, wholesaleCategory: "standard" },
      { name: "Vidrio float 4mm m2 (1.05 con cortes)", quantity: 1.05, retailPricePerUnit: 12000, wholesaleCategory: "standard" },
      { name: "Sellador neutro silicona 300ml", quantity: 0.3, retailPricePerUnit: 3200, wholesaleCategory: "specialty" },
    ],
  },

  // Cat 17: Carpintería de Madera — per m2
  {
    itemCode: "17.0",
    description: "Carpintería de madera (puertas interiores) — m2",
    crewType: { oficialHours: 2.5, ayudanteHours: 1.0 },
    materials: [
      { name: "Puerta MDF 70×200cm (amort./m2)", quantity: 1.0, retailPricePerUnit: 65000, wholesaleCategory: "standard" },
      { name: "Marco de madera pino (precio por m2)", quantity: 1.0, retailPricePerUnit: 18000, wholesaleCategory: "standard" },
      { name: "Cerradura palanca", quantity: 0.5, retailPricePerUnit: 12000, wholesaleCategory: "specialty" },
      { name: "Bisagras (3 por puerta, amort./m2)", quantity: 1.5, retailPricePerUnit: 2200, wholesaleCategory: "standard" },
    ],
  },

  // Cat 18: Escalera — per m2 de planta del tramo
  {
    itemCode: "18.0",
    description: "Escalera de hormigón armado — m2 de proyección",
    crewType: { oficialHours: 5.0, ayudanteHours: 5.0 },
    materials: [
      { name: "Cemento 50kg (5 bolsas/m2 escalera)", quantity: 5, retailPricePerUnit: 12000, wholesaleCategory: "bulk" },
      { name: "Arena gruesa m3 (0.4m3/m2)", quantity: 0.4, retailPricePerUnit: 45000, wholesaleCategory: "bulk" },
      { name: "Hierro 10mm (25kg/m2)", quantity: 0.89, retailPricePerUnit: 28000, wholesaleCategory: "bulk" },
      { name: "Tabla encofrado (amort.)", quantity: 3.0, retailPricePerUnit: 4000, wholesaleCategory: "standard" },
      { name: "Granito reconstituido escalón 120×30cm", quantity: 1.2, retailPricePerUnit: 22000, wholesaleCategory: "standard" },
    ],
  },

  // Cat 19: Amoblamientos — per ml de mueble bajo
  {
    itemCode: "19.0",
    description: "Amoblamientos de cocina (mueble bajo) — ml",
    crewType: { oficialHours: 3.0, ayudanteHours: 1.5 },
    materials: [
      { name: "Mueble bajo cocina MDF 60cm (precio/ml)", quantity: 1.0, retailPricePerUnit: 120000, wholesaleCategory: "standard" },
      { name: "Mesada granito 60cm (precio/ml)", quantity: 1.0, retailPricePerUnit: 65000, wholesaleCategory: "standard" },
      { name: "Bisagras y herrajes (por ml)", quantity: 1.0, retailPricePerUnit: 8000, wholesaleCategory: "specialty" },
    ],
  },

  // Cat 20: Instalaciones Eléctricas — per punto (bocas)
  {
    itemCode: "20.0",
    description: "Instalaciones eléctricas (media calidad) — por boca",
    // electrical_point: 2.5 hr oficial + 1.0 hr ayudante
    crewType: "electrical_point",
    materials: [
      { name: "Cañería corrugada 3/4 (5ml/boca)", quantity: 5, retailPricePerUnit: 650, wholesaleCategory: "specialty" },
      { name: "Cable unipolar 2.5mm (8ml/boca)", quantity: 8, retailPricePerUnit: 550, wholesaleCategory: "specialty" },
      { name: "Caja rectangular termoplástica", quantity: 1, retailPricePerUnit: 450, wholesaleCategory: "specialty" },
      { name: "Interruptor/toma mecanism. media calidad", quantity: 1, retailPricePerUnit: 4500, wholesaleCategory: "specialty" },
      { name: "Módulo y placa (precio por boca)", quantity: 1, retailPricePerUnit: 3200, wholesaleCategory: "specialty" },
    ],
  },

  // Cat 21: Instalaciones Sanitarias — per punto/artefacto
  {
    itemCode: "21.0",
    description: "Instalaciones sanitarias (baño estándar) — por punto",
    // plumbing_point: 3.0 hr oficial + 1.5 hr ayudante
    crewType: "plumbing_point",
    materials: [
      { name: "Caño termofusión 25mm barra 4m (2 barras/punto)", quantity: 2, retailPricePerUnit: 8000, wholesaleCategory: "specialty" },
      { name: "Caño PVC desagüe 110mm (3ml/punto)", quantity: 3, retailPricePerUnit: 4500, wholesaleCategory: "specialty" },
      { name: "Accesorios codos/tees", quantity: 4, retailPricePerUnit: 850, wholesaleCategory: "specialty" },
      { name: "Artefacto inodoro/lavatorio (prorrata/punto)", quantity: 0.5, retailPricePerUnit: 75000, wholesaleCategory: "specialty" },
    ],
  },

  // Cat 22: Instalación de Gas — per boca gas
  {
    itemCode: "22.0",
    description: "Instalación de gas — por boca",
    crewType: { oficialHours: 2.5, ayudanteHours: 1.0 },
    materials: [
      { name: "Caño gas semirígido 3/4 pulgada (5ml/boca)", quantity: 5, retailPricePerUnit: 3200, wholesaleCategory: "specialty" },
      { name: "Llave de paso 3/4 pulgada", quantity: 1, retailPricePerUnit: 6500, wholesaleCategory: "specialty" },
      { name: "Uniones y accesorios", quantity: 3, retailPricePerUnit: 1800, wholesaleCategory: "specialty" },
    ],
  },

  // Cat 23: Espejos — per m2
  {
    itemCode: "23.0",
    description: "Espejos — m2",
    crewType: { oficialHours: 0.8, ayudanteHours: 0.4 },
    materials: [
      { name: "Espejo plateado 4mm m2 (1.05/m2)", quantity: 1.05, retailPricePerUnit: 22000, wholesaleCategory: "standard" },
      { name: "Tornillos y tapones para espejo", quantity: 4, retailPricePerUnit: 350, wholesaleCategory: "standard" },
      { name: "Sellador neutro silicona 300ml", quantity: 0.3, retailPricePerUnit: 3200, wholesaleCategory: "specialty" },
    ],
  },

  // Cat 24: Pinturas — per m2 de superficie
  {
    itemCode: "24.0",
    description: "Pinturas interiores (látex 2 manos) — m2",
    // painting_m2: 0.3 hr oficial + 0.2 hr ayudante
    crewType: "painting_m2",
    materials: [
      { name: "Pintura látex interior 20L (0.25L/m2 × 2 manos)", quantity: 0.025, retailPricePerUnit: 65000, wholesaleCategory: "standard" },
      { name: "Enduido interior (0.2 kg/m2)", quantity: 0.2, retailPricePerUnit: 1800, wholesaleCategory: "standard" },
      { name: "Lija hoja", quantity: 0.05, retailPricePerUnit: 450, wholesaleCategory: "standard" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Full ALL_FORMULAS export (no formulas needed for 25.0 and 26.0 — they are lump-sum)
// ---------------------------------------------------------------------------

export const ALL_FORMULAS: CompositionFormula[] = [
  ...CAT1_FORMULAS,
  ...CAT2_FORMULAS,
  ...CAT3_FORMULAS,
  ...CAT4_FORMULAS,
  ...CAT5_FORMULAS,
  ...CAT6_TO_13_FORMULAS,
  ...CAT14_TO_24_FORMULAS,
];
