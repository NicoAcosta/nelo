# Argentine Construction Pricing Sources - Research Report

**Date:** 2026-03-20
**Region focus:** Buenos Aires / AMBA
**Goal:** Find reliable sources for ~130 construction line item unit prices

---

## Executive Summary

There is **no single free API** that provides complete unit pricing for Argentine construction. However, a robust pricing system can be assembled from multiple sources:

| Source | Data Type | Access | Reliability |
|--------|-----------|--------|-------------|
| INDEC ICC | Index variations by chapter (not absolute prices) | Free CSV/XLS | Very High |
| CAC Indicadores | Index variations, cost per m2 | Free (partial) | Very High |
| UOCRA Escalas | Labor hourly rates by category/zone | Free (public) | Very High (official) |
| AyC Revista | ~130 unit price analyses (materials + labor) | Paid ($700/month) | High |
| Metro Obra | Labor prices by task, cost per m2 | Paid (subscription) | High |
| CYPE Generador de Precios | Full unit price breakdowns, 17+ chapters | Free (partial, registration) | High |
| Cifras Online | Cost per m2, costs by rubro | Free (Google Sheets) | Medium-High |
| Mi Obra / La Nacion | ~10 key material retail prices | Free (web) | Medium |
| MercadoLibre API | Retail material prices (any item) | Free API (auth required) | Medium (retail, not wholesale) |
| Nuqlea | Real-time material prices from suppliers | Free platform | Medium-High |
| GCBA Estadistica | ICCBA index, cost per m2 by housing type | Free | High |
| Home Solution | Labor-only reference prices (~7 items) | Free | Low-Medium |

---

## 1. Public Government Sources

### 1.1 INDEC - ICC (Indice del Costo de la Construccion)

**URL:** https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33

**What it provides:**
- Monthly index (base 1993=100) showing % variation, NOT absolute prices
- Three main components: Materials, Labor, General Expenses
- Sub-chapters tracked: Structure, Masonry, Plaster, Painting, Plumbing/Fire, Gas, Electrical, Elevators, Glazing
- The monthly press release (PDF) includes "Cuadro 3: Principales variaciones mensuales por grupo de materiales" which shows % changes for individual material groups

**What it does NOT provide:**
- Individual material prices in pesos
- Absolute cost figures per unit of work
- Line-item breakdowns

**Data format & access:**
- Monthly PDF press releases: https://www.indec.gob.ar/uploads/informesdeprensa/icc_03_262C783ED834.pdf
- Downloadable XLS on FTP: https://www.indec.gob.ar/ftp/cuadros/ingles/eng_ICC-capitulos-ud.xls
- Open Data CSV (datos.gob.ar): https://datos.gob.ar/ro/dataset/sspm-indice-costo-construccion-icc
  - Three CSV files: annual, quarterly, monthly values
  - License: Creative Commons 4.0
  - Maintained by Subsecretaria de Programacion Macroeconomica

**Update frequency:** Monthly (around 15th of each month)
**Reliability:** VERY HIGH - Official national statistics
**Cost:** Free
**API:** No dedicated API, but CSV files downloadable programmatically

**Usefulness for our project:** Limited directly (indices, not prices), but essential for adjusting/updating prices over time. Can be used to inflate historical prices to current values.

---

### 1.2 CAC - Camara Argentina de la Construccion

**URL:** https://www.camarco.org.ar/indicadores/indicadores-de-costos/

**What it provides:**
- "Indicador CAC" - monthly cost index for a reference building in CABA
- Series of average prices for architectural construction inputs (materials)
- Cost per m2 estimates
- Breakdown into: Materials, Labor, Total

**Methodology:** Published at https://camarco.org.ar/wp-content/uploads/2020/11/METODOLOGIA-INDICADOR-CAC-base-100-Dic-2014.pdf

**Data format:** Website with data series. No public API discovered.
**Update frequency:** Monthly
**Reliability:** VERY HIGH - Industry chamber, referenced by banks and government
**Cost:** Free access to indicators on website
**Note:** SSL certificate issues may complicate scraping (certificate verification error encountered)

---

### 1.3 GCBA - Instituto de Estadistica y Censos de la Ciudad de Buenos Aires

**URL:** https://www.estadisticaciudad.gob.ar/eyc/?cat=6993

