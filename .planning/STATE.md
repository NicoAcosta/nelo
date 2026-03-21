# Project State: Nelo

## Current Position
- Phase: Not started
- Last action: Roadmap created

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-20)
**Core value:** Accurate, transparent construction cost estimation through natural conversation
**Current focus:** Phase 1

## Active Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| Shared types first (lib/estimate/types.ts) | Confirmed | Phase 1 blocker — all modules import from here |
| Deploy to Vercel at H2 | Confirmed | Before any features; verify pipeline before building |
| Placeholder ARS values in Phase 1 | Pending confirmation | Real AMBA prices fed in at Phase 4 (H8) |
| `experimental_attachments` API name | Open question | Verify parameter name before wiring Phase 6 |
| Zone multipliers (CABA: 1.0, GBA Norte: 0.92, GBA Sur: 0.88, GBA Oeste: 0.87) | Open question | Awaiting team confirmation or better reference values |
| AI Elements `MessageThread` tool result rendering | Open question | Verify `toolResult` render prop supports arbitrary React nodes before Phase 5 |

## Blockers
- Pricing data: real AMBA prices not yet sourced (research in progress — feeds into Phase 4 at H8)

## Phase Status

| Phase | Name | Status | Hours |
|-------|------|--------|-------|
| 1 | Foundation — Types, Config, and Deploy | Not started | H0–H2 |
| 2 | Calculation Engine (TDD) | Not started | H2–H8 |
| 3 | Chat UI Shell | Not started | H2–H8 |
| 4 | Chat API — Tool Calling and System Prompt | Not started | H8–H14 |
| 5 | Cost Breakdown Display and Confidence Indicator | Not started | H12–H18 |
| 6 | Floor Plan Upload and Vision Extraction | Not started | H14–H20 |

## Notes
- Phase 6 (floor plan) is intentionally last and can be cut if time runs short without breaking core product.
- Pricing data research is running in parallel; placeholder values in `amba-unit-costs.ts` must be clearly marked with a disclaimer and `lastUpdated` field.
- All docs in English; app UI in Spanish (primary).

---
*State initialized: 2026-03-20 after roadmap creation*
