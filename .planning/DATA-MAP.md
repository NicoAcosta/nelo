# Nelo — Data Map: Complete Data Requirements

**Purpose:** Single source of truth for all data the app needs to compute construction cost estimates.
**Sources merged:** `cotizador.xlsx` (PyOO TPG2024 + FERES UT2 reference) + PRICING-SOURCES research.
**Last updated:** 2026-03-21

---

## 1. Complete Line Item Registry

All 130+ items from the xlsx. Columns:
- **Data Needed:** what price we need to store per item
- **Suggested Source:** best source from PRICING-SOURCES.md

> **Key:** Mat = material cost/unit; MO = labor (mano de obra) cost/unit; Total = combined unit cost

### Category 1 — Trabajos Preliminares

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 1.01 | Limpieza general del terreno (incl. desmalezamiento y retiro de tocones) | Site clearing and grubbing | m² | Mat + MO + Total/m² | AyC Revista (Mov. tierra) |
| 1.02 | Obrador, depósito y sanitarios | Site office, storage and latrines | m² | Mat + MO + Total/m²; scale factor (small/med/large) | AyC Revista / manual |
| 1.03 | Nivelación del terreno | Site leveling | m³ | Mat + MO + Total/m³ | AyC Revista (Mov. tierra) |
| 1.04 | Tala de árboles | Tree removal | un | MO + Total/unit | Manual research / Home Solution |
| 1.05 | Demolición parcial | Partial demolition | m² | MO + Total/m² | AyC Revista (Demolicion) |

### Category 2 — Procedimientos y Cumplimientos

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 2.01 | Cerco de obra provisorio | Temporary site fence | ml | Mat + MO + Total/ml | AyC Revista / manual |
| 2.02 | Cartel de obra (chapa c/estructura 1.00×2.00m) | Site sign board | m² | Mat + MO + Total/m² | Manual research |
| 2.03 | Replanteo y demarcación | Layout and staking | m² | MO + Total/m² | AyC Revista / CYPE |
| 2.04 | Agua de construcción | Construction water supply | gl | Total lump sum | Manual research |
| 2.05 | Luz de obra | Construction electrical supply | gl | Mat + Total lump sum | Manual research |

### Category 3 — Movimiento de Suelos

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 3.1.1 | Retiro de tierra vegetal esp. 0.30m | Topsoil stripping 0.30m | m³ | MO + Total/m³ | AyC Revista (Mov. tierra) |
| 3.1.2 | Excavación para vigas de fundación | Trench excavation for foundation beams | m³ | MO + Total/m³ | AyC Revista (Mov. tierra) |
| 3.1.3 | Excavación para tanque cisterna / nicho | Excavation for underground cistern | m³ | MO + Total/m³ | AyC Revista (Mov. tierra) |
| 3.1.4 | Zanjas para instalaciones sanitarias | Trenches for sanitary installation | m³ | MO + Total/m³ | AyC Revista (Mov. tierra) |
| 3.2.1 | Relleno con suelo seleccionado compactado | Compacted selected fill | m³ | Mat + MO + Total/m³ | AyC Revista (Mov. tierra) |
| 3.2.2 | Aporte y compactación de tosca h:0.30m | Tosca fill and compaction | m³ | Mat + MO + Total/m³ | AyC Revista (Mov. tierra) |
| 3.2.3 | Entibado de excavaciones | Shoring of deep excavations | m² | Mat + MO + Total/m² | AyC Revista / CYPE |

### Category 4 — Estructura Resistente

#### 4.1 Hormigón Armado (in situ)

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 4.1.1 | Platea de fundación (35 kg/m³ de hierro) | Foundation raft slab | m³ | Mat + MO + Total/m³ | AyC Revista (Estructura) |
| 4.1.2 | Vigas de encadenado | Ring beams | ml | Mat + MO + Total/ml | AyC Revista (Estructura) |
| 4.1.3 | Columnas | Columns | m³ | Mat + MO + Total/m³ | AyC Revista (Estructura) |
| 4.1.4 | Vigas principales y secundarias | Primary and secondary beams | m³ | Mat + MO + Total/m³ | AyC Revista (Estructura) |
| 4.1.5 | Viga cantilever | Cantilever beam | m³ | Mat + MO + Total/m³ | AyC Revista (Estructura) |
| 4.1.6 | Losa maciza | Solid flat slab | m³ | Mat + MO + Total/m³ | AyC Revista (Estructura) |
| 4.1.7 | Losa nervurada alivianada | Ribbed/waffle slab | m² | Mat + MO + Total/m² | AyC Revista (Estructura) |
| 4.1.8 | Dinteles y refuerzos | Lintels and reinforcements | ml | Mat + MO + Total/ml | AyC Revista (Estructura) |
| 4.1.9 | Hormigón visto (fenólico laminado) | Exposed concrete with phenolic formwork | m² | Mat + MO + Total/m² | AyC Revista (Estructura) |

#### 4.2 Hormigón Armado Premoldeado

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 4.2.1 | Vigueta pretensada T50 + ladrillo cerámico + capa compresión esp.17cm | Prestressed joist + ceramic block + compression layer 17cm | m² | Mat + MO + Total/m² | AyC Revista (Estructura) |
| 4.2.2 | Vigueta pretensada + EPS + capa compresión | Prestressed joist + EPS block + compression layer | m² | Mat + MO + Total/m² | AyC Revista (Estructura) |

#### 4.3 Steel Frame

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 4.3.1 | Perfilería galvanizada (montantes y soleras) | Galvanized steel framing (studs and tracks) | m² | Mat + MO + Total/m² | MercadoLibre API (steel profiles) + UOCRA MO |
| 4.3.2 | Estructura de piso y techo en steel frame | Floor and roof steel frame structure | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |

#### 4.4 Wood Frame / Madera

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 4.4.1 | Estructura de madera impregnada (muros y cubierta) | Pressure-treated timber frame (walls and roof) | m² | Mat + MO + Total/m² | MercadoLibre API (timber) + UOCRA MO |

#### 4.5 Estructura Metálica

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 4.5.1 | Columnas perfil HEB/IPN | HEB/IPN steel columns | ml | Mat + MO + Total/ml | MercadoLibre API (steel beams) + UOCRA MO |
| 4.5.2 | Vigas perfil IPN/UPN | IPN/UPN steel beams | ml | Mat + MO + Total/ml | MercadoLibre API + UOCRA MO |
| 4.5.3 | Correas y secundarios | Purlins and secondary members | ml | Mat + MO + Total/ml | MercadoLibre API + UOCRA MO |

### Category 5 — Mampostería

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 5.1.1 | Muro medianero ladrillo común esp.0.15m | Party wall, common brick 15cm | m² | Mat + MO + Total/m² | AyC Revista (Mampostería y tabiques) |
| 5.2.1 | Tabique interior hueco cerámico 8×18×33 (esp. 0.08m) | Interior hollow ceramic partition 8cm | m² | Mat + MO + Total/m² | AyC Revista (Mampostería y tabiques) |
| 5.2.2 | Muro exterior hueco cerámico 12×18×33 (esp. 0.12m) | Exterior hollow ceramic wall 12cm | m² | Mat + MO + Total/m² | AyC Revista (Mampostería y tabiques) |
| 5.2.3 | Muro exterior hueco cerámico DM20 20×18×33 (esp. 0.20m) | Exterior hollow ceramic wall 20cm with air gap | m² | Mat + MO + Total/m² | AyC Revista (Mampostería y tabiques) |
| 5.2.4 | Tabique interior hueco cerámico 14×18×33 (esp. 0.14m) | Interior hollow ceramic partition 14cm | m² | Mat + MO + Total/m² | AyC Revista (Mampostería y tabiques) |
| 5.3.1 | Muro portante cerámico esp. 0.20m | Load-bearing ceramic wall 20cm | m² | Mat + MO + Total/m² | AyC Revista (Mampostería y tabiques) |
| 5.3.2 | Columna de bloque cerámico 20×20 | Ceramic block column 20×20 | ml | Mat + MO + Total/ml | AyC Revista (Mampostería y tabiques) |
| 5.4.1 | Muro de ladrillo visto (común o cerámico) | Exposed brick wall (common or ceramic) | m² | Mat + MO + Total/m² | AyC Revista (Mampostería y tabiques) |
| 5.5.1 | Panel OSB + placa de yeso doble (interior) | OSB + double drywall panel (interior) | m² | Mat + MO + Total/m² | MercadoLibre API (OSB, drywall) + UOCRA MO |
| 5.5.2 | Panel cementicío (exterior) | Cementitious panel (exterior) | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |

### Category 6 — Capas Aisladoras

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 6.1.1 | Horizontal bajo muro doble pared 0.15m | Horizontal damp course under 15cm wall | ml | Mat + MO + Total/ml | AyC Revista (Aislaciones / Membranas) |
| 6.1.2 | Horizontal bajo muro doble pared 0.20m | Horizontal damp course under 20cm wall | ml | Mat + MO + Total/ml | AyC Revista (Aislaciones / Membranas) |
| 6.1.3 | Horizontal sobre contrapiso (azotado hidrófugo) | Waterproof render on subfloor | m² | Mat + MO + Total/m² | AyC Revista (Aislaciones) |
| 6.1.4 | Film de polietileno 200 micrones bajo platea | 200-micron polyethylene film under slab | m² | Mat + Total/m² | MercadoLibre API (poly film) |
| 6.2.1 | Vertical de concreto proyectado sobre muro | Vertical shotcrete waterproofing on basement wall | m² | Mat + MO + Total/m² | AyC Revista (Aislaciones) |
| 6.3.1 | EPS (poliestireno expandido) 5cm en cubierta/azotea | EPS insulation 5cm on roof/terrace | m² | Mat + MO + Total/m² | AyC Revista / MercadoLibre API (EPS board) |
| 6.3.2 | EPS adherido exterior (sistema ETICS) | External EPS cladding (ETICS system) | m² | Mat + MO + Total/m² | AyC Revista (Sistemas constructivos) |
| 6.3.3 | Lana de roca / vidrio entre montantes (steel frame) | Rock/glass wool between studs | m² | Mat + MO + Total/m² | MercadoLibre API (insulation) + UOCRA MO |
| 6.3.4 | Poliuretano proyectado | Spray polyurethane foam | m² | Mat + MO + Total/m² (by thickness) | Manual research / CYPE |

