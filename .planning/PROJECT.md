# ArquiCost — AI Construction Cost Estimator

## What This Is

An AI-powered chatbot that helps consumers and architects/engineers estimate construction costs in Buenos Aires (AMBA region). Users describe their project through conversation and upload floor plans. The app collects structured data progressively, analyzes uploaded plans with vision AI, and outputs a detailed cost breakdown with price per square meter and total construction price based on a 21-category Argentine construction budget (presupuesto de obra).

## Core Value

Accurate, transparent construction cost estimation through natural conversation — the user gets a detailed price breakdown they can trust, without needing to know construction terminology or fill out complex forms.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] AI chatbot collects project details through natural conversation
- [ ] Two user modes: consumer (casual, ~8 questions) and professional (detailed, 15+ questions)
- [ ] Floor plan upload and AI vision analysis (approximate extraction of rooms, area, doors, windows)
- [ ] User confirmation/correction flow after floor plan analysis
- [ ] Structured data collection via AI SDK tools with Zod validation
- [ ] Calculation engine based on 21-category Argentine construction budget (~80 line items)
- [ ] Quantity derivation from ~14 base measurements (area, perimeter, stories, etc.)
- [ ] Price per square meter output
- [ ] Total construction price output
- [ ] Detailed category-by-category cost breakdown display
- [ ] Confidence level indicator (quick/standard/detailed based on inputs collected)
- [ ] Hardcoded AMBA pricing reference table (MVP)
- [ ] Dynamic system prompt built from configurable categories

### Out of Scope

- Real-time pricing APIs — hardcoded reference data for MVP
- CAD file parsing (DXF/DWG) — vision-only for hackathon
- Multiple regions beyond AMBA — single-region MVP
- User accounts and persistence — in-memory per session
- PDF export — nice-to-have if time permits
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
| Next.js monolith (no separate backend) | Fastest to build for hackathon, TypeScript sufficient for calculation engine | — Pending |
| AI SDK tools for data collection | Zod schemas enforce structure, LLM decides conversation flow | — Pending |
| Claude Sonnet via AI Gateway | Best tool-calling, good Spanish, vision-capable, provider-agnostic | — Pending |
| UniFormat-inspired categories | Maps to how users think about buildings (systems, not products) | — Pending |
| Vision-only floor plan analysis | CAD parsing too complex for 24h; vision + user confirmation is good UX | — Pending |
| Hardcoded AMBA pricing | Fastest for MVP; designed for swap-in of real data later | — Pending |
| Assembly-based costing model | Projects decompose into categories → line items → unit costs | — Pending |

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
*Last updated: 2026-03-20 after initialization*
