# Nelo — AI Construction Cost Estimator

## What This Is

An AI-powered chatbot that helps consumers and architects/engineers estimate construction costs in Buenos Aires (AMBA region). Users describe their project through conversation and upload floor plans. The app collects structured data progressively, analyzes uploaded plans with vision AI, and outputs a detailed cost breakdown with price per square meter and total construction price based on a 21-category Argentine construction budget (presupuesto de obra).

## Core Value

Accurate, transparent construction cost estimation through natural conversation — the user gets a detailed price breakdown they can trust, without needing to know construction terminology or fill out complex forms.

## Requirements

### Validated

- [x] AI chatbot collects project details through natural conversation — *Phase 4*
- [x] Three user modes: Express (5-8 key questions), Detailed, Professional (floor plan) — *Phases 4, 6*
- [x] Floor plan upload and AI vision analysis — *Phase 6*
- [x] User confirmation/correction flow after floor plan analysis — *Phase 6*
- [x] Structured data collection via AI SDK tools with Zod validation — *Phase 4*
- [x] Calculation engine based on 26-category Argentine construction budget (~130+ line items) — *Phases 2, 8*
- [x] Coefficient-based quantity derivation with smart defaults — *Phases 2, 8*
- [x] Conditional logic / exclusion tree (steel frame disables concrete, etc.) — *Phase 2*
- [x] Price per square meter output (ARS + USD via blue rate) — *Phases 2, 8*
- [x] Total construction price with full cost structure (direct + overhead 10% + profit 12% + IVA 21%) — *Phase 2*
- [x] Detailed category-by-category cost breakdown with incidence percentages — *Phase 5*
- [x] Confidence level indicator (quick/standard/detailed) — *Phase 2*
- [x] Composition-formula pricing with ICC per-item adjustment (replaces FERES reference) — *Phase 8*
- [x] Dynamic system prompt built from configurable categories — *Phase 1*
- [x] Bilingual UI (English default, Spanish toggle, browser auto-detect) — *Phase 7*
- [x] Real pricing from UOCRA labor + MercadoLibre materials + DolarAPI blue rate — *Phase 8*
- [x] Manual override system for architect price corrections — *Phase 8*
- [x] Daily cron refresh for dynamic data sources — *Phase 8*

### Active

(None — all requirements delivered in milestone v1.0)

### Out of Scope

- Real-time per-request pricing APIs — daily cache is sufficient for MVP
- CAD file parsing (DXF/DWG) — vision-only approach validated
- Multiple regions beyond AMBA — single-region MVP
- User accounts and persistence — in-memory per session
- PDF export — nice-to-have for future milestone
- 3D visualization — not needed for cost estimation

## Context

### Team & Timeline
- 4 developers, ~24 hours (hackathon)
- All comfortable with TypeScript/React
- Building from scratch (greenfield)

### Market
- MVP: AMBA (Area Metropolitana de Buenos Aires), Argentina
- Expansion path: Argentina → Latin America → Global
- Pricing data varies by region; AMBA chosen for single-source simplicity

### Construction Budget Structure
The team provided a detailed 21-category Argentine presupuesto de obra with ~80 line items covering:
1. Trabajos Preliminares (site prep)
2. Movimiento de Tierra (earthwork)
3. Estructura de H.A. (reinforced concrete structure)
4. Albañileria (masonry)
5. Aislaciones (insulation/waterproofing)
6. Revoques (plaster/render)
7. Contrapisos y Carpetas (screeds)
8. Pisos (floors)
9. Cielorrasos (ceilings)
10. Zocalos (baseboards)
11. Revestimientos (wall cladding)
12. Pintura (paint)
13. Carpinterias (doors + windows with specific sizes)
14. Amoblamientos (furniture/cabinetry)
15. Instalacion Electrica (electrical)
16. Instalacion Sanitaria (plumbing + fixtures)
17. Instalacion de Gas (gas)
18. Ahorro Energetico (energy saving)
19. Varios (miscellaneous)
20. Seguridad e Higiene (safety)
21. Plan de Gestion Ambiental (environmental)

Units: m2, m3, ml (linear meter), GL (global/lump sum), U (unit count)

### Floor Plan AI Limitations
Research shows general LLMs achieve ~12% accuracy on precise construction measurements. Our approach: LLM vision extracts approximate data (room count, rough area, door/window counts), user confirms/corrects. This turns the accuracy limitation into a UX feature.

### Competitive Landscape
- Handoff AI (YC-backed): conversational estimator, 68M cost data points, US market
- Professional tools: RSMeans, ProEst, PlanSwift — enterprise-priced, not consumer-friendly
- No significant AI-first construction estimator for the Argentine/LatAm market

### Key Quantity Derivation
The entire budget can be computed from ~14 base measurements:
- Total floor area (m2), building footprint (m2), perimeter (ml)
- Wall area (calculated: perimeter x ceiling height x stories)
- Roof/azotea area (~footprint), number of stories, ceiling height
- Door count + types, window count + types
- Bathroom count, kitchen count
- Has azotea?, has gas?, energy saving options

Floor plans can auto-extract ~60-70% of these quantities.

## Constraints

- **Timeline**: ~24 hours hackathon — must prioritize ruthlessly
- **Tech stack**: Next.js App Router on Vercel, AI SDK v6, Claude via AI Gateway
- **Pricing data**: Hardcoded reference table for AMBA (team is still defining exact values)
- **Categories table**: Team is finalizing the options/criteria for each category (will be plugged in)
- **Floor plan accuracy**: Limited to LLM vision capabilities (~approximate, not pixel-perfect)
- **Language**: App should work in Spanish (primary) and English; all docs in English

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js monolith (no separate backend) | Fastest to build for hackathon, TypeScript sufficient for calculation engine | Validated |
| AI SDK tools for data collection | Zod schemas enforce structure, LLM decides conversation flow | Validated |
| OpenRouter instead of AI Gateway | Team chose for model flexibility | Validated |
| UniFormat-inspired 26 categories | Maps to how users think about buildings (systems, not products) | Validated |
| Vision-only floor plan analysis | CAD parsing too complex; vision + user confirmation is good UX | Validated |
| Composition-formula pricing | Replaced hardcoded AMBA pricing with (labor × UOCRA) + (materials × ML) | Validated — Phase 8 |
| Assembly-based costing model | Projects decompose into categories → line items → unit costs | Validated |
| USD/m² via blue rate | Standard Argentine construction quoting practice | Validated — Phase 8 |
| Bilingual EN/ES with English default | Browser auto-detect + manual toggle + localStorage persistence | Validated — Phase 7 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after milestone v1.0 completion (all 8 phases delivered)*