### Category 7 — Cubierta y Techo

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 7.1.1 | Pintura asfáltica sobre losa (barrera de vapor) | Bituminous paint on slab (vapor barrier) | m² | Mat + MO + Total/m² | AyC Revista (Membranas) |
| 7.1.2 | EPS AD 20mm sobre losa | EPS board 20mm on slab | m² | Mat + MO + Total/m² | AyC Revista / MercadoLibre API |
| 7.1.3 | Contrapiso hormigón cascote con pendiente | Rubble concrete screed with slope | m² | Mat + MO + Total/m² | AyC Revista (Cubiertas) |
| 7.1.4 | Carpeta hidrófuga bajo membrana | Waterproof screed under membrane | m² | Mat + MO + Total/m² | AyC Revista |
| 7.1.5 | Membrana asfáltica 4mm aluminizada (40 micrones) | 4mm aluminized bituminous membrane | m² | Mat + MO + Total/m² | AyC Revista (Membranas) |
| 7.1.6 | Zinguerías (babetas, limahoyas, remates) | Sheet metal flashings and gutters | ml | Mat + MO + Total/ml | AyC Revista / Manual research |
| 7.2.1 | Ídem azotea inaccesible + solado sobre pedestales | Accessible terrace: membrane + paving on pedestals | m² | Mat + MO + Total/m² | AyC Revista (Cubiertas) |
| 7.3.1 | Chapa trapezoidal galvanizada | Galvanized trapezoidal sheet metal roofing | m² | Mat + MO + Total/m² | AyC Revista (Cubiertas) / MercadoLibre API |
| 7.3.2 | Chapa prepintada (Cincalum / Acero pintado) | Pre-painted steel sheet | m² | Mat + MO + Total/m² | AyC Revista / MercadoLibre API |
| 7.3.3 | Chapa de zinc (Zincing) | Zinc sheet roofing | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 7.3.4 | Panel sándwich (chapa + EPS + chapa) | Sandwich panel (sheet + EPS + sheet) | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 7.4.1 | Teja cerámica francesa s/tirantería de madera | French ceramic tile on timber framing | m² | Mat + MO + Total/m² | AyC Revista (Cubiertas) |
| 7.4.2 | Teja colonial cerámica | Colonial ceramic tile | m² | Mat + MO + Total/m² | AyC Revista (Cubiertas) |
| 7.4.3 | Teja de hormigón | Concrete tile | m² | Mat + MO + Total/m² | AyC Revista (Cubiertas) |
| 7.5.1 | Tirantería de madera (cumbrera, pares, correas) | Timber roof framing (ridge, rafters, purlins) | m² | Mat + MO + Total/m² | AyC Revista (Cubiertas) |
| 7.5.2 | Estructura metálica para cubierta | Metal roof structure | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 7.6.1 | Pérgola de madera | Timber pergola | gl | Mat + MO + Total lump sum | Manual research |
| 7.6.2 | Pérgola metálica / hierro | Metal/iron pergola | gl | Mat + MO + Total lump sum | Manual research |
| 7.6.3 | Cobertizo con chapa (garaje / quincho) | Sheet metal shed (garage/barbecue area) | m² | Mat + MO + Total/m² | Manual research |
| 7.7.1 | Cubierta verde extensiva (sustrato 10–15cm) | Extensive green roof (10-15cm substrate) | m² | Mat + MO + Total/m² | Manual research / CYPE |

### Category 8 — Revoques

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 8.1.1 | Revoque grueso a la cal impermeable (exterior) | Waterproof lime render (exterior) | m² | Mat + MO + Total/m² | AyC Revista (Revoques) |
| 8.1.2 | Revoque proyectado simil piedra (tirolés / Iggam) | Spray textured render (stone-look / tyrolean) | m² | Mat + MO + Total/m²; color variants | AyC Revista (Revoques) |
| 8.1.3 | EIFS / ETICS (revoque sobre aislación EPS) | EIFS/ETICS render over EPS insulation | m² | Mat + MO + Total/m² | AyC Revista (Sistemas constructivos) |
| 8.1.4 | Sin revoque – ladrillo visto | No render — exposed brick, sealant only | m² | Mat (sealant) + MO + Total/m² | MercadoLibre API (waterproofer) + UOCRA MO |
| 8.2.1 | Revoque grueso a la cal bajo revestimiento (baños) | Lime plaster base under tile (bathrooms) | m² | Mat + MO + Total/m² | AyC Revista (Revoques) |
| 8.2.2 | Revoque grueso a la cal en paredes secas | Lime plaster on dry areas | m² | Mat + MO + Total/m² | AyC Revista (Revoques) |
| 8.2.3 | Enlucido de yeso con cemento en paredes | Gypsum-cement skim coat on walls | m² | Mat + MO + Total/m² | AyC Revista (Revoques) |
| 8.2.4 | Cielorraso de yeso aplicado recto | Applied gypsum ceiling (flat) | m² | Mat + MO + Total/m² | AyC Revista (Revoques) |
| 8.2.5 | Enlucido de yeso en cielorrasos | Gypsum skim on ceilings | m² | Mat + MO + Total/m² | AyC Revista (Revoques) |

### Category 9 — Contrapisos y Carpetas

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 9.1.1 | Contrapiso sobre suelo natural esp. 0.15m | Sub-floor on natural ground 15cm | m² | Mat + MO + Total/m² | AyC Revista (Mampostería) |
| 9.1.2 | Contrapiso sobre platea de fundación esp. 0.10m | Sub-floor on foundation slab 10cm | m² | Mat + MO + Total/m² | AyC Revista |
| 9.1.3 | Contrapiso sobre losa entrepiso esp. 0.07m | Sub-floor on intermediate slab 7cm | m² | Mat + MO + Total/m² | AyC Revista |
| 9.2.1 | Carpeta de cemento bajo solado de micropiso | Cement screed under micro-cement finish | m² | Mat + MO + Total/m² | AyC Revista / CYPE |
| 9.2.2 | Carpeta de cemento bajo solado cerámico | Cement screed under ceramic tile | m² | Mat + MO + Total/m² | AyC Revista |
| 9.2.3 | Carpeta de cemento bajo solado exterior | Cement screed under exterior paving | m² | Mat + MO + Total/m² | AyC Revista |
| 9.2.4 | Carpeta hidrófuga (baños / locales húmedos) | Waterproof screed (bathrooms / wet areas) | m² | Mat + MO + Total/m² | AyC Revista |
| 9.2.5 | Carpeta autonivelante | Self-leveling screed | m² | Mat + MO + Total/m² | MercadoLibre API (self-leveling compound) + UOCRA MO |

### Category 10 — Pisos y Zócalos

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 10.1.1 | Cerámica esmaltada 20×20 (calidad estándar) | Glazed ceramic tile 20×20 (standard quality) | m² | Mat + MO + Total/m²; 3 quality tiers | AyC Revista (Pisos) |
| 10.1.2 | Porcellanato 60×60 | Porcelain tile 60×60 | m² | Mat + MO + Total/m²; rect/non-rect | AyC Revista (Pisos) |
| 10.1.3 | Porcellanato gran formato (80×80 / 60×120) | Large format porcelain tile | m² | Mat + MO + Total/m² | AyC Revista (Pisos) / MercadoLibre API |
| 10.1.4 | Micropiso cementicio (Tarquini o similar) | Micro-cement floor (Tarquini or similar) | m² | Mat + MO + Total/m² | AyC Revista (Pisos) |
| 10.1.5 | Mosaico calcáreo 20×20 | Calcareous mosaic 20×20 | m² | Mat + MO + Total/m² | AyC Revista (Pisos) |
| 10.1.6 | Piso flotante de madera (HDF/MDF) | Floating wood floor (HDF/MDF) | m² | Mat + MO + Total/m²; by thickness | AyC Revista (Pisos) / MercadoLibre API |
| 10.1.7 | Parquet de madera sólida | Solid wood parquet | m² | Mat + MO + Total/m²; by species | AyC Revista (Pisos) / MercadoLibre API |
| 10.1.8 | Hormigón alisado / pulido | Polished/smoothed concrete floor | m² | Mat + MO + Total/m² | AyC Revista (Pisos) |
| 10.1.9 | Adoquín / baldosa para exterior | Paving block / slab for exterior | m² | Mat + MO + Total/m² | AyC Revista (Pisos) / MercadoLibre API |
| 10.1.10 | Deck de madera natural o composite | Natural or composite wood deck | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 10.2.1 | Zócalo de MDF h:0.10m para pintar | MDF baseboard h:10cm for painting | ml | Mat + MO + Total/ml | AyC Revista (Zocalos) |
| 10.2.2 | Zócalo de porcellanato / cerámica | Porcelain / ceramic baseboard | ml | Mat + MO + Total/ml | AyC Revista (Zocalos) |
| 10.2.3 | Rodón de cemento (terminación económica) | Cement cove (economy finish) | ml | Mat + MO + Total/ml | AyC Revista (Zocalos) |