**What it provides:**
- ICCBA (Indice del Costo de la Construccion de Buenos Aires) - city-level index
- **Cost per m2 by housing model type:**
  - Vivienda FONAVI: ~$1,149,935/m2 (Nov 2025)
  - Vivienda 2 plantas: ~$1,109,580/m2 (Nov 2025)
  - Edificios: ~$1,280,439/m2 (Nov 2025)
- Published as a "Sistema de Indices de Precios de la Construccion" report

**Data format:** PDF reports, some downloadable tables
**Update frequency:** Monthly
**Reliability:** HIGH - Official city government statistics
**Cost:** Free

---

### 1.4 CPAU - Consejo Profesional de Arquitectura y Urbanismo

**URL:** https://www.cpau.org/servicios/biblioteca/servicios-y-productos/indices-y-costos-de-la-construccion

**What it provides:**
- Monthly "Seleccion Informativa - Indices y Costos de la Construccion" (PDF)
- Compilation document that aggregates data from INDEC, CAC, GCBA, and other sources
- February 2026 edition: https://static.cpau.org/.newsite/servicios/biblioteca/dsi/2026/%C3%ADndices/2.IC-Feb_2026.pdf

**Data format:** PDF (compiled reference document)
**Update frequency:** Monthly
**Reliability:** HIGH - Professional council compilation
**Cost:** Free
**Usefulness:** Good as a single-document reference combining multiple indices, but does not add new primary price data

---

### 1.5 IERIC - Instituto de Estadistica y Registro de la Industria de la Construccion

**URL:** https://www.ieric.org.ar/series_estadisticas/series-estadisticas-nacionales/

**What it provides:**
- Employment data, not pricing
- ISAC (construction activity indicator)
- Registered jobs, salary averages
- Permitted m2 data
- References ICC data from INDEC
- Cement/asphalt dispatch volumes

**Data format:** XLS/XLSX downloadable files
**Update frequency:** Monthly
**Reliability:** HIGH
**Cost:** Free
**Usefulness for pricing:** LOW - focuses on industry metrics, not unit prices

---

## 2. Construction Cost Publications & Databases

### 2.1 AyC Revista (Arquitectura y Construccion) -- BEST SOURCE FOR UNIT PRICES

**URL:** https://aycrevista.com.ar/precios-la-construccion/

**What it provides:**
- **~130 unit price analyses** across 20 construction categories:
  1. Demolicion (2 items)
  2. Movimiento de tierra (5 items)
  3. Fundaciones (2 items)
  4. Aislaciones (3 items)
  5. Mamposteria y tabiques (18 items)
  6. Estructura (11 items)
  7. Revoques (9 items)
  8. Revestimientos (9 items)
  9. Pisos (15 items)
  10. Zocalos (5 items)
  11. Umbrales y dinteles (2 items)
  12. Cubiertas (10 items)
  13. Membranas (2 items)
  14. Carpinteria de madera (5 items)
  15. Herreria/Aluminio (10 items)
  16. Colocacion de marcos (2 items)
  17. Pintura (13 items)
  18. Vidrios y espejos (3 items)
  19. Instalacion electrica (1 item)
  20. Sistemas constructivos (1 item)

- Each item includes: **materials cost (with IVA + IIBB)**, **labor cost (with 120% cargas sociales)**, **total**
- Prices are for a reference 100m2 residential property
- Also provides: cost per m2, labor cost for a complete house, material price list

**Data format:** Web (behind paywall), downloadable with subscription
**Update frequency:** Monthly (prices updated on 15th of each month)
**Reliability:** HIGH - 44 years of publication, used by architecture faculties
**Cost:** PAID
  - 1 month: ~$700 ARS
  - 3 months: $2,100 ARS
  - 6 months: $3,500 ARS
  - 12 months: $7,000 ARS
  - (Very affordable - less than US$7/year at current rates)

**CRITICAL NOTE:** Free pages on their site show OLD prices (several months delayed). Current prices require subscription.

**Recommendation:** SUBSCRIBE. This is the single best source for our ~130 line items. Extremely affordable.

---

### 2.2 CYPE Generador de Precios Argentina

**URL:** https://argentina.generadordeprecios.info/

**What it provides:**
Full unit price generator with 17+ chapters for new construction:

| Code | Chapter |
|------|---------|
| 0 | Trabajos preparatorios (Preparatory work) |
| D | Demoliciones (Demolitions) |
| A | Acondicionamiento del terreno (Site conditioning) |
| C | Fundaciones (Foundations) |
| E | Estructuras (Structures) |
| F | Fachadas y tabiques (Facades and partitions) |
| L | Carpinteria, placares, herreria, vidrios (Carpentry, ironwork, glass) |
| H | Remates y ayudas (Finishes and aids) |
| I | Instalaciones (Installations) |
| N | Aislamientos e impermeabilizaciones (Insulation, waterproofing) |
| Q | Techos (Roofing) |
| R | Revestimientos (Coatings/cladding) |
| S | Senalizacion y equipamiento (Signage, equipment) |
| U | Urbanizacion interior del lote (Site urbanization) |
| G | Gestion de residuos (Waste management) |
| X | Control de calidad (Quality control) |
| Y | Seguridad y salud (Safety) |

Also covers: Rehabilitacion (renovation) and Espacios urbanos (urban spaces)

- Each work unit is parametric (user selects dimensions, materials, etc.)
- Breakdown: materials, labor, equipment
- Adapted for Argentine products and practices

**Data format:** Web application (interactive, not easily scrapeable)
**Update frequency:** Periodic (not monthly)
**Reliability:** HIGH - CYPE is a major international construction software company
**Cost:** Partially free (basic access), full access via registration / software license
**Integration:** Can export to CYPE Arquimedes software (BC3 format)

**Usefulness:** Excellent for detailed parametric pricing. However, prices may lag behind Argentine inflation. Best used as a structural reference for price composition (% materials vs labor) rather than absolute current prices.

---

### 2.3 Metro Obra (Revista de la Construccion)

**URL:** https://www.metroobra.com/

**What it provides:**
- Monthly labor prices by construction task (masonry, painting, installations, dry construction)
- UOCRA wage data with social charges calculations
- Cost per m2 for various regions (Cordoba, Santa Fe, Rosario, Buenos Aires)
- CAC index, INDEC index, road works indices
- Reference material prices

**Data format:** Digital magazine (PDF), web articles
**Update frequency:** Monthly
**Reliability:** HIGH - Established construction magazine
**Cost:** PAID subscription
  - 3 months: available from March 2026
  - 6 months and annual options available
  - Pricing not found publicly

---

### 2.4 Cifras Online

**URL:** https://www.cifrasonline.com.ar/costos/

**What it provides:**
Three downloadable reports:
1. **Informe general** (general cost report)
2. **Costos M2** (cost per square meter)
3. **Costos por Rubro** (costs by construction category/rubro)

**Data format:** Google Sheets/Drive documents (linked from the page)
**Update frequency:** Not specified
**Reliability:** MEDIUM-HIGH
**Cost:** Appears FREE (no login required on the costs page)

**Note:** The actual data is in linked Google Sheets, which could be accessed programmatically via Google Sheets API if the sheets are public.

---

### 2.5 Revista Vivienda

**URL:** https://revistavivienda.com.ar/

**What it provides:**
- Periodically publishes cost-per-m2 articles
- Decomposes costs by: materials, labor, general expenses
- Tracks interannual variations by component

**Data format:** Editorial articles
**Update frequency:** Periodic (not systematic monthly)
**Reliability:** MEDIUM
**Cost:** Free articles, magazine subscription for full content
**Usefulness:** Low for systematic data extraction, good for general market context

---

## 3. Online Price Sources (Scrapeable)

### 3.1 MercadoLibre API -- BEST FOR MATERIAL RETAIL PRICES

**URL:** https://developers.mercadolibre.com.ar/

**What it provides:**
- Real-time retail prices for ANY construction material
- Category ID for construction: **MLA1500** ("Herramientas y Construccion")
- Product search, filtering, pricing data

**API endpoints:**
```
GET https://api.mercadolibre.com/sites/MLA/search?q={query}
GET https://api.mercadolibre.com/sites/MLA/categories  (all categories)
GET https://api.mercadolibre.com/categories/MLA1500      (construction category)
```

**Authentication:** Bearer token required (OAuth 2.0, free registration)
**Data format:** JSON REST API
**Rate limits:** Standard MELI API limits apply
**Reliability:** MEDIUM - Retail prices (higher than wholesale/corralon), but good for relative comparisons
**Cost:** FREE (with developer registration)

**Key limitation:** Prices are retail (MercadoLibre marketplace), typically 10-30% higher than corralon/wholesale. Mix of sellers with varying prices.

**Recommendation:** Good for automated price tracking of key materials. Use median/minimum prices. Combine with corralon data for calibration.

---

### 3.2 Mi Obra Portal

**URL:** https://www.miobra.com.ar/precios-materiales

