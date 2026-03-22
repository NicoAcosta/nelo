import type { Locale, Translations } from "./types";

const en: Translations = {
  // header
  "header.basePrices": "Base prices: Jul 2024",
  "header.newEstimate": "New Estimate",

  // sidebar
  "sidebar.brandSubtitle": "Project Architect",
  "sidebar.dashboard": "Dashboard",
  "sidebar.estimates": "Estimates",
  "sidebar.blueprints": "Blueprints",
  "sidebar.settings": "Settings",
  "sidebar.support": "Support",
  "sidebar.soon": "Soon",

  // mobileNav
  "mobileNav.chat": "Chat",
  "mobileNav.estimates": "Estimates",
  "mobileNav.blueprints": "Blueprints",
  "mobileNav.profile": "Profile",

  // chatInput
  "chatInput.placeholder": "Write a message or upload a file...",
  "chatInput.analyzeFloorPlan": "Analyze this floor plan",
  "chatInput.disclaimer":
    "Nelo can make mistakes. Verify important information.",

  // costBreakdown
  "costBreakdown.estimatedBudget": "Estimated Budget",
  "costBreakdown.pricePerM2": "Price per m2",
  "costBreakdown.confidenceLevel": "Confidence Level",
  "costBreakdown.category": "Category",
  "costBreakdown.incidence": "Incidence",
  "costBreakdown.cost": "Cost",
  "costBreakdown.directCost": "Direct Cost",
  "costBreakdown.overhead": "Overhead",
  "costBreakdown.profit": "Profit",
  "costBreakdown.subtotal": "Subtotal (ARS)",
  "costBreakdown.iva": "IVA (21%)",
  "costBreakdown.totalPrice": "Total Price",
  "costBreakdown.assumptions": "Assumptions",
  "costBreakdown.confidenceQuick": "Quick",
  "costBreakdown.confidenceProfessional": "Professional",
  "costBreakdown.confidenceDetailed": "Detailed",
  "costBreakdown.basedOn": "Based on {n} cost items calculated for this project.",
  "costBreakdown.pricesAsOf": "Prices as of",
  "costBreakdown.downloadPdf": "Download PDF",
  "costBreakdown.exportExcel": "Export Excel",
  "costBreakdown.recalculate": "Recalculate",
  "costBreakdown.availableSoon": "Available soon",
  "costBreakdown.iccDisclaimer": "Prices are adjusted using the Construction Cost Index (ICC). Final costs may vary depending on your choice of finishes, fixtures, and materials.",

  // floorPlanPanel
  "floorPlanPanel.analysisPhase": "Analysis Phase",
  "floorPlanPanel.analysisComplete": "Floor Plan Analysis Complete",
  "floorPlanPanel.description": "Nelo extracted measurements from your floor plan. Review the values below and adjust if needed before calculating your estimate.",
  "floorPlanPanel.preview": "Floor Plan Preview",
  "floorPlanPanel.noNotes": "No additional notes from the analysis.",
  "floorPlanPanel.extractedValues": "Extracted Values",
  "floorPlanPanel.enterArea": "Enter area to calculate",
  "floorPlanPanel.totalArea": "Total Area",
  "floorPlanPanel.rooms": "Rooms",
  "floorPlanPanel.bathrooms": "Bathrooms",
  "floorPlanPanel.windows": "Windows",
  "floorPlanPanel.confirm": "Confirm and Calculate",
  "floorPlanPanel.edit": "Edit Values",

  // landing
  "landing.greeting": "Hi, I'm Nelo",
  "landing.subtitle": "What do you want to build today?",
  "landing.quickPrompt1": "How much does it cost to build a 100m2 house?",
  "landing.quickPrompt2": "I want to know the price per m2 in AMBA.",
  "landing.proPrompt1": "Upload a floor plan for a detailed estimate",
  "landing.proPrompt2":
    "Full estimate with plaster, insulation and finishes.",
  "landing.sectionQuick": "Quick Estimates",
  "landing.sectionPro": "Professional",

  // chat
  "chat.emptyTitle": "Start a conversation",
  "chat.emptySubtitle":
    "Describe your construction project and I'll estimate the cost.",
  "chat.errorMessage": "Something went wrong. Please try again.",
  "chat.retry": "Retry",
  "chat.promptSuggestion1": "Estimate a 120m2 house",
  "chat.promptSuggestion2": "Price per m2 in CABA",
  "chat.typing": "Nelo is typing...",

  // error
  "error.title": "Something went wrong",
  "error.description":
    "An unexpected error occurred. Please try again.",
  "error.tryAgain": "Try Again",

  // notFound
  "notFound.title": "404",
  "notFound.description":
    "Page not found. The page you are looking for does not exist.",
  "notFound.backHome": "Back to Home",

  // engine assumption labels
  "engine.assumptionCeilingHeight": "Floor-to-ceiling height",
  "engine.assumptionFootprint": "Footprint area",
  "engine.assumptionPerimeter": "Perimeter",
  "engine.assumptionDoors": "Door count",
  "engine.assumptionWindows": "Window count",
  "engine.assumptionBathrooms": "Bathroom count",
  "engine.assumptionNotSpecified": "not specified",
  "engine.assumptionEstimatedSquare": "estimated from square footprint",
  "engine.assumptionTotalDivStories": "total / stories",

  // categories (26 from categories-config.ts)
  "category.trabajos_preliminares": "Preliminary Work",
  "category.procedimientos_cumplimientos": "Procedures & Compliance",
  "category.movimiento_suelos": "Earthwork",
  "category.estructura_resistente": "Structural System",
  "category.mamposteria": "Masonry",
  "category.capas_aisladoras": "Waterproofing & Insulation Layers",
  "category.cubierta_techo": "Roof & Ceiling",
  "category.revoques": "Plaster & Render",
  "category.yeseria": "Plasterwork",
  "category.contrapisos": "Screeds & Subfloors",
  "category.carpetas": "Floor Screeds",
  "category.solados": "Floor Finishes",
  "category.zocalos": "Baseboards",
  "category.revestimientos": "Wall Cladding",
  "category.carpinteria_metalica": "Metal Joinery & Ironwork",
  "category.carpinteria_aluminio": "Aluminum Joinery",
  "category.carpinteria_madera": "Wood Joinery",
  "category.escalera": "Staircase",
  "category.amoblamientos": "Furniture & Cabinetry",
  "category.instalacion_electrica": "Electrical Systems",
  "category.instalacion_sanitaria": "Plumbing & Sanitary",
  "category.instalacion_gas": "Gas Installation",
  "category.espejos": "Mirrors",
  "category.pinturas": "Paint",
  "category.marmoleria": "Marble & Stone",
  "category.varios": "Miscellaneous",

  // express questions
  "expressQuestion.totalFloorAreaM2":
    "How many square meters is your project?",
  "expressQuestion.stories":
    "How many stories does the building have?",
  "expressQuestion.structureType":
    "What is the main structural system?",
  "expressQuestion.roofType": "Roof / ceiling type?",
  "expressQuestion.finishLevel": "Finish level?",
  "expressQuestion.locationZone": "In which area of Buenos Aires?",
};