### Category 11 — Revestimientos

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 11.1.1 | Cerámica esmaltada 20×20 (hasta techo) | Glazed ceramic wall tile 20×20 (full height) | m² | Mat + MO + Total/m² | AyC Revista (Revestimientos) |
| 11.1.2 | Porcellanato en baños | Porcelain tile in bathrooms | m² | Mat + MO + Total/m² | AyC Revista (Revestimientos) |
| 11.1.3 | Microcemento en baños | Micro-cement in bathrooms | m² | Mat + MO + Total/m² | AyC Revista (Revestimientos) |
| 11.2.1 | Siding de madera pino tratado | Treated pine timber siding | m² | Mat + MO + Total/m² | AyC Revista / MercadoLibre API |
| 11.2.2 | Revestimiento vinílico o cementicío | Vinyl or cementitious cladding | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 11.3.1 | Granito gris Mara esp. 2cm lustrado (mesada) | Grey Mara granite 2cm polished countertop | m² | Mat + MO + Total/m² | AyC Revista (Revestimientos) |
| 11.3.2 | Alzado / guardacantos de granito h:0.20m | Granite splashback / edge h:20cm | ml | Mat + MO + Total/ml | AyC Revista |
| 11.3.3 | Cuarzo compactado (Silestone / similar) | Engineered quartz countertop (Silestone or similar) | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 11.3.4 | Hormigón pulido como mesada | Polished concrete countertop | m² | Mat + MO + Total/m² | Manual research |

### Category 12 — Cielorrasos

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 12.1 | Cielorraso de yeso aplicado (ver Revoques 8.2.4) | Applied gypsum ceiling (see 8.2.4) | m² | — (cross-reference 8.2.4) | AyC Revista (Revoques) |
| 12.2 | Cielorraso de roca de yeso suspendido (Durlock) | Suspended drywall ceiling (Durlock) | m² | Mat + MO + Total/m² | AyC Revista / MercadoLibre API (Durlock) |
| 12.3 | Cielorraso de PVC | PVC ceiling panels | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 12.4 | Cielorraso de madera (machimbre / placas) | Timber tongue-and-groove ceiling | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 12.5 | Sin cielorraso – estructura/losa vista | No ceiling — exposed structure/slab | m² | No cost (deactivate item) | N/A |

### Category 13 — Carpintería Exterior

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 13.1.1 | Puerta-ventana corrediza 2 hojas aluminio blanco 2.20×2.05 c/vidrio | Sliding double door/window aluminium white 2.20×2.05 with glass | un | Mat + MO + Total/unit | AyC Revista (Herrería/Aluminio) |
| 13.1.2 | Puerta-ventana corrediza 2 hojas aluminio blanco 1.62×2.05 c/vidrio | Sliding double door/window aluminium 1.62×2.05 with glass | un | Mat + MO + Total/unit | AyC Revista (Herrería/Aluminio) |
| 13.1.3 | Ventana 1 hoja proyectante aluminium 1.00×1.70 c/vidrio | Single casement/projected window aluminium 1.00×1.70 with glass | un | Mat + MO + Total/unit | AyC Revista (Herrería/Aluminio) |
| 13.1.4 | Ventana 1 hoja proyectante aluminium 0.90×1.00 c/vidrio | Single casement window aluminium 0.90×1.00 with glass | un | Mat + MO + Total/unit | AyC Revista (Herrería/Aluminio) |
| 13.1.5 | Ventana 1 hoja fija + proyectante aluminium 3.00×1.00 c/vidrio | Fixed + casement window aluminium 3.00×1.00 with glass | un | Mat + MO + Total/unit | AyC Revista (Herrería/Aluminio) |
| 13.1.6 | Vidrio DVH (doble vidriado hermético) | Double-glazed unit (DGU / IGU) | m² | Mat premium/m² (replaces single glass) | MercadoLibre API (DVH glass) + UOCRA MO |
| 13.2.1 | Portón frente perfil C + malla Q182 | Front gate profile C + mesh Q182 | ml | Mat + MO + Total/ml | AyC Revista (Herrería/Aluminio) |
| 13.2.2 | Puerta de chapa inyectada 0.90×2.05 c/marco BWG18 | Injected steel door 0.90×2.05 with BWG18 frame | un | Mat + MO + Total/unit | AyC Revista (Herrería/Aluminio) |
| 13.2.3 | Puerta doble hoja chapa lisa + marco L50×50 | Double-leaf flat steel door + L50×50 frame | un | Mat + MO + Total/unit | AyC Revista (Herrería/Aluminio) |
| 13.2.4 | Portón de cochera seccional / basculante | Sectional / tilt-up garage door | un | Mat + MO + Total/unit; manual/motorized | MercadoLibre API + UOCRA MO |
| 13.2.5 | Rejas exteriores (ventanas / patio) | Exterior security bars (windows / patio) | m² | Mat + MO + Total/m² | AyC Revista (Herrería/Aluminio) |

### Category 14 — Carpintería Interior

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 14.1.1 | Puerta de abrir 0.80×2.05 hoja MDF c/marco chapa doble contacto | Swing door 0.80×2.05 MDF leaf with double-contact steel frame | un | Mat + MO + Total/unit | AyC Revista (Carpintería madera) |
| 14.1.2 | Puerta de abrir 0.70×2.05 hoja MDF c/marco chapa doble contacto | Swing door 0.70×2.05 MDF leaf with double-contact steel frame | un | Mat + MO + Total/unit | AyC Revista (Carpintería madera) |
| 14.1.3 | Puerta vidriada 3 hojas bastidor madera + vidrio c/marco madera | 3-panel glazed door timber frame + glass with timber frame | un | Mat + MO + Total/unit | AyC Revista (Carpintería madera) |
| 14.2.1 | Placa de melamina (puertas corredizas) | Melamine sliding wardrobe doors | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 14.2.2 | Placard de madera lacada | Lacquered timber wardrobe | m² | Mat + MO + Total/m² | Manual research |

### Category 15 — Escalera

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 15.1 | Escalera de terciado fenólico 1" | Phenolic plywood formwork stair 1" | m² | Mat + MO + Total/m² | AyC Revista (Carpintería madera) |
| 15.2 | Puertas bajo escalera (2 hojas fenólico) | Under-stair doors (2 phenolic panels) | m² | Mat + MO + Total/m² | Manual research |
| 15.3 | Pedadas + alzadas terciado fenólico | Treads + risers phenolic plywood | m² | Mat + MO + Total/m² | AyC Revista |
| 15.4 | Escalera de hormigón revestida | Concrete stair with finish | m² | Mat + MO + Total/m² | AyC Revista (Estructura + Revestimientos) |
| 15.5 | Escalera metálica | Metal staircase | m² | Mat + MO + Total/m² | AyC Revista (Herrería) |
| 15.6 | Baranda / pasamano de hierro forjado | Wrought iron balustrade/handrail | ml | Mat + MO + Total/ml | AyC Revista (Herrería/Aluminio) |
| 15.7 | Baranda de vidrio templado | Tempered glass balustrade | ml | Mat + MO + Total/ml | AyC Revista (Vidrios y espejos) / MercadoLibre API |
| 15.8 | Baranda de acero inoxidable | Stainless steel balustrade | ml | Mat + MO + Total/ml | MercadoLibre API + UOCRA MO |

### Category 16 — Amoblamientos

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 16.1.1 | Bajo mesada estándar sin mesada | Standard base cabinet without countertop | un | Mat + MO + Total/unit | MercadoLibre API (kitchen cabinets) |
| 16.1.2 | Sobre mesada estándar sin mesada (alacenas) | Standard overhead cabinet / wall unit | un | Mat + MO + Total/unit | MercadoLibre API |
| 16.1.3 | Bajo mesada + alacenas en melamina premium | Base + overhead cabinets in premium melamine | gl | Mat + MO + Total lump sum | MercadoLibre API / manual |
| 16.1.4 | Bajo mesada + alacenas en madera lacada | Base + overhead cabinets in lacquered timber | gl | Mat + MO + Total lump sum | Manual research |
| 16.2.1 | Vanitory suspendido melamina | Suspended melamine vanity unit | un | Mat + MO + Total/unit | MercadoLibre API |
| 16.2.2 | Espejo sin bastidor 6mm | Frameless mirror 6mm | m² | Mat + MO + Total/m² | AyC Revista (Vidrios y espejos) |

### Category 17 — Instalación Eléctrica

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 17.1.1 | Acometida, caño y gabinete para medidor | Service entry conduit and meter cabinet | gl | Mat + MO + Total lump sum | AyC Revista (Inst. eléctrica) |
| 17.1.2 | Tablero principal TP01 (provisión + inst. + puesta en servicio) | Main switchboard TP01 (supply + install + commissioning) | gl | Mat + MO + Total lump sum; mono/tri-phase | AyC Revista (Inst. eléctrica) |
| 17.1.3 | Tablero seccional TS01 | Sub-panel TS01 | gl | Mat + MO + Total lump sum | AyC Revista (Inst. eléctrica) |
| 17.2.1 | Bocas de luz (centros y brazos) | Light points (ceiling and bracket) | un | Mat + MO + Total/unit | AyC Revista (Inst. eléctrica) |
| 17.2.2 | Tomacorrientes generales | General power outlets | un | Mat + MO + Total/unit | AyC Revista (Inst. eléctrica) |
| 17.2.3 | Tomacorrientes especiales (cocina / lavadero / AC) | Special outlets (kitchen / laundry / AC) | un | Mat + MO + Total/unit | AyC Revista (Inst. eléctrica) |
| 17.3.1 | Bocas telefónicas (canalización vacía) | Telephone points (empty conduit) | un | Mat + MO + Total/unit | AyC Revista |
| 17.3.2 | Bocas de TV (canalización vacía) | TV aerial points (empty conduit) | un | Mat + MO + Total/unit | AyC Revista |
| 17.3.3 | Timbre / videoportero | Doorbell / video entry system | un | Mat + MO + Total/unit; 3 tiers | MercadoLibre API + UOCRA MO |
| 17.4.1 | Puesta a tierra con jabalina cobre IRAM 2309 | Earth rod (copper, IRAM 2309) | un | Mat + MO + Total/unit | AyC Revista / MercadoLibre API |
| 17.5.1 | Alarma perimetral | Perimeter alarm system | gl | Mat + MO + Total lump sum | MercadoLibre API + UOCRA MO |
| 17.5.2 | CCTV (cámaras + DVR) | CCTV cameras + DVR | gl | Mat + MO + Total/camera count | MercadoLibre API + UOCRA MO |
| 17.5.3 | Automatización / domótica | Home automation / BMS | gl | Total lump sum by tier (basic/med/advanced) | Manual research |
| 17.5.4 | Paneles solares fotovoltaicos | Photovoltaic solar panels | gl | Mat + MO + Total/kW installed | MercadoLibre API + UOCRA MO |
| 17.5.5 | Cargador para vehículo eléctrico (EVSE) | Electric vehicle charger (EVSE) | un | Mat + MO + Total/unit | MercadoLibre API + UOCRA MO |

