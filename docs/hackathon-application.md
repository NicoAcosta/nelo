# Hackathon Application — Nelo

## BUIDL Name

Nelo

## Vision (256 chars max)

Construction cost estimation in Argentina takes weeks and $500+. Nelo is an AI chatbot that delivers a 26-category cost breakdown in minutes using real pricing data and floor plan vision analysis.

## Details

You want to build a house in Buenos Aires. Step one: find out how much it's going to cost.

So you call architects. You wait days — maybe weeks. When someone finally gets back to you, they charge $500 or more. Not for the construction. For the *estimate*.

If you're the architect, it's worse. Every single project means weeks of calling suppliers, researching prices, filling the same spreadsheets. Over and over.

**Nelo fixes this.** Think TurboTax for construction budgets.

### How It Works

1. **Chat** — Describe your project in plain language. Nelo asks the right follow-up questions — structure type, finish level, location — one at a time, no forms, no jargon.
2. **Upload** — Drop a floor plan from AutoCAD (DWG/DXF), Revit (IFC), PDF, spreadsheet, or even a photo from your phone. AI vision extracts rooms, dimensions, doors, and windows automatically — then asks you to confirm before calculating.
3. **Estimate** — Get a full 26-category cost breakdown with 400+ line items. Price per m² in ARS and USD (blue rate). Confidence level based on data quality. Every assumption transparent and correctable.

### What Makes It Real

This isn't a ChatGPT wrapper. Three things set Nelo apart:

- **Domain-expert computation** — 400+ line items across 26 Argentine construction budget categories. The same structure architects actually use — not a generic AI summary.
- **Real pricing data** — UOCRA labor rates (official paritarias), MercadoLibre material costs (real-time), blue-rate dollar conversion via DolarAPI, and INDEC ICC inflation adjustment. Updated daily. Prices are composition formulas that adapt automatically.
- **Vision understanding** — Upload from AutoCAD, Revit, PDF, or a photo. AI extracts the layout: rooms, doors, windows, dimensions. Then it asks you to confirm — you stay in control.

### Full Cost Structure

Every estimate includes:
- Direct costs across 26 categories (structural, electrical, plumbing, finishes, etc.)
- Overhead (10%) + Profit (12%) + IVA (21%)
- Cost per m² in ARS and USD
- Confidence tier: Express (±40-50%), Standard (±20-25%), Detailed (±10-15%)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| AI | Claude via Vercel AI Gateway, AI SDK v6 (streaming, tool calling, structured output, vision) |
| Frontend | shadcn/ui + Tailwind CSS v4 |
| Validation | Zod v4 |
| Documents | AutoCAD DWG/DXF pipeline, Revit IFC, PDF.js, spreadsheets, images |
| Pricing | UOCRA labor, MercadoLibre materials, DolarAPI blue rate, INDEC ICC index |
| Storage | Supabase |
| Deployment | Vercel at [nelo.archi](https://nelo.archi) |

### The Team

- **Juan Cruz Feres** — Architect. Domain expert and product lead. Has spent his career dealing with this exact problem. Drove requirements from firsthand experience with Argentine construction estimation.
- **Sebastian Maldonado** — Designer. Led product design, user research, and interface strategy. Shaped the experience from user interviews to final UI.
- **Nicolas Acosta** — Software Engineer. Built the AI pipeline, calculation engine, document processing, and infrastructure. Full-stack development and system architecture.

### Why This Matters

The architect who used to spend weeks on every estimate gets his answer in five minutes now. The homeowner who couldn't afford a preliminary study can finally know what their project will cost — before committing.

Nelo democratizes construction cost estimation. Same quality estimates that professional developers get, available to everyone through a conversation.

## Category

AI Agent

## Is this BUIDL an AI Agent?

Yes — Nelo uses multi-step AI reasoning with tool calling, vision analysis, and structured output to progressively collect project data, analyze floor plans, and produce detailed cost breakdowns. It makes autonomous decisions about what questions to ask, fills gaps with domain-appropriate defaults, and orchestrates a 26-category calculation engine — all through natural conversation.

## Links

- **GitHub**: https://github.com/NicoAcosta/nelo
- **Website**: https://nelo.archi
- **Demo video**: *TODO — record per script in docs/pitch-deck.md*

## Social Links

- *TODO: Add team social links (X/Twitter, LinkedIn, etc.)*
