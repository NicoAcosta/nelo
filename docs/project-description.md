# Nelo — Project Description

## One-liner

Nelo is an AI-powered tool that turns a conversation and a floor plan into a detailed construction cost estimate in minutes.

## Tagline

AI construction estimates in minutes, not weeks.

## Short Description

Nelo is an AI construction cost estimator for architects and consumers in Buenos Aires. Describe your project through a conversation, upload a floor plan from AutoCAD, Revit, or a photo, and get a 26-category cost breakdown with real Argentine pricing — UOCRA labor rates, supplier costs, and inflation-adjusted data. What used to take weeks now takes five minutes.

## Full Description

Nelo is an AI-powered construction cost estimator built for the Argentine market. Architects and consumers describe their project through natural conversation, upload floor plans in any format — AutoCAD (DWG/DXF), Revit (IFC), PDFs, spreadsheets, or photos — and receive a detailed cost breakdown across 26 construction categories with over 400 line items. Pricing is sourced from UOCRA labor rates, MercadoLibre and supplier costs, blue-rate USD conversion, and INDEC inflation indices, all updated daily. Founded by an architect who spent his career dealing with this exact problem, Nelo replaces weeks of calls, spreadsheets, and price research with a five-minute AI conversation. Currently in closed beta with partner architects, launching at $14/mo with individual and studio plans.

## The Problem

Getting a construction cost estimate in Argentina takes weeks and costs hundreds of dollars — before any building starts. At the early stage, even a ballpark number requires days of calls and often paying for a preliminary study. At the detailed stage, real numbers involve multiple people: suppliers, subcontractors, price research, spreadsheets. This repetitive work consumes weeks of an architect's time on every single project.

## The Solution

Nelo handles both stages through AI:

1. **Chat** — Describe your project in natural language. Nelo asks smart follow-up questions about structure type, finishes, location, and fills gaps with reasonable defaults.
2. **Upload** — Drop a floor plan from AutoCAD (DWG, DXF), Revit (IFC), PDF, spreadsheet, or a photo. AI vision extracts rooms, dimensions, doors, and windows — then asks you to confirm.
3. **Estimate** — Get a 26-category cost breakdown with price per m2, total price in ARS and USD (blue rate), confidence level, and transparent assumptions.

## What Makes It Real

- **400+ line items** across 26 Argentine construction budget categories — the same structure architects actually use.
- **Real pricing data**: UOCRA labor rates, MercadoLibre and supplier pricing, blue-rate USD conversion, INDEC ICC inflation adjustment. Updated daily.
- **Professional tool integration**: Reads AutoCAD (DWG/DXF), Revit (IFC), PDFs, spreadsheets, and images.
- **Bilingual**: English and Spanish, auto-detected from browser with manual toggle.
- **Founded by an architect** who has dealt with this exact problem throughout his career.

## AI Capabilities

- **Conversational reasoning** — Collects data through dialogue. Fills gaps with smart defaults. Shows every assumption transparently. No forms, no jargon.
- **Vision understanding** — Reads floor plans in any format. Extracts rooms, doors, windows, dimensions. Asks the user to confirm before calculating.
- **Domain-expert computation** — 400+ line items, 26 categories, real Argentine pricing from multiple data sources, inflation-adjusted daily.

## Why Now

AI vision can finally interpret floor plans accurately. Real-time pricing data makes static spreadsheets obsolete.

## The Team

- **Juan Cruz Feres** — Architect. Domain expert and product lead. Drove requirements from years of firsthand experience with construction estimation.
- **Sebastian Maldonado** — Designer. Led product design, user research, and interface strategy. Shaped the experience from user interviews to final UI.
- **Nicolas Acosta** — Software Engineer. Built the AI pipeline, calculation engine, document processing, and infrastructure. Full-stack development and system architecture.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| AI | Claude via AI Gateway, AI SDK v6, vision analysis |
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Validation | Zod v4 |
| Documents | AutoCAD (DWG/DXF), Revit (IFC), PDF.js, spreadsheets, images |
| Pricing | UOCRA, MercadoLibre, DolarAPI, INDEC ICC |
| Deployment | Vercel |

## Validation

- Founded by an architect who has dealt with this problem throughout his career.
- Conversations with other architects confirmed strong interest — there is already a waitlist of professionals ready to use it.
- The problem is universal across the Argentine construction industry and likely beyond.

## Business Model

- Currently in free closed beta with partner architects.
- Public launch at $14/mo for individuals, with studio plans for architecture firms.
- Roadmap includes a supplier marketplace: material suppliers list real-time pricing, architects get competitive offers, Nelo takes a revenue share.

## Links

- **Website**: nelo.archi
- **App**: nelo.archi/chat