### Category 18 — Instalación Sanitaria

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 18.1.1 | Conexión a red de agua corriente | Connection to municipal water main | un | Total lump sum | Manual research (AYSA fees) |
| 18.1.2 | Caño PP termofusión Ø25mm (colector principal) | PP thermofusion pipe Ø25mm (main header) | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.1.3 | Llaves de paso – válvula suelta Ø25mm | Gate valve Ø25mm | un | Mat + MO + Total/unit | AyC Revista / MercadoLibre API |
| 18.1.4 | Canilla de servicio (bronce cromado) | Service tap (chrome brass) | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.2.1 | Tanque de reserva 1000 L (Rotoplas o similar) | 1000L reserve tank (Rotoplas or similar) | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.2.2 | Colectores y bajadas PP termofusión | PP thermofusion manifolds and risers | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.2.3 | Válvulas esféricas y de limpieza | Ball valves and purge valves | gl | Mat + MO + Total lump sum | MercadoLibre API |
| 18.2.4 | Bomba presurizadora agua fría (ROWA o similar) | Cold water pressure booster pump | gl | Mat + MO + Total lump sum | MercadoLibre API |
| 18.3.1 | Caño PP termofusión Ø32mm | PP thermofusion pipe Ø32mm | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.3.2 | Caño PP termofusión Ø25mm | PP thermofusion pipe Ø25mm | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.3.3 | Caño PP termofusión Ø20mm | PP thermofusion pipe Ø20mm | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.3.4 | Llaves de paso termofusión Ø19mm c/campana cromada | Thermofusion gate valve Ø19mm with chrome cap | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.4.1 | Conexión a red cloacal (AYSA / prestador) | Connection to sewerage network | un | Total lump sum | Manual research (AYSA fees) |
| 18.4.2 | PP Aquaduct Ø110 (cloacal primaria) | PP Aquaduct Ø110 (primary sewer) | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.4.3 | PP Aquaduct Ø63 (cloacal secundaria) | PP Aquaduct Ø63 (secondary sewer) | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.4.4 | PP Aquaduct Ø40 (secundaria baños) | PP Aquaduct Ø40 (bathroom drains) | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.4.5 | Pileta de piso abierta pPNc63 c/marco y reja 10×10 | Floor drain with frame and 10×10 grate | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.4.6 | Boca de acceso mamp. 20×20 c/marco y tapa inox | Masonry access chamber 20×20 with stainless cover | un | Mat + MO + Total/unit | AyC Revista / MercadoLibre API |
| 18.4.7 | Cámara de inspección 60×60 | Inspection manhole 60×60 | un | Mat + MO + Total/unit | AyC Revista |
| 18.4.8 | Cámara séptica + pozo absorbente | Septic tank + soakaway | gl | Mat + MO + Total lump sum | Manual research |
| 18.5.1 | PP Aquaduct Ø110 (pluvial) | PP Aquaduct Ø110 (stormwater) | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 18.5.2 | Boca de desagüe mampostería 20×20 c/tapa inox | Stormwater gully 20×20 with stainless cover | un | Mat + MO + Total/unit | AyC Revista / MercadoLibre API |
| 18.5.3 | Canaletas y bajadas (zinguería) | Gutters and downpipes | ml | Cross-reference rubro 7 | See 7.1.6 |
| 18.6.1 | Inodoro Ferrum Florencia c/depósito apoyar | Ferrum Florencia close-coupled WC | un | Mat + MO + Total/unit; 3 quality tiers | MercadoLibre API |
| 18.6.2 | Bidet Ferrum Florencia | Ferrum Florencia bidet | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.6.3 | Lavatorio Ferrum Andina | Ferrum Andina washbasin | un | Mat + MO + Total/unit; over/under/vessel variants | MercadoLibre API |
| 18.6.4 | Bañera acrílica Ferrum Serena 160 | Ferrum Serena 160 acrylic bath | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.6.5 | Pileta simple de cocina | Single bowl kitchen sink | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.6.6 | Pileta doble de cocina | Double bowl kitchen sink | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.6.7 | Grifería FV Kansas lavatorio | FV Kansas washbasin tap | un | Mat + MO + Total/unit; 3 quality tiers | MercadoLibre API |
| 18.6.8 | Grifería FV Kansas bidet | FV Kansas bidet tap | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.6.9 | Grifería FV Kansas ducha | FV Kansas shower fitting | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.6.10 | Grifería FV Kansas monocomando cocina | FV Kansas kitchen mixer tap | un | Mat + MO + Total/unit | MercadoLibre API |
| 18.6.11 | Kit accesorios de baño FV Marina | FV Marina bathroom accessories kit | un | Mat + MO + Total/unit | MercadoLibre API |

### Category 19 — Instalación de Gas

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 19.1.1 | Conexión a red con instalación doble y regulador de presión | Connection to gas main with dual installation and pressure regulator | un | Mat + MO + Total lump sum | Manual research (MetroGAS fees) |
| 19.1.2 | Colocación de medidor de gas | Gas meter installation | gl | Mat + MO + Total lump sum | Manual research |
| 19.2.1 | Cañería epoxi c/accesorios Ø25mm | Epoxy-coated gas pipe Ø25mm with fittings | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 19.2.2 | Cañería epoxi c/accesorios Ø19mm | Epoxy-coated gas pipe Ø19mm with fittings | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 19.2.3 | Cañería epoxi c/accesorios Ø13mm | Epoxy-coated gas pipe Ø13mm with fittings | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 19.2.4 | Llaves de paso aprobadas c/campana cromada Ø19mm | Approved gas valve Ø19mm with chrome cap | un | Mat + MO + Total/unit | MercadoLibre API |
| 19.2.5 | Llaves de paso aprobadas c/campana cromada Ø13mm | Approved gas valve Ø13mm with chrome cap | un | Mat + MO + Total/unit | MercadoLibre API |
| 19.3.1 | Calefón TB Orbis 14 Lts. (o similar) | Orbis 14L balanced-flue water heater (or similar) | un | Mat + MO + Total/unit | MercadoLibre API |
| 19.3.2 | Estufa de gas tiro balanceado 2500 kcal | Balanced-flue gas heater 2500 kcal | un | Mat + MO + Total/unit | MercadoLibre API |
| 19.3.3 | Cocina (Orbis / Longvie / similar) | Gas range (Orbis / Longvie / similar) | un | Mat + MO + Total/unit; 4 or 6 burners | MercadoLibre API |
| 19.3.4 | Caldera de calefacción central | Central heating boiler | un | Mat + MO + Total/unit by brand/power | MercadoLibre API / manual |
| 19.4.1 | Caño de zinc 4" c/sombrerete (salida calefón) | 4" zinc flue pipe with cap (water heater outlet) | ml | Mat + MO + Total/ml | AyC Revista / MercadoLibre API |
| 19.4.2 | Rejillas de ventilación inferior y superior (cocina) | Low and high kitchen ventilation grilles | un | Mat + MO + Total/unit | MercadoLibre API |

### Category 20 — Climatización

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 20.1.1 | Losa radiante (tubo PEX + manifold + caldera) | Radiant floor (PEX tube + manifold + boiler) | m² | Mat + MO + Total/m² | Manual research / CYPE |
| 20.1.2 | Piso radiante eléctrico | Electric radiant floor | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 20.2.1 | Split inverter (por unidad interior) | Inverter split AC (per indoor unit) | un | Mat + MO + Total/unit by capacity (2250–6000 frig) | MercadoLibre API |
| 20.2.2 | Cassette / conducto oculto (por unidad) | Cassette / concealed duct AC (per unit) | un | Mat + MO + Total/unit | MercadoLibre API + UOCRA MO |
| 20.2.3 | Sistema multi-split (1 exterior – N interiores) | Multi-split system (1 outdoor – N indoor) | gl | Mat + MO + Total lump sum | MercadoLibre API + UOCRA MO |
| 20.2.4 | Sistema VRF/VRV (edificios) | VRF/VRV system (buildings) | gl | Mat + MO + Total lump sum | Manual research |
| 20.3.1 | Extractor de baños (axial o centrífugo) | Bathroom extractor fan | un | Mat + MO + Total/unit | MercadoLibre API |
| 20.3.2 | Extractor de cocina / campana | Kitchen extractor hood | un | Mat + MO + Total/unit | MercadoLibre API |
| 20.3.3 | Ventilación doble flujo HRV (recuperador de calor) | HRV heat recovery ventilation system | gl | Mat + MO + Total lump sum | Manual research |

### Category 21 — Ahorro Energético / Energías Renovables

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 21.1 | Termotanque solar c/tanque prellenado (FIASA CF-150 RI o similar) | Solar water heater with pre-filled tank (FIASA CF-150 or similar) | un | Mat + MO + Total/unit | MercadoLibre API |
| 21.2 | Termotanque eléctrico (estándar) | Electric water heater (standard) | un | Mat + MO + Total/unit | MercadoLibre API |
| 21.3 | Calefón a condensación (alta eficiencia) | Condensing water heater (high efficiency) | un | Mat + MO + Total/unit | MercadoLibre API |
| 21.4 | Paneles solares fotovoltaicos (ver 17.5.4) | Photovoltaic panels (see 17.5.4) | gl | Cross-reference 17.5.4 | — |