**What it provides:**
- ~10 key construction material prices updated every 12 hours
- Current sample prices (March 2026):
  - Cement bag 50kg: $6,900
  - Fine sand bag 30kg: $5,999
  - 1000 common bricks: $15,243
  - Lime bag 30kg: $30,000
  - Crushed stone per m3: $129,999
  - Sand per m3: $47,199
  - Iron rod 8mm x 12m: $11,200
  - Durlock panel 9.5mm: $16,751
  - Cement block 13x19x39: $2,098.95
  - Hollow load-bearing brick: $156,750

- Also provides: UOCRA labor costs, CAC index, cost per m2

**Data format:** Web page (HTML, scrapeable)
**Update frequency:** Every 12 hours (claimed)
**Reliability:** MEDIUM - Source methodology unclear, but cross-referenced with La Nacion
**Cost:** FREE

---

### 3.3 La Nacion - Monthly Construction Price Table

**URL:** https://www.lanacion.com.ar/propiedades/construccion-y-diseno/ (monthly articles)

**What it provides:**
Monthly article with ~10 key material prices with ranges, sourced from Mi Obra and MercadoLibre. March 2026 example:

| Material | Unit | Price Range (ARS) |
|----------|------|-------------------|
| Cement bag | 50 kg | $9,000 - $15,000 |
| Fine sand bag | 30 kg | $6,000 - $12,500 |
| Common bricks | 1,000 units | $185,000 - $260,000 |
| Lime bag | 30 kg | $7,800 - $9,000 |
| Crushed stone | m3 | from $130,000 |
| Sand | m3 | $47,200 |
| Iron rod 8mm x 12m | unit | $9,000 - $12,000 |
| Durlock panel | unit | $17,000 - $20,000 |
| Cement block | unit | $1,300 - $2,900 |

**Data format:** Web article (HTML)
**Update frequency:** Monthly
**Reliability:** MEDIUM - Journalistic, but good general reference
**Cost:** Free (with La Nacion free article limit)

---

### 3.4 Easy.com.ar / Sodimac.com.ar

**URLs:** https://www.easy.com.ar/ / https://www.sodimac.com.ar/

**What they provide:**
- Full retail catalogs of construction materials with prices
- Sodimac: https://www.sodimac.com.ar/sodimac-ar/category/cat30038/materiales-de-construccion/

**Data format:** E-commerce websites (HTML, JavaScript-rendered)
**API:** No public API. Would require web scraping (Playwright/Puppeteer recommended for dynamic content)
**Update frequency:** Real-time (retail prices)
**Reliability:** MEDIUM - Retail big-box prices (premium over corralon)
**Cost:** Free to browse, scraping requires infrastructure

---

### 3.5 Nuqlea

**URL:** https://www.nuqlea.com/

**What it provides:**
- Digital marketplace connecting construction material buyers with suppliers
- Real-time prices from actual suppliers (closer to wholesale)
- Material calculator for quantity estimation
- "Acopio digital" - price locking for up to 3 years

**Data format:** Web platform (requires registration)
**API:** No public API discovered
**Update frequency:** Real-time
**Reliability:** MEDIUM-HIGH (actual supplier prices)
**Cost:** Free to use platform

---

## 4. APIs and Structured Data

### 4.1 datos.gob.ar - ICC Open Data

**URL:** https://datos.gob.ar/ro/dataset/sspm-indice-costo-construccion-icc

**Endpoints:**
- Annual CSV: direct download
- Quarterly CSV: direct download
- Monthly CSV: direct download

**Format:** CSV, Creative Commons 4.0 license
**Content:** ICC index values (not absolute prices), base 1993
**API:** No REST API, but CSV files can be fetched programmatically

---

### 4.2 MercadoLibre API (detailed above in section 3.1)

Best available API for material prices in Argentina.

---

### 4.3 BCRA API (Banco Central)

**URL:** https://www.bcra.gob.ar/en/central-bank-api-catalog/

**Usefulness:** Exchange rates (USD/ARS) for dollarized price tracking. Not construction-specific.

---

### 4.4 No dedicated Argentine construction pricing API exists

After extensive research, there is no equivalent to US services like RSMeans or UK BCIS for Argentina in API form. The closest structured data sources are:
- CYPE Generador de Precios (interactive web tool)
- AyC Revista (subscription PDF/spreadsheet)
- MercadoLibre API (raw material retail prices)

---

## 5. Labor Cost Sources

### 5.1 UOCRA - Official Wage Scales (CCT 76/75)