const es: Translations = {
  // header
  "header.basePrices": "Precios base: Jul 2024",
  "header.newEstimate": "Nueva Estimacion",

  // sidebar
  "sidebar.brandSubtitle": "Arquitecto de Proyectos",
  "sidebar.dashboard": "Panel",
  "sidebar.estimates": "Estimaciones",
  "sidebar.blueprints": "Planos",
  "sidebar.settings": "Configuracion",
  "sidebar.support": "Soporte",
  "sidebar.soon": "Pronto",

  // mobileNav
  "mobileNav.chat": "Chat",
  "mobileNav.estimates": "Estimaciones",
  "mobileNav.blueprints": "Planos",
  "mobileNav.profile": "Perfil",

  // chatInput
  "chatInput.placeholder": "Escribe un mensaje o subi un archivo...",
  "chatInput.analyzeFloorPlan": "Analizar este plano",
  "chatInput.disclaimer":
    "Nelo puede cometer errores. Verifica la informacion importante.",

  // costBreakdown
  "costBreakdown.estimatedBudget": "Presupuesto Estimado",
  "costBreakdown.pricePerM2": "Precio por m2",
  "costBreakdown.confidenceLevel": "Nivel de Confianza",
  "costBreakdown.category": "Rubro",
  "costBreakdown.incidence": "Incidencia",
  "costBreakdown.cost": "Costo",
  "costBreakdown.directCost": "Costo Directo",
  "costBreakdown.overhead": "Gastos Generales",
  "costBreakdown.profit": "Beneficio",
  "costBreakdown.subtotal": "Subtotal (ARS)",
  "costBreakdown.iva": "IVA (21%)",
  "costBreakdown.totalPrice": "Precio Total",
  "costBreakdown.assumptions": "Supuestos",
  "costBreakdown.confidenceQuick": "Rapida",
  "costBreakdown.confidenceProfessional": "Profesional",
  "costBreakdown.confidenceDetailed": "Detallada",
  "costBreakdown.basedOn": "Basado en {n} items de costo calculados para este proyecto.",
  "costBreakdown.pricesAsOf": "Precios al",
  "costBreakdown.downloadPdf": "Descargar PDF",
  "costBreakdown.exportExcel": "Exportar Excel",
  "costBreakdown.recalculate": "Recalcular",
  "costBreakdown.availableSoon": "Disponible pronto",
  "costBreakdown.iccDisclaimer": "Los precios se ajustan usando el Indice de Costo de Construccion (ICC). Los costos finales pueden variar segun la eleccion de terminaciones y materiales.",

  // floorPlanPanel
  "floorPlanPanel.analysisPhase": "Fase de Analisis",
  "floorPlanPanel.analysisComplete": "Analisis de Plano Completado",
  "floorPlanPanel.description": "Nelo extrajo las medidas de tu plano. Revisa los valores y ajustalos si es necesario antes de calcular tu presupuesto.",
  "floorPlanPanel.preview": "Vista previa del plano",
  "floorPlanPanel.noNotes": "Sin notas adicionales del analisis.",
  "floorPlanPanel.extractedValues": "Valores Extraidos",
  "floorPlanPanel.enterArea": "Ingresa la superficie para calcular",
  "floorPlanPanel.totalArea": "Superficie Total",
  "floorPlanPanel.rooms": "Ambientes",
  "floorPlanPanel.bathrooms": "Banos",
  "floorPlanPanel.windows": "Ventanas",
  "floorPlanPanel.confirm": "Confirmar y Calcular",
  "floorPlanPanel.edit": "Editar Valores",

  // landing
  "landing.greeting": "Hola, soy Nelo",
  "landing.subtitle": "Que queres construir hoy?",
  "landing.quickPrompt1":
    "Cuanto cuesta construir una casa de 100m2?",
  "landing.quickPrompt2": "Quiero saber el precio por m2 en AMBA.",
  "landing.proPrompt1": "Subi un plano para una estimacion detallada",
  "landing.proPrompt2":
    "Estimacion completa con revoques, aislacion y terminaciones.",
  "landing.sectionQuick": "Estimaciones Rapidas",
  "landing.sectionPro": "Profesional",

  // chat
  "chat.emptyTitle": "Inicia una conversacion",
  "chat.emptySubtitle":
    "Describi tu proyecto de construccion y te estimo el costo.",
  "chat.errorMessage": "Algo salio mal. Por favor intenta de nuevo.",
  "chat.retry": "Reintentar",
  "chat.promptSuggestion1": "Estimar una casa de 120m2",
  "chat.promptSuggestion2": "Precio por m2 en CABA",
  "chat.typing": "Nelo esta escribiendo...",

  // error
  "error.title": "Algo salio mal",
  "error.description":
    "Ocurrio un error inesperado. Por favor intenta de nuevo.",
  "error.tryAgain": "Intentar de Nuevo",

  // notFound
  "notFound.title": "404",
  "notFound.description":
    "Pagina no encontrada. La pagina que buscas no existe.",
  "notFound.backHome": "Volver al Inicio",

  // engine assumption labels
  "engine.assumptionCeilingHeight": "Altura de piso a techo",
  "engine.assumptionFootprint": "Superficie de pisada",
  "engine.assumptionPerimeter": "Perimetro",
  "engine.assumptionDoors": "Cantidad de puertas",
  "engine.assumptionWindows": "Cantidad de ventanas",
  "engine.assumptionBathrooms": "Cantidad de banos",
  "engine.assumptionNotSpecified": "no especificado",
  "engine.assumptionEstimatedSquare": "estimado de planta cuadrada",
  "engine.assumptionTotalDivStories": "total / plantas",

  // categories (26 from categories-config.ts)
  "category.trabajos_preliminares": "Trabajos Preliminares",
  "category.procedimientos_cumplimientos": "Procedimientos y Cumplimientos",
  "category.movimiento_suelos": "Movimiento de Suelos",
  "category.estructura_resistente": "Estructura Resistente",
  "category.mamposteria": "Mamposteria",
  "category.capas_aisladoras": "Capas Aisladoras",
  "category.cubierta_techo": "Cubierta y Techo",
  "category.revoques": "Revoques",
  "category.yeseria": "Yeseria",
  "category.contrapisos": "Contrapisos y Carpetas",
  "category.carpetas": "Carpetas",
  "category.solados": "Solados",
  "category.zocalos": "Zocalos",
  "category.revestimientos": "Revestimientos",
  "category.carpinteria_metalica": "Carpinterias y Herrerias Metalicas",
  "category.carpinteria_aluminio": "Carpinteria de Aluminio",
  "category.carpinteria_madera": "Carpinteria de Madera",
  "category.escalera": "Escalera",
  "category.amoblamientos": "Amoblamientos",
  "category.instalacion_electrica": "Instalaciones Electricas",
  "category.instalacion_sanitaria": "Instalaciones Sanitarias",
  "category.instalacion_gas": "Instalacion de Gas",
  "category.espejos": "Espejos",
  "category.pinturas": "Pinturas",
  "category.marmoleria": "Marmoleria",
  "category.varios": "Varios",

  // express questions
  "expressQuestion.totalFloorAreaM2":
    "Cuantos metros cuadrados tiene tu proyecto?",
  "expressQuestion.stories":
    "Cuantas plantas tiene el edificio?",
  "expressQuestion.structureType":
    "Cual es el sistema estructural principal?",
  "expressQuestion.roofType": "Tipo de cubierta / techo?",
  "expressQuestion.finishLevel": "Nivel de terminaciones?",
  "expressQuestion.locationZone": "En que zona de Buenos Aires?",
};

export const translations: Record<Locale, Translations> = { en, es };