### Category 22 — Pinturas

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 22.1 | Látex c/retoques de enduido en paredes interiores | Latex with filler on interior walls | m² | Mat + MO + Total/m²; 3 quality tiers | AyC Revista (Pintura) |
| 22.2 | Látex c/retoques de enduido en cielorrasos | Latex with filler on ceilings | m² | Mat + MO + Total/m² | AyC Revista (Pintura) |
| 22.3 | Esmalte sintético en carpintería metálica | Synthetic enamel on metalwork | m² | Mat + MO + Total/m² | AyC Revista (Pintura) |
| 22.4 | Esmalte sintético en carpintería de madera | Synthetic enamel on timber joinery | m² | Mat + MO + Total/m² | AyC Revista (Pintura) |
| 22.5 | Látex exterior (fachada) | Exterior latex paint (facade) | m² | Mat + MO + Total/m² | AyC Revista (Pintura) |
| 22.6 | Pintura de tráfico (pisos de cochera) | Traffic paint (garage floor) | m² | Mat + MO + Total/m² | AyC Revista (Pintura) / MercadoLibre API |

### Category 23 — Exteriores y Paisajismo

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 23.1 | Vereda pública (hormigón / mosaico) | Public sidewalk (concrete / mosaic) | m² | Mat + MO + Total/m² | AyC Revista (Pisos) |
| 23.2 | Entrada vehicular (hormigón / adoquín / pórfido) | Vehicle entrance (concrete / paving / porphyry) | m² | Mat + MO + Total/m² | AyC Revista (Pisos) |
| 23.3 | Jardín / césped natural | Garden / natural grass | m² | Mat + MO + Total/m² | Manual research |
| 23.4 | Césped artificial | Artificial turf | m² | Mat + MO + Total/m² | MercadoLibre API |
| 23.5 | Sistema de riego automático | Automatic irrigation system | gl | Mat + MO + Total lump sum | Manual research |
| 23.6 | Pileta de natación – hormigón proyectado (gunite) | Swimming pool — gunite/shotcrete | gl | Mat + MO + Total lump sum by dimension | Manual research |
| 23.7 | Pileta de natación – prefabricada de fibra | Swimming pool — prefab fibreglass | gl | Mat + MO + Total lump sum | MercadoLibre API / manual |
| 23.8 | Quincho / parrilla cubierta | Covered BBQ area / outdoor kitchen | m² | Mat + MO + Total/m² | Manual research |
| 23.9 | Deck de madera / composite exterior | Exterior timber or composite deck | m² | Mat + MO + Total/m² | MercadoLibre API + UOCRA MO |
| 23.10 | Iluminación exterior (artefactos + cableado) | Exterior lighting (fixtures + wiring) | gl | Mat + MO + Total lump sum | MercadoLibre API + UOCRA MO |
| 23.11 | Cerco perimetral definitivo (mampostería / reja) | Permanent perimeter fence (masonry / iron) | ml | Mat + MO + Total/ml; material + height variants | AyC Revista (Herrería) / manual |

### Category 24 — Varios

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 24.1 | Limpieza diaria de obra | Daily site cleaning | gl | MO + Total lump sum (% of direct cost) | UOCRA MO |
| 24.2 | Limpieza final de obra | Final site clean | gl | MO + Total lump sum | UOCRA MO |
| 24.3 | Ayuda de gremios | Trades coordination allowance | gl | Total (% of direct cost, typically 1-2%) | Derived coefficient |

### Category 25 — Seguridad e Higiene de Obra

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 25.1 | Programa de seguridad e higiene (elaboración) | OHS program preparation | gl | Total lump sum | Manual research (professional fees) |
| 25.2 | Visitas periódicas del responsable de S&H | Periodic OHS officer site visits | gl | Total lump sum | Manual research |
| 25.3 | Elementos de protección personal (EPP) | Personal protective equipment | gl | Mat + Total lump sum | MercadoLibre API + manual |

### Category 26 — Plan de Gestión Ambiental

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 26.1 | Programa de ahorro de agua potable | Water conservation program | gl | Total lump sum | Manual research |
| 26.2 | Programa de difusión y señalética | Awareness and signage program | gl | Mat + Total lump sum | Manual research |
| 26.3 | Auditoría de contaminación acústica | Acoustic pollution audit | gl | Total lump sum | Manual research |
| 26.4 | Plan de gestión de residuos de obra | Construction waste management plan | gl | Total lump sum | Manual research |

### Category 27 — Equipamiento Especial (Opcional)

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 27.1 | Ascensor hidráulico o eléctrico | Hydraulic or electric lift | gl | Mat + MO + Total lump sum by stops/capacity | Manual research |
| 27.2 | Cisterna enterrada (Rotoplas 1300 L) | Underground cistern tank 1300L | un | Mat + MO + Total/unit | MercadoLibre API |
| 27.3 | Generador / UPS | Generator / UPS | gl | Mat + MO + Total lump sum | MercadoLibre API |
| 27.4 | Bicicletero | Bicycle storage | gl | Mat + MO + Total lump sum | Manual research |

### Category 28 — Honorarios y Gastos Indirectos