**URL:** https://www.uocra.org/ (official union site)
**Scale tables published at:** Multiple news sites (construar.com.ar, lanacion.com.ar, etc.)

**Current rates (February/March 2026 - Zona A / Buenos Aires):**

| Category | Hourly Basic | Zone Supplement | Total/Hour |
|----------|-------------|-----------------|------------|
| Oficial Especializado | $5,470 | $602 | $6,071 |
| Oficial | $4,679 | $518 | $5,196 |
| Medio Oficial | $4,324 | $469 | $4,793 |
| Ayudante | $3,980 | $458 | $4,438 |
| Sereno (monthly) | $723,032 | $82,457 | $805,489 |

**Zones:**
- Zona A: CABA, Buenos Aires, Santa Fe, Cordoba, Mendoza, etc. (most provinces)
- Zona B: Neuquen, Rio Negro, Chubut
- Zona C: Santa Cruz
- Zona Austral: Tierra del Fuego

**Social charges ("cargas sociales"):**
Standard calculation uses **120% surcharge** on basic wages to account for:
- Employer contributions (jubilacion, obra social, ART, etc.)
- Vacations, aguinaldo, holidays, sick days
- IERIC fund, UOCRA contributions

Effective cost = Basic wage x 2.2 (approximately)

**How rates are structured:**
- Negotiated bimonthly in paritarias (collective bargaining)
- January 2026: +2% over December 2025 basics
- February 2026: +1.8% over January basics
- March 2026: No additional increase (negotiations ongoing)

**Data format:** Published in PDFs and press releases
**Update frequency:** Bimonthly (paritarias)
**Reliability:** VERY HIGH - Official collective bargaining agreement
**Cost:** Free (public information)

---

## 6. Software Platforms with Price Databases

### 6.1 Quercusoft

**URL:** https://quercusoft.com/
- Thousands of free, editable unit price analyses
- Covers Argentina and other LATAM countries
- XLSX export capability
- No API
- Good for structural reference (composition of items)

### 6.2 Budquo (AI-powered)

**URL:** https://budquo.app/es
- AI-assisted budgeting
- Connects to "construction price databases"
- Can learn from historical budgets (needs 1,000+ items)
- Supports Excel/CSV/BC3 import

### 6.3 Dataobra

**URL:** https://www.dataobra.net
- Argentine desktop software for construction budgeting
- Multi-currency, Gantt charts, certifications
- No public price database or API

### 6.4 Foco en Obra

**URL:** https://focoenobra.com/
- Project management + cost estimation
- No public price data

### 6.5 Data Construccion (IMPORTANT - but likely Venezuela-focused)

**URL:** https://www.dataconstruccion.com
- Manual de Costos de Edificacion: 1,250+ items
- DataWork software: 4,350+ items
- Covers materials, labor, equipment, crew composition
- **NOTE:** Appears to be Venezuela/LATAM focused, NOT specifically Argentina. Verify before purchasing.

---

## 7. Professional Colleges (Provincial)

### 7.1 COPAIPA (Jujuy - Agrimensores, Ingenieros)

**URL:** https://copaipa.org.ar/costos-de-la-construccion/
- Publishes cost per m2 by construction type
- Downloadable XLS files: https://copaipa.org.ar/Descarga/costos_de_la_construccion/
- Data primarily from northern Argentina but useful as reference

### 7.2 Colegio de Arquitectos de Salta

**URL:** https://www.colarqsalta.org.ar/ejercicio-profesional/costo-de-la-construccion-6
- Computation tables for wet and dry construction
- Unit price analyses per item
- Monthly updated documents

### 7.3 CAPSF (Santa Fe)

**URL:** https://capsf.ar/computo-y-presupuesto/
- Construction cost computation resources

---

## 8. Home Solution (Labor-only reference)

**URL:** https://homesolution.net/ar/about/preciosreferencia/construccion-y-arquitectura

**Sample labor-only prices (no materials):**

| Task | Unit | Low | High |
|------|------|-----|------|
| Encadenado | ml | $14,124 | $20,733 |
| Pared durlock/drywall | m2 | $14,212 | $27,488 |
| Colocacion venecitas | m2 | $11,900 | $19,700 |
| Revoque completo | m2 | $9,920 | $19,700 |
| Carpeta y contrapiso | m2 | $9,672 | $18,763 |
| Microcemento alisado | m2 | $10,400 | $20,500 |
| Pared ladrillo hueco | ml | $8,500 | $12,000 |

