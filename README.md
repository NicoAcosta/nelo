# Nelo

AI construction cost estimator for the Argentine market.

**[nelo.archi](https://nelo.archi)**

## What it does

Nelo turns a conversation and a floor plan into a detailed construction cost estimate in minutes. Users describe their project through natural language, upload floor plans (AutoCAD, Revit, PDF, images), and get a 400+ line item breakdown across 26 Argentine construction categories with real pricing.

Traditional estimates take 2-3 weeks and cost $500+. Nelo does it in 5 minutes.

## Features

- **Conversational AI** — Describe your project naturally. Nelo asks smart follow-up questions about structure, finishes, and location.
- **Document processing** — Accepts DWG/DXF, IFC, PDF, spreadsheets, and photos. AI vision extracts rooms, dimensions, doors, and windows.
- **26-category breakdown** — Professional Argentine construction budget standard with 400+ line items.
- **Real pricing** — UOCRA labor rates, MercadoLibre material costs, blue-rate USD conversion, INDEC ICC inflation adjustment.
- **Bilingual** — English and Spanish, auto-detected.

## Tech stack

- Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- Claude via Vercel AI Gateway, AI SDK v6
- Zod v4, Vitest, Playwright
- Supabase, Vercel

## Team

- **Juan Cruz Feres** — Architect, domain expert
- **Sebastian Maldonado** — Designer
- **Nicolás Acosta** — Software engineer