| Code | Description (Spanish) | Description (English) | Unit | Data Needed | Suggested Source |
|------|----------------------|----------------------|------|-------------|-----------------|
| 28.1 | Proyecto ejecutivo (arquitectura + estructura + instalaciones) | Architectural + structural + MEP drawings | gl | % of construction cost or fixed fee | CPAU fee schedule |
| 28.2 | Dirección de obra | Construction management / site supervision | gl | % of certified cost or CPAU scale | CPAU fee schedule |
| 28.3 | Visado municipal y trámites (DGROC / municipio) | Municipal permit and approvals | gl | m² declared × municipal rate | Manual (by municipality) |
| 28.4 | Seguros de obra (ART + RC) | Site insurance (workers' comp + public liability) | gl | % of payroll / lump sum | Manual research |
| 28.5 | Gastos generales directos | Direct overhead | % | Rate: 8–12% of direct cost | Hardcoded range |
| 28.6 | Gastos generales indirectos | Indirect overhead | % | Rate: 4–6% of direct cost | Hardcoded range |
| 28.7 | Beneficio / utilidad | Contractor profit | % | Rate: 10–15% | Hardcoded range |
| 28.8 | Impuestos (IIBB + otros) | Taxes (gross income + others) | % | Rate: varies by jurisdiction | Hardcoded (AMBA typical) |
| 28.9 | Costo financiero | Financing cost | % | Rate: depends on term and prevailing rate | BCRA API (reference rate) |
| 28.10 | IVA | VAT | % | 21% fixed | Hardcoded: 21% |

---

## 2. User Input Parameters

All 56 questionnaire questions, organized by category. Express mode questions marked with *.

| # | Question | Options | Impact on Line Items | Express Mode? |
|---|----------|---------|---------------------|---------------|
| **DATOS GENERALES** | | | | |
| 1 | ¿Cuál es la superficie cubierta total? (m²) | Free numeric input | Base multiplier for ALL line items | * |
| 2 | ¿Cuántas plantas tiene el edificio? | 1 / 2 / 3 / más de 3 | Structure, MEP, vertical circulation | * |
| 3 | ¿El proyecto tiene subsuelo? | Sí / No | Earthwork, foundations, vertical waterproofing (6.2.1) | |
| 4 | ¿Tiene cochera cubierta? | Sí / No → m² | Structure, floors, enclosures, traffic paint (22.6) | |
| 5 | ¿Tiene quincho / parrilla? | Sí / No → m² | Roofing, masonry, gas, exteriors (cat 23) | |
| 6 | ¿Tiene pileta de natación? | Sí / No | Cat 23 pool items; triggers special structure + membranes | |
| **TERRENO Y TRABAJOS PRELIMINARES** | | | | |
| 7 | ¿El terreno requiere limpieza / desmalezado? | Sí / No → m² | 1.01 | |
| 8 | ¿Hay árboles a talar? | Sí, cantidad / No | 1.04 (count-based) | |
| 9 | ¿Se requiere nivelación del terreno? | Sí / No → m³ estimado | Cat 3 earthwork items | |
| 10 | ¿Se incluye obrador? | Sí / No → tamaño (peq./med./gde.) | 1.02 | |
| 11 | ¿Hay demolición existente? | Sin / Parcial / Total → m² | 1.05 | |
| **SISTEMA ESTRUCTURAL** | | | | |
| 12 | ¿Cuál es el sistema estructural principal? | H°A° / Ladrillo portante / Steel frame / Wood frame / Metálica | Cat 4 + 5 (major activation/deactivation) | * |
| 13 | ¿Qué tipo de fundación? | Platea / Platea+vigas / Zapatas+vigas / Pilotes | Cat 3 + 4.1.1–4.1.2 | |
| 14 | ¿Qué tipo de losa? | Maciza / Vigueta+bovedilla / Vigueta+EPS / Pretensada / Chapa colaborante | 4.1.6, 4.1.7, 4.2.1, 4.2.2 | |
| 15 | ¿La estructura incluye hormigón visto? | Sí / No | 4.1.9 | |
| **MAMPOSTERÍA** | | | | |
| 16 | ¿Tipo de muro exterior? | Ladrillo hueco 8/12/20cm / Portante / Steel frame / Wood frame / Curtain wall | Cat 5 (activates specific wall items) | |
| 17 | ¿Tipo de muro interior (tabiques)? | Ladrillo hueco 8/14cm / Durlock / Mixto | 5.2.1, 5.2.4, 5.5.1 | |
| 18 | ¿Se incluye ladrillo visto en fachada? | Sí / No | 5.4.1 + deactivates 8.1.x for that area | |
| **CUBIERTA** | | | | |
| 19 | ¿Tipo de cubierta / techo? | Azotea inaccesible / Transitable / Chapa trapezoidal / Chapa prepintada / Tejas / Panel sándwich | Cat 7 (major activation tree) | * |
| 20 | ¿Se incluye cubierta verde? | Sí / No | 7.7.1 + requires structural reinforcement | |
| **AISLACIONES** | | | | |
| 21 | ¿Se incluye aislación térmica en cubierta? | EPS / Lana de roca / Poliuretano / No | 6.3.1, 6.3.2, 6.3.4 | |
| 22 | ¿Se incluye aislación térmica en muros? | ETICS / Lana entre montantes / Cámara de aire / No | 6.3.2, 6.3.3 | |
| 23 | ¿Hay muros en contacto con terreno? | Sí / No | 6.2.1 | |
| **REVOQUES Y TERMINACIONES EXTERIORES** | | | | |
| 24 | ¿Tipo de terminación exterior de fachada? | Revoque+pintura / Simil piedra / ETICS / Ladrillo visto / Siding/paneles | 8.1.1–8.1.4, 11.2.1–11.2.2 | |
| **PISOS Y REVESTIMIENTOS** | | | | |
| 25 | ¿Tipo de piso en áreas secas? | Porcellanato / Micropiso / Mosaico / Cerámico / Flotante / Parquet / Hormigón alisado | 10.1.1–10.1.8 | * |
| 26 | ¿Tipo de piso en baños? | Cerámica / Porcellanato / Mosaico / Microcemento | 10.1.1–10.1.4 (bathroom subset) | |
| 27 | ¿Tipo de revestimiento en baños? | Cerámica / Porcellanato / Mosaico / Microcemento (full height / 1.80m) | 11.1.1–11.1.3 | |
| 28 | ¿Tipo de mesada? | Granito / Cuarzo / Porcellanato / Hormigón / Madera | 11.3.1–11.3.4 | |
| **CARPINTERÍA Y HERRERÍA** | | | | |
| 29 | ¿Tipo de carpintería exterior? | Aluminio económico / medio / premium / PVC / Madera / Acero | 13.1.1–13.1.5, 13.2.1–13.2.3 | |
| 30 | ¿Se incluye DVH? | Sí / No → cámara 6/9/12mm | 13.1.6 (cost premium on all windows) | |
| 31 | ¿Portón de cochera? | No / Seccional manual / Seccional motorizado / Corredizo | 13.2.4 | |
| 32 | ¿Tipo de puertas interiores? | Chapa inyectada / MDF / Madera maciza / Vidriada | 14.1.1–14.1.3 | |
| 33 | ¿Se incluyen placares? | Sí / No → m² estimado | 14.2.1–14.2.2 | |
| 34 | ¿Se incluye escalera interior? | No / Hormigón / Metálica / Madera fenólico / Madera sólida | Cat 15 | |
| **MUEBLES Y EQUIPAMIENTO** | | | | |
| 35 | ¿Se incluyen muebles de cocina? | No / Bajo mesada+alacenas estándar / Premium / A medida | 16.1.1–16.1.4 | |
| 36 | ¿Se incluyen vanitorios de baño? | Sí / No | 16.2.1, 16.2.2 | |
| **INSTALACIÓN ELÉCTRICA** | | | | |
| 37 | ¿Tipo de tablero? | Monofásico / Trifásico | 17.1.2 | |
| 38 | ¿Calidad de terminaciones eléctricas? | Económica / Media / Premium | 17.2.1–17.2.3 (unit price tier) | |
| 39 | ¿Se incluye videoportero? | No / Portero eléctrico / Videoportero / Con app | 17.3.3 | |
| 40 | ¿Extras eléctricos? | Alarma / CCTV / Domótica / Paneles solares / Cargador EV / Ninguno | 17.5.1–17.5.5 (multi-select) | |
| **INSTALACIÓN SANITARIA** | | | | |
| 41 | ¿Conexión a redes de servicios? | Red pública agua+cloaca / Pozo+cámara séptica / Mixto | 18.1.1, 18.4.1 vs 18.4.8 | |
| 42 | ¿Se incluye tanque de reserva? | Sí (1000L / 1300L) / No | 18.2.1 | |
| 43 | ¿Se incluye bomba presurizadora? | Sí / No | 18.2.4 | |
| 44 | ¿Calidad de artefactos sanitarios? | Económica / Media / Premium | 18.6.1–18.6.11 (price tier) | |
| 45 | ¿Se incluye bañera? | Bañera acrílica / Hidromasaje / Receptáculo ducha / Sin bañera | 18.6.4 | |
| 46 | ¿Calentador de agua? | Termotanque gas / Calefón TB / Calefón sin piloto / Solar / Caldera | 19.3.1, 21.1–21.3 | |
| **INSTALACIÓN DE GAS** | | | | |
| 47 | ¿Tipo de red de gas? | Gas natural / GLP envasado / GLP granel | 19.1.1–19.1.2 or alternative | |
| 48 | ¿Artefactos a gas? | Cocina / Calefón / Caldera / Estufas / Asador / Múltiples | 19.3.1–19.3.4 (multi-select) | |
| **CLIMATIZACIÓN** | | | | |
| 49 | ¿Sistema de calefacción? | Estufas gas / Losa radiante / Piso eléctrico / Radiadores+caldera / Fan coil / Ninguno | 20.1.1–20.1.2, 19.3.2 | |
| 50 | ¿Sistema de refrigeración / AC? | Ninguno / Split inverter (qty) / Multi-split / VRF | 20.2.1–20.2.4 | |
| **PINTURAS** | | | | |
| 51 | ¿Calidad de pinturas interiores? | Económica / Media / Premium | 22.1–22.2 (unit price tier) | |
| **EXTERIORES** | | | | |
| 52 | ¿Se incluye vereda y acceso vehicular? | Sí / No → material | 23.1, 23.2 | |
| 53 | ¿Tipo de jardín? | Sin jardín / Césped natural / Artificial / Paisajismo completo | 23.3–23.5 | |
| 54 | ¿Cerco perimetral definitivo? | No / Mampostería / Reja / Mixto → ml + height | 23.11 | |
| **GESTIÓN Y HONORARIOS** | | | | |
| 55 | ¿Se incluyen honorarios en el presupuesto? | Sí (proyecto+DO) / Solo DO / No | 28.1, 28.2 | |
| 56 | ¿Se incluye Seguridad e Higiene? | Sí / No | Cat 25 | |

### Express Mode Questions (5–8 Key Inputs)

These 6 questions give enough signal to produce a reliable ±20% estimate using incidence percentages from FERES data:

| Priority | Question # | Why It's Sufficient |
|----------|-----------|---------------------|
| 1 | Q1 — m² | The single base multiplier for everything |
| 2 | Q2 — Stories | Scales structure, MEP, circulation |
| 3 | Q12 — Structural system | Determines ~30% of cost (cat 4+5) |
| 4 | Q19 — Roof type | Determines azotea vs pitched sequence (cat 7) |
| 5 | Q25 — Floor finish | Signals overall finish quality level |
| 6 | Q29 — Exterior joinery | Secondary quality signal |

---

## 3. Derived Quantities

How each major line item category's quantity is computed from the ~14 base measurements.

**Base measurements collected:**
- `m2_total` — total covered floor area (sum of all stories)
- `m2_pisada` — building footprint (ground floor area)
- `n_plantas` — number of stories
- `h_piso` — ceiling height (default 2.60m)
- `perimetro` — building perimeter (ml)
- `m2_azotea` — roof/terrace area (≈ m2_pisada for flat roof)
- `n_banos` — number of bathrooms
- `n_cocinas` — number of kitchens (typically 1)
- `n_ventanas` — window count
- `n_puertas_ext` — exterior door count
- `n_puertas_int` — interior door count
- `tiene_subsuelo` — boolean
- `tiene_cochera` — boolean
- `tiene_pileta` — boolean

| Line Item / Category | Quantity Formula | Depends On |
|---------------------|-----------------|------------|
| **Cat 1 — Site clearing (1.01)** | m2_terreno (user input) | terrain area |
| **Cat 1 — Obrador (1.02)** | Small: 15m², Medium: 25m², Large: 40m² | scale choice |
| **Cat 3 — Topsoil removal (3.1.1)** | m2_pisada × 0.30m = m³ | m2_pisada |
| **Cat 3 — Foundation trenches (3.1.2)** | perimetro × avg_depth × avg_width (≈ perimetro × 0.60 × 0.40) | perimetro |
| **Cat 4 — Foundation raft (4.1.1)** | m2_pisada × esp_platea (0.22m) = m³ | m2_pisada |
| **Cat 4 — Ring beams (4.1.2)** | perimetro × n_plantas (ml) | perimetro, n_plantas |
| **Cat 4 — Prestressed joist slab (4.2.1)** | m2_total (m²) | m2_total |
| **Cat 5 — Exterior masonry walls** | perimetro × h_piso × n_plantas × 0.85 (−15% for openings) | perimetro, h_piso, n_plantas |
| **Cat 5 — Interior partition walls** | m2_total × 1.20 coefficient (interior wall area ≈ 1.2× floor area) | m2_total |
| **Cat 6 — Horizontal damp course (6.1.x)** | perimetro (ml, same as wall base perimeter) | perimetro |
| **Cat 6 — Horizontal waterproof render (6.1.3)** | m2_total (applied over all sub-floors) | m2_total |
| **Cat 6 — Vertical waterproofing (6.2.1)** | perimetro × subsuelo_depth (only if tiene_subsuelo) | perimetro, tiene_subsuelo |
| **Cat 7 — Flat roof (7.1.x)** | m2_azotea (≈ m2_pisada) | m2_pisada |
| **Cat 7 — Pitched roof area** | m2_pisada ÷ cos(roof_angle) × 1.15 ridge/overhang factor | m2_pisada, roof_pitch |
| **Cat 8 — Exterior render (8.1.x)** | perimetro × h_piso × n_plantas × 0.85 (−openings) | same as exterior masonry |
| **Cat 8 — Interior plaster (8.2.x)** | (perimetro × h_piso × n_plantas × 0.85) + (m2_total × 1.20 × h_piso × 0.85) | perimetro, h_piso, n_plantas, m2_total |
| **Cat 8 — Ceiling render (8.2.4)** | m2_total | m2_total |
| **Cat 9 — Sub-floors (9.1.x)** | m2_total (on ground floor: over natural ground; upper floors: over slab) | m2_total, n_plantas |
| **Cat 9 — Screed (9.2.x)** | m2_total | m2_total |
| **Cat 10 — Floor finish (10.1.x)** | m2_total (dry areas = m2_total − bathroom area) | m2_total, n_banos |
| **Cat 10 — Baseboards (10.2.x)** | perimetro_interior = m2_total × 0.4 (approx. linear m per m² of floor) | m2_total |
| **Cat 11 — Bathroom wall tiles (11.1.x)** | n_banos × avg_bano_perimetro × h_piso (default: n_banos × 8ml × 2.60m = 20.8m² per bath) | n_banos |
| **Cat 11 — Countertops (11.3.x)** | n_cocinas × avg_mesada_area (default: 1 kitchen × 1.80m²) | n_cocinas |
| **Cat 12 — Ceilings (12.x)** | m2_total | m2_total |
| **Cat 13 — Exterior windows/doors (13.1.x, 13.2.x)** | n_ventanas × unit_cost + n_puertas_ext × unit_cost | counts |
| **Cat 14 — Interior doors (14.1.x)** | n_puertas_int × unit_cost | count |
| **Cat 14 — Wardrobes (14.2.x)** | user input (m²) or default: n_dormitorios × 2.0m² | m2 input |
| **Cat 15 — Stair (15.x)** | m2_projection = stair_width × (n_plantas−1) × avg_run | n_plantas |
| **Cat 16 — Kitchen cabinets (16.1.x)** | n_cocinas × units; defaults: 3 base + 3 overhead per kitchen | n_cocinas |
| **Cat 17 — Electrical (17.2.x light points)** | m2_total × coef_bocas_luz (≈ 0.5 bocas/m²) | m2_total |
| **Cat 17 — Power outlets** | m2_total × coef_tomas (≈ 0.4 outlets/m²) | m2_total |
| **Cat 18 — Water pipes (18.1–18.3)** | ml ≈ m2_total × 0.8 (linear pipe run coefficient) | m2_total, n_banos |
| **Cat 18 — Sewer pipes (18.4.x)** | ml ≈ m2_total × 0.6 | m2_total, n_banos |
| **Cat 18 — Fixtures (18.6.x)** | n_banos × fixtures_per_bath (inodoro+bidet+lavatorio+grifería per bath) | n_banos |
| **Cat 19 — Gas pipes (19.2.x)** | ml ≈ m2_total × 0.4 | m2_total |
| **Cat 19 — Gas appliances (19.3.x)** | count per user selection | user choice |
| **Cat 22 — Interior paint (22.1)** | wall_area_interior + m2_total (ceilings) = (wall_area × 0.85) + m2_total | m2_total, perimetro, n_plantas |
| **Cat 22 — Exterior paint (22.5)** | same as exterior render area | perimetro, h_piso, n_plantas |
| **Cat 23 — Sidewalk (23.1)** | frente_terreno × 1.20m width (user input or default 8ml front) | frente input |
| **Cat 24 — Cleaning (24.1)** | Global: % of direct cost (≈ 0.9%) | total direct cost |
| **Cat 25–26 — OHS/Environmental** | Global lump sums (% of direct cost or fixed) | m2_total, obra_type |
| **Cat 28 — GG + profit + IVA** | Applied as % chain on subtotal | total direct cost |

### FERES UT2 Reference Coefficients (calibration baseline)

These are the incidence percentages from the xlsx for items with known values. Use these for Express mode estimation:

| Category | Incidence % (of total) |
|----------|----------------------|
| 1.01 Limpieza terreno | 1.17% |
| 2.01 Cerco provisorio | 0.29% |
| 3.2.1 Relleno compactado | 2.08% |
| 4.1.1 Platea fundación | 4.29% |
| 4.1.2 Vigas encadenado | 2.27% |
| 4.2.1 Losa vigueta T50 | 7.65% |
| 5.3.1 Muro portante cerámico | 7.46% |
| 8.1.1 Revoque exterior | 5.58% |
| 10.1.4 Micropiso cementicio | 3.37% |
| 18.x Sanitaria (composite) | ~6–8% |
| 19.x Gas (composite) | ~2–3% |
| 22.1 Pintura interior | 1.12% |

---

## 4. Exclusion Logic

Conditional rules from Sheet 4 (LÓGICA APP) and the questionnaire.

| Condition | Items / Categories Activated | Items / Categories Deactivated |
|-----------|------------------------------|-------------------------------|
| **Sistema estructural = Steel frame** | 4.3.1, 4.3.2, 5.5.1, 5.5.2 | 4.1.1–4.1.9 (in-situ RC), 5.1–5.4 masonry walls |
| **Sistema estructural = Ladrillo portante** | 5.3.1, 5.3.2 | 4.1.3 (columns), 4.1.4 (beams) in plan |
| **Sistema estructural = Wood frame** | 4.4.1 | Same as steel frame deactivations |
| **Sistema estructural = Estructura metálica** | 4.5.1–4.5.3 | 4.1.3–4.1.6 RC elements |
| **Sistema estructural = H°A° tradicional** | 4.1.1–4.1.9, 5.1–5.4 masonry | 4.3.x, 4.4.x, 4.5.x |
| **Sin subsuelo** | — | 6.2.1 (vertical waterproofing) |
| **Con subsuelo** | 6.2.1, 3.1.2/3.1.3 extra excavation | — |
| **Cubierta = Azotea inaccesible** | 7.1.1–7.1.6 | 7.2.x, 7.3.x, 7.4.x |
| **Cubierta = Azotea transitable** | 7.1.1–7.1.6 + 7.2.1 | 7.3.x, 7.4.x |
| **Cubierta = Chapa trapezoidal** | 7.3.1, 7.5.1 or 7.5.2 | 7.1.x, 7.2.x, 7.4.x |
| **Cubierta = Chapa prepintada** | 7.3.2, 7.5.x | 7.1.x, 7.2.x, 7.4.x |
| **Cubierta = Tejas cerámicas** | 7.4.1 or 7.4.2, 7.5.1 | 7.1.x, 7.2.x, 7.3.x |
| **Cubierta = Panel sándwich** | 7.3.4 | 7.1.x, 7.2.x, 7.4.x |
| **Cubierta verde = Sí** | 7.7.1, structural reinforcement (surcharge) | — |
| **Sin pileta** | — | 23.6, 23.7 |
| **Sin gas de red** | 19.1.1 (GLP variant instead), GLP tank | 19.1.1 (MetroGAS connection) |
| **Gas = GLP envasado** | GLP cylinder setup | MetroGAS connection 19.1.1 |
| **Sin red cloacal** | 18.4.8 (septic + soakaway) | 18.4.1 (AYSA connection), 18.4.2–18.4.7 reduced |
| **Ladrillo visto en fachada** | 5.4.1 | 8.1.1–8.1.3 (no render on that facade area) |
| **Sin cielorraso** (12.5) | — | 12.2–12.4 |
| **No muebles de cocina** | — | Cat 16.1.x |
| **No vanitorios** | — | 16.2.1 |
| **No escalera interior** | — | Cat 15 |
| **No S&H** | — | Cat 25 |
| **Sin honorarios** | — | 28.1, 28.2 |
| **Calefacción = Losa radiante** | 20.1.1, 19.3.4 (boiler required) | 19.3.2 (gas heaters) |
| **AC = Ninguno** | — | 20.2.1–20.2.3 |

---

## 5. Cost Structure

Full cost build-up from direct cost to final price.

```
LEVEL 1: DIRECT COST (Costo Directo)
  = SUM of all active line items × quantities × unit costs

LEVEL 2: DIRECT OVERHEAD (Gastos Generales Directos)  [item 28.5]
  = Direct Cost × 8–12%
  Covers: site management, small tools, temporary works not itemized

LEVEL 3: INDIRECT OVERHEAD (Gastos Generales Indirectos)  [item 28.6]
  = Direct Cost × 4–6%
  Covers: office, accounting, pre-sales, corporate costs

LEVEL 4: SUBTOTAL (Costo Total sin beneficio)
  = Direct Cost + Direct OH + Indirect OH

LEVEL 5: CONTRACTOR PROFIT (Beneficio / Utilidad)  [item 28.7]
  = Subtotal × 10–15%

LEVEL 6: FINANCING COST (Costo Financiero)  [item 28.9]
  = Subtotal × financing_rate (depends on construction period)

LEVEL 7: TAXES (Impuestos — IIBB + otros)  [item 28.8]
  = (Subtotal + Profit + Financing) × iibb_rate
  IIBB typical AMBA: 3–4% for construction activity

LEVEL 8: PRICE BEFORE VAT (Precio de venta sin IVA)
  = Subtotal + Profit + Financing + Taxes

LEVEL 9: VAT (IVA)  [item 28.10]
  = Price_before_VAT × 21%

LEVEL 10: FINAL PRICE (Precio Final)
  = Price_before_VAT + IVA

PRICE PER M²
  = Final Price ÷ m2_total

REFERENCE RANGE (GCBA, Nov 2025):
  Vivienda 2 plantas: ~$1,109,580 ARS/m²
  Edificios: ~$1,280,439 ARS/m²
```

### Default Rates for MVP

| Parameter | Default | Range | Source |
|-----------|---------|-------|--------|
| GG Directos | 10% | 8–12% | Industry standard |
| GG Indirectos | 5% | 4–6% | Industry standard |
| Beneficio | 12% | 10–15% | Industry standard |
| IIBB AMBA | 3.5% | 3–4% | Tax code AMBA |
| Costo financiero | 2% | 1–5% | BCRA reference |
| IVA | 21% | Fixed | Argentine tax law |

---

## 6. Price Update Formula

### Primary Update (Monthly, Index-Based)

```
Current_Price = Base_Price × (ICC_current_chapter / ICC_base_chapter)
```

Where:
- `Base_Price` = AyC Revista price at date of data entry
- `ICC_current_chapter` = current month's INDEC ICC index for the relevant chapter
- `ICC_base_chapter` = ICC index value for the month when base price was recorded

**INDEC ICC Chapters mapped to our categories:**

| INDEC ICC Chapter | Our Categories |
|------------------|----------------|
| Materiales para estructura | Cat 4 (structure) |
| Materiales para mampostería | Cat 5, 9 |
| Materiales para revoques | Cat 8 |
| Materiales para pintura | Cat 22 |
| Materiales para instalaciones sanitarias | Cat 18, 19 |
| Materiales para instalación eléctrica | Cat 17 |
| Mano de obra | All MO components |
| Gastos generales | Cat 28 |

### Secondary Update (Material Spot-Check)

```
Current_Material_Price = Last_Known_Price × (MELI_current / MELI_last_known)
```

Used for key raw materials: cement, bricks, iron rod, sand, lime. Tracked via MercadoLibre API.

### UOCRA Labor Update (Bimonthly)

```
Current_Labor_Rate = UOCRA_basic_hourly × 2.20  (includes 120% cargas sociales)
```

Current rates (Feb/Mar 2026, Zona A):
- Oficial Especializado: $5,470 basic → $12,034/hr effective
- Oficial: $4,679 basic → $10,294/hr effective
- Medio Oficial: $4,324 basic → $9,513/hr effective
- Ayudante: $3,980 basic → $8,756/hr effective

Updated bimonthly after each UOCRA paritaria negotiation.

---

## 7. Data Source Action Items

### UOCRA — Official Labor Wage Scales

**What:** Hourly rates for all worker categories (Oficial Especializado, Oficial, Medio Oficial, Ayudante) + zone supplements + effective rate after 120% cargas sociales.

**Action:** Monitor https://www.construar.com.ar (publishes tables immediately after each bimonthly paritaria) and https://jorgevega.com.ar/laboral/. Alternatively scrape UOCRA.org.

**Frequency:** Every 2 months (Jan, Mar, May, Jul, Sep, Nov)

**Format:** Published as PDF tables in press releases; third-party sites republish as HTML tables.

**MVP approach:** Hardcode March 2026 rates; build admin panel field for manual update.

---

### INDEC ICC — Monthly Construction Cost Index

**What:** Index values (not absolute prices) by construction chapter (structure, masonry, plaster, paint, plumbing/fire, gas, electrical, elevators, glazing). Used as a deflator to keep hardcoded base prices current.

**Endpoints:**
- Monthly CSV: https://datos.gob.ar/ro/dataset/sspm-indice-costo-construccion-icc
- Monthly PDF press release: https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33
- FTP XLS: https://www.indec.gob.ar/ftp/cuadros/ingles/eng_ICC-capitulos-ud.xls

**Action:** Set up a monthly cron job to fetch the CSV from datos.gob.ar, parse the chapter columns, and store as `indice_actualizacion` records. Alternatively: manual admin update monthly.

**Frequency:** Published around the 15th of each month.

**MVP approach:** Download and hardcode the Feb 2026 ICC chapter values as the baseline alongside AyC prices.

---

### MercadoLibre API — Construction Material Retail Prices

**What:** Real-time retail prices for any searchable construction material. Best for: cement, bricks, iron rod, sand, lime, plaster, pipes (PP), cables, tiles, fixtures, appliances.

**Key limitation:** Retail prices (10–30% above wholesale/corralon). Use as relative price signal, not absolute.

**Endpoints:**
```
GET https://api.mercadolibre.com/sites/MLA/search?q={query}&category=MLA1500
GET https://api.mercadolibre.com/categories/MLA1500
```
- Auth: OAuth 2.0 Bearer token (free developer registration at developers.mercadolibre.com.ar)
- Category: MLA1500 ("Herramientas y Construccion")

**Key search queries to automate:**
| Material | Query String |
|----------|-------------|
| Cement 50kg | `bolsa cemento 50kg` |
| Common bricks (1000u) | `ladrillo comun 1000` |
| Fine sand 30kg | `arena fina bolsa 30kg` |
| Lime 30kg | `cal hidratada 30kg` |
| Iron rod 8mm | `hierro barra 8mm` |
| PP pipe 25mm | `caño pp termofusion 25mm` |
| Durlock panel | `placa yeso durlock 9.5mm` |
| Ceramic tile 20×20 | `ceramica 20x20 piso` |
| Porcelain tile 60×60 | `porcellanato 60x60` |

**Action:** Register app on MercadoLibre developer portal. Build a daily scraper that takes the median price of the top 10 listings for each query. Store and compare to baseline.

**MVP approach:** Manual lookup + hardcode current prices. Build API integration post-MVP.

---

### AyC Revista — Best Source for Unit Price Analyses

**What:** ~130 unit price analyses across 20 construction categories, each with materials cost (with IVA + IIBB) + labor cost (with 120% cargas sociales) + total. Updated monthly on the 15th.

**URL:** https://aycrevista.com.ar/precios-la-construccion/

**Action: SUBSCRIBE IMMEDIATELY.** Cost: ~$7,000 ARS/year (~US$7). This is the single most important data action for the entire project.

**After subscribing:**
1. Download current month's price table (March 2026)
2. Map each of their ~130 items to our item codes in Section 1 above
3. Enter `precio_mat_base`, `precio_mo_base`, `fecha_precio` into the items table
4. Record the ICC chapter values for that same month as the `precio_base_icc` reference point

**Categories they cover that map directly to ours:**
- Demolicion → 1.05
- Movimiento de tierra → Cat 1, 3
- Fundaciones → 4.1.1–4.1.2
- Aislaciones → Cat 6
- Mamposteria y tabiques → Cat 5
- Estructura → Cat 4 (partial)
- Revoques → Cat 8
- Revestimientos → Cat 11
- Pisos → Cat 10
- Zocalos → 10.2.x
- Cubiertas → Cat 7
- Membranas → 7.1.5, 7.1.1
- Carpinteria de madera → Cat 14, 15
- Herreria/Aluminio → Cat 13, 15.6–15.7
- Pintura → Cat 22
- Vidrios y espejos → 13.1.6, 15.7, 16.2.2
- Instalacion electrica → Cat 17 (partial)
- Sistemas constructivos → 6.3.2, 8.1.3

**Gap items not in AyC** (require manual research or MercadoLibre):
- Steel frame / wood frame items (4.3.x, 4.4.x, 5.5.x)
- HVAC/AC systems (Cat 20)
- Energy items (Cat 21)
- Exterior landscaping (Cat 23)
- Kitchen/bathroom furniture (Cat 16, except mirrors)
- OHS and environmental programs (Cat 25, 26)
- Special equipment (Cat 27)
- Gas appliances (19.3.x) — use MercadoLibre
- Sanitary fixtures/fittings (18.6.x) — use MercadoLibre

---

### Manual Research Required

These items have no reliable automated source and need one-time research:

| Item(s) | Research Task |
|---------|--------------|
| 23.6, 23.7 Swimming pools | Get 2–3 quotes from pool contractors; establish $/m² or lump sum by dimension |
| 27.1 Elevator | Contact ThyssenKrupp / Otis Argentina for indicative pricing |
| 20.1.1 Radiant floor | Get contractor quote; calculate $/m² all-in |
| 19.1.1 MetroGAS connection | Check MetroGAS published tariff tables for connection fees |
| 18.1.1 AYSA water connection | Check AYSA published connection fee schedule |
| 28.1–28.2 Professional fees | Use CPAU fee scale: https://www.cpau.org |
| 28.3 Municipal permits | DGROC CABA: fee = m² × municipal_value_unit (consult DGROC table) |
| 25.1–25.3 OHS program | Get quote from a registered SH professional; typically 0.5–1% of obra |
| 26.x Environmental program | Typically bundled with OHS; get quote |

---

### CYPE Generador de Precios — Structural Reference

**What:** Not used for absolute prices (may lag Argentine inflation). Used to validate the materials/labor split ratio for each item type. Useful for sanity-checking our AyC-derived prices.

**URL:** https://argentina.generadordeprecios.info/

**Action:** For each major item category, compare CYPE's materials-to-labor ratio against our AyC data. Flag any items where our ratio differs by >20% as needing review.

---

### Cifras Online — Free Supplementary Check

**URL:** https://www.cifrasonline.com.ar/costos/

**What:** Free Google Sheets with "Costos por Rubro" and "Costos M2" — useful as a sanity check.

**Action:** Download once, use as cross-validation for Express mode price/m² ranges. Not a primary source.

---

## 8. Data Schema Summary

Minimum data tables required by the app:

```
items
  id_item         PK
  id_rubro        FK → rubros
  codigo          e.g. "4.2.1"
  descripcion_es  Spanish description
  descripcion_en  English description
  unidad          m², m³, ml, un, gl, %
  precio_mat      ARS (materials unit cost, incl. IVA+IIBB)
  precio_mo       ARS (labor unit cost, incl. 120% cargas sociales)
  precio_total    ARS (precio_mat + precio_mo)
  incidencia_pct  % of total (from FERES/AyC reference)
  fecha_precio    Date of price reference
  icc_base        ICC chapter index value at fecha_precio
  fuente          "AyC" | "MercadoLibre" | "UOCRA" | "Manual"
  activo          boolean (default true; exclusion logic sets to false)

rubros
  id_rubro        PK
  numero          e.g. 4
  nombre_es       e.g. "Estructura Resistente"
  nombre_en       e.g. "Structural System"

coeficientes
  id_item         FK → items
  formula         text description of quantity formula
  coef_m2         numeric coefficient applied to m2_total (when applicable)
  condicion       activation condition (JSON or expression)

indice_actualizacion
  fecha           date
  capitulo_icc    e.g. "Estructura"
  valor_icc       current index value
  valor_cac       CAC index value (optional)
  fuente          "INDEC" | "CAC"

proyectos
  id_proyecto     PK
  m2_total        numeric
  n_plantas       integer
  respuestas      JSON (56-question answers)
  modo            "express" | "detallado" | "profesional"
  total_directo   ARS
  total_final     ARS
  precio_m2       ARS
  fecha_calculo   timestamp
  indice_fecha    FK → indice_actualizacion (index used at calculation time)
```

---

*Sources: cotizador.xlsx (PyOO TPG2024 + FERES UT2 reference data) + PRICING-SOURCES.md research (2026-03-20)*