Additional categories available: Albanil, Pintor, Plomero, Electricista, Techista, Carpintero, Tecnico de Aire

**Reliability:** LOW-MEDIUM - Survey-based, orientative only
**Cost:** Free

---

## 9. Recommended Strategy for Our Application

### Primary Data Pipeline

```
TIER 1 - Unit Price Analyses (materials + labor per item):
  AyC Revista subscription ($7,000 ARS/year) --> ~130 items, monthly

TIER 2 - Material Price Updates (key inputs):
  MercadoLibre API --> automated daily scraping of ~30 key materials
  Mi Obra scraping --> 10 key materials, every 12 hours

TIER 3 - Labor Rate Updates:
  UOCRA paritarias --> official hourly rates, bimonthly
  Apply 120% cargas sociales multiplier

TIER 4 - Index-based Adjustment:
  INDEC ICC monthly CSV --> adjust all prices by chapter variation
  datos.gob.ar --> programmatic download

TIER 5 - Structural Reference:
  CYPE Generador de Precios --> detailed item composition (% mat/labor)
  Quercusoft --> free editable unit price analyses
```

### Implementation Priority

1. **Immediately:** Subscribe to AyC Revista (~$7,000 ARS/year). Digitize their ~130 items as our baseline database.

2. **Week 1:** Set up MercadoLibre API integration for key material price tracking (cement, bricks, iron, sand, stone, lime, plaster, pipes, cables, etc.)

3. **Week 2:** Build INDEC ICC CSV ingestion to auto-adjust prices monthly by chapter.

4. **Week 3:** Build UOCRA wage scraper (construar.com.ar publishes tables promptly after each paritaria).

5. **Ongoing:** Cross-validate with CYPE Generador de Precios for item composition ratios.

### Price Update Formula

For any line item between AyC monthly publications:

```
Current_Price = Last_AyC_Price
  x (Current_ICC_Chapter_Index / AyC_Publication_ICC_Chapter_Index)
```

For materials specifically, can also use:
```
Current_Material_Price = Last_Known_Price
  x (Current_MELI_Price / Last_Known_MELI_Price)
```

---

## 10. What We Could NOT Find

- **FERES:** No specific publication or database found under this name for Argentine construction. May be confused with another reference or may be an internal industry term.
- **PyOO (Presupuesto y Organizacion de Obras):** Appears to be an academic course name at Argentine universities, not a published price reference.
- **Batimat / ExpoVivienda:** Trade shows, not price databases.
- **SistemasArquitectonicos.com.ar:** No significant pricing data found.
- **GCBA reference cost tables for permits:** GCBA uses the ICCBA index for fee calculations but does not publish a public construction cost table for permit valuation.
- **Free comprehensive API:** Does not exist for Argentine construction pricing.

---

## Sources Consulted

- https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33
- https://datos.gob.ar/ro/dataset/sspm-indice-costo-construccion-icc
- https://www.camarco.org.ar/indicadores/indicadores-de-costos/
- https://aycrevista.com.ar/precios-la-construccion/
- https://aycrevista.com.ar/precios-la-construccion/analisis-de-costos/
- https://argentina.generadordeprecios.info/
- https://www.cifrasonline.com.ar/costos/
- https://www.miobra.com.ar/precios-materiales
- https://www.miobra.com.ar/costo-mano-obra-uocra
- https://www.metroobra.com/
- https://www.uocra.org/
- https://www.construar.com.ar/2026/03/escala-uocra-marzo-2026-cuanto-cobra-por-hora-un-albanil-segun-zona-y-categoria/
- https://jorgevega.com.ar/laboral/384-uocra-escalas-2026-enero.html
- https://www.lanacion.com.ar/propiedades/construccion-y-diseno/asi-esta-la-tabla-de-precios-de-la-construccion-en-marzo-2026-nid10032026/
- https://homesolution.net/ar/about/preciosreferencia/construccion-y-arquitectura
- https://www.estadisticaciudad.gob.ar/eyc/?cat=6993
- https://www.cpau.org/servicios/biblioteca/servicios-y-productos/indices-y-costos-de-la-construccion
- https://www.ieric.org.ar/series_estadisticas/series-estadisticas-nacionales/
- https://copaipa.org.ar/costos-de-la-construccion/
- https://developers.mercadolibre.com.ar/
- https://www.nuqlea.com/
- https://quercusoft.com/
- https://budquo.app/es
- https://www.dataconstruccion.com/
- https://www.dataobra.net
