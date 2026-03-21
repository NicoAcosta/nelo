---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-21T20:14:24.390Z"
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 4
  completed_plans: 8
---

# Project State: Nelo

## Current Position

Phase: 07 (bilingual-i18n-english-default-with-spanish-english-language-toggle) — EXECUTING
Plan: 3 of 4

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)
**Core value:** Accurate, transparent construction cost estimation through natural conversation
**Current focus:** Phase 07 — bilingual-i18n-english-default-with-spanish-english-language-toggle

## Active Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| Shared types first (lib/estimate/types.ts) | Done | Phase 1 complete |
| Deploy to Vercel at H2 | Confirmed | Before any features; verify pipeline before building |
| Placeholder ARS values in Phase 1 | Done | Real AMBA prices fed in at Phase 4 (H8) |
| OpenRouter instead of AI Gateway | Done | Team chose for model flexibility, OPENROUTER_API_KEY in .env.local |
| Stitch "nelo v2" as final designs | Confirmed | Dark theme, construction orange, 5 screens in Stitch MCP project 16019953234318479213 |
| Test-driven development | Confirmed | Heavy testing required — spec-driven + TDD approach |

## Blockers

- Pricing data: real AMBA prices not yet sourced (research in progress — feeds into Phase 4 at H8)

## Phase Status

| Phase | Name | Status | Hours |
|-------|------|--------|-------|
| 1 | Foundation — Types, Config, and Deploy | **Complete** | H0–H2 |
| 2 | Calculation Engine (TDD) | **Complete** | H2–H8 |
| 3 | Chat UI Shell | **Complete** | H2–H8 |
| 4 | Chat API — Tool Calling and System Prompt | **Complete** | H8–H14 |
| 5 | Cost Breakdown Display and Confidence Indicator | **Complete** | H12–H18 |
| 6 | Floor Plan Upload and Vision Extraction | **Complete** | H14–H20 |
| 8 | Real Pricing Data Pipeline | **Not planned** | — |

## Stitch Design Reference

Project: "nelo v2" (ID: 16019953234318479213)
Screens:

- Landing: `dfdb197e5de0451fbacf088fcee55a10`
- Chat Empty: `1ca93da6d721411b97fb089e13375a4d`
- Active Chat: `e7ad68a0298e426cb7514bc232f400ed`
- Detailed Estimate: `5b46332ee1564629a5199098f40a6b81`
- Floor Plan Analysis: `0deebcf88f7f4ad9993bf729caf086bc`

## Notes

- Phase 6 (floor plan) is intentionally last and can be cut if time runs short without breaking core product.
- Pricing data research is running in parallel; placeholder values in `amba-unit-costs.ts` must be clearly marked with a disclaimer and `lastUpdated` field.
- All docs in English; app UI in Spanish (primary).
- 77 tests passing (38 backend + 39 frontend).
- Design corrected: light mode + fluorescent yellow-green (#ccff00) + English UI.

## Accumulated Context

### Roadmap Evolution

- Phase 8 added: Real Pricing Data Pipeline — live/cached data from INDEC ICC, UOCRA, MercadoLibre, GCBA, Cifras Online, composition formulas

---
*State updated: 2026-03-21 — Phase 8 added for pricing data pipeline*
