# Research Summary

## Stack Decisions

| Decision | Confidence | Notes |
|----------|------------|-------|
| Next.js 16 (App Router) + React 19.2 | High | Turbopack default, dynamic-by-default caching, React Compiler eliminates useMemo/useCallback boilerplate |
| AI SDK v6 (`ai` + `@ai-sdk/react`) | High | Unified tool calling + structured output, `useChat` with native file attachments, Zod v4 native |
| Vercel AI Gateway (`gateway("anthropic/claude-sonnet-4.6")`) | High | OIDC auth on Vercel (no API key management), one-line model swap, free observability |
| Zod v4 | High | 14x faster, `.toJSONSchema()` built-in, AI SDK v6 native support |
| shadcn/ui (CLI v4) + Tailwind CSS v4 | High | Copy-paste arch allows modification, CSS-first config, no `tailwind.config.ts` |
| AI Elements (via `npx ai-elements@latest`) | High | `MessageThread` + `PromptInput` replace ~300 lines of custom chat rendering |
| Vitest (unit) | High | Standard for App Router projects; focus coverage on calculation engine only |
| No UploadThing / no DB / no auth / no tRPC | High | All explicitly out of scope; base64 data URLs sufficient for session-scoped floor plan uploads |

**Open question**: `experimental_attachments` API stability in AI SDK v6 — verify current parameter name before wiring floor plan upload.

---

## Table Stakes Features

These must ship or users will distrust/abandon the product:

1. **Price per m2 + total project cost** — the primary output; must be prominent, not buried
2. **21-category cost breakdown** — validates the total; without it the output is a black box
3. **Localized AMBA pricing** — generic national averages are useless to Buenos Aires users
4. **Quantity derivation from 14 base measurements** — users cannot supply 80 line-item quantities; the engine must derive them
5. **Transparent assumptions** — when data is missing, state the assumed value; this is the trust mechanism
6. **Area and room-type collection** — minimum required inputs; bathroom/kitchen counts are cost multipliers
7. **Recalculation as inputs are collected** — static outputs feel broken to users expecting real-time feedback

---

## Differentiators

What Nelo offers that no Argentine/LatAm competitor does:

1. **Conversational input collection** — zero-friction, no form, no jargon; the AI maps natural language to structured fields. No Argentine competitor does this.
2. **21-category presupuesto de obra output** — domain-specific Argentine professional taxonomy, not a generic template.
3. **Floor plan upload + AI extraction** — auto-populates 60-70% of inputs; confirmation flow turns ~12% vision accuracy into a trust-building UX moment, not a failure.
4. **Confidence tier indicator** (quick ±40-50% / standard ±20-25% / detailed ±10-15%) — honest about uncertainty; no consumer tool does this.
5. **Spanish-first with Argentine construction vocabulary** — revoques, contrapisos, azotea, carpinterías; DATAOBRA and Foco en Obra are form-based, desktop-era tools.
6. **Consumer vs. professional modes** — 8 questions vs. 15+ questions in the same product; no competitor spans both personas.

---

## Architecture Overview

**Five layers, clean separation:**

```
Browser (Chat UI)
  └─ useChat + AI Elements (MessageThread, PromptInput)
  └─ Custom: FloorPlanConfirmation widget, CostBreakdown display

POST /api/chat (Next.js Route Handler)
  └─ streamText({ model: claude-sonnet, system: buildSystemPrompt(), tools: [...] })
  └─ Tools: collectProjectData | analyzeFloorPlan | confirmFloorPlanData | computeEstimate

Calculation Engine — lib/estimate/ (pure functions, no I/O)
  └─ deriveQuantities(ProjectInputs) → ~80 line-item quantities
  └─ applyUnitCosts(quantities, AMBA_UNIT_COSTS) → priced line items
  └─ sumByCategory(lineItems) → 21 CategoryTotals
  └─ computeConfidence(inputs) → 'quick' | 'standard' | 'detailed'

Pricing Data Layer — lib/pricing/ (static config, imported at build time)
  └─ amba-unit-costs.ts (hardcoded, swap-in seam for V2)
  └─ categories-config.ts (single source of truth for categories + system prompt)
  └─ system-prompt-builder.ts → buildSystemPrompt(categories, userMode)
```

**Key data flow decisions:**
- Full `messages` array sent on every POST — no server-side session store; the LLM context window is the working memory.
- `categories-config.ts` drives both the calculation engine AND the system prompt — one source of truth, no drift.
- Vision extraction is a nested `generateObject` call inside the `analyzeFloorPlan` tool, not a separate service.
- GL categories (Seguridad e Higiene, Plan de Gestión Ambiental, Varios) estimated as a % of subtotal, not parametrized.

**Build order (phases):**
1. `lib/pricing/categories-config.ts` + `amba-unit-costs.ts` + `lib/estimate/types.ts` (parallel, no deps)
2. Calculation engine functions with TDD (parallel, depends on types)
3. `app/api/chat/route.ts` (wires everything together)
4. Chat UI shell (can start parallel against stub API)
5. Integration + floor plan flow + polish

---

## Critical Pitfalls

**Top 5 risks ranked by hackathon impact:**

1. **Quantity derivation errors in the calculation engine** (Critical)
   - Wall area must subtract door/window openings: `perimeter × height × stories − (doors × 1.89m2) − (windows × 1.44m2)`
   - Footprint (ground floor only) for foundations/roofing; total area for floor finishes; perimeter for wall derivations
   - Mitigation: TDD first, write derivation spec before code, validate against a known real presupuesto de obra

2. **Missing shared types causing integration hell** (Critical)
   - Four developers building in parallel will produce incompatible interfaces
   - Mitigation: Spend hour 0–2 solely on `lib/estimate/types.ts` — `ProjectInputs`, `LineItem`, `CategoryTotal`, `Estimate`, `FloorPlanExtraction`. Everyone imports from this file.

3. **Tool calling unreliability** (Critical)
   - Model skips tool calls, answers in plain text, or assembles wrong `ProjectInputs` for `computeEstimate`
   - Mitigation: Narrow single-purpose tools, guard in engine validating all 14 fields before running, system prompt examples for each tool, `stopWhen: stepCountIs(20)`, server-side logging of every invocation

4. **System prompt bloat** (High)
   - 21 categories + two user modes + tool instructions + Spanish rules will exceed ~2,000 tokens and cause silent instruction dropout
   - Mitigation: Priority-ordered prompt (role → mode → active tool → rules), inject category context dynamically only at calculation step, use XML tags as structural anchors, target <1,500 tokens for static portion

5. **Deployment left to the last hour** (High)
   - Vercel App Router has edge/Node.js runtime differences, no `fs` access, env vars must be set explicitly
   - Mitigation: Deploy at H2 before any features are built; pricing data as TS module (not JSON file read at runtime); floor plan processing in-memory (no `writeFile`); verify with health check endpoint

**Other notable risks:** Vision output piped directly into engine without user confirmation (Critical, easy fix); stale/undisclosed pricing data (High, add `lastUpdated` + disclaimer); rate limiting during live demo (High, separate demo API key + retry logic + canned demo fallback).

---

## Build Order Recommendation

**Sequential (cannot parallelize):**
```
lib/estimate/types.ts  ←  Must be first, unblocks everything
       ↓
Calculation engine (TDD: derive-quantities → apply-unit-costs → sum-by-category → compute-confidence)
       ↓
app/api/chat/route.ts (wires engine + tools + system prompt)
       ↓
End-to-end integration test (hardcoded input → verify estimate output)
```

**Parallel tracks once types.ts exists:**
- Track A (backend): Calculation engine + system prompt builder
- Track B (frontend): Chat UI shell against stub `/api/chat` returning hardcoded tool results

**Timeline suggestion (24h):**
- H0–H2: Setup, shared types, deploy to Vercel (verify pipeline)
- H2–H8: Calculation engine (TDD) + system prompt v1
- H8–H14: Chat UI + tool calling integration
- H14–H18: Floor plan upload + vision extraction + confirmation UI
- H18–H22: Integration + end-to-end testing
- H22–H24: Demo prep, fallbacks, deployment smoke test

**Defer until core is working:** Floor plan vision (build manual input path first; treat vision as enhancement), PDF export (out of scope), professional mode (implement consumer mode first; professional is a flag in `buildSystemPrompt`).

---

## Open Questions

1. **`experimental_attachments` API**: Still prefixed `experimental_` in AI SDK v6. Verify current parameter signature before wiring floor plan upload — may have been promoted to stable.

2. **`@hookform/resolvers` + Zod v4 compatibility**: Pin to `@hookform/resolvers@^3.10`. If incompatible, fall back to Zod v3 for form validation only (Zod v4 for AI SDK tools).

3. **AI Elements `MessageThread` tool result rendering**: Can it render arbitrary React nodes in tool result slots (needed for `CostBreakdown`)? Check `toolResult` render prop before betting the UI architecture on it. May need a custom message renderer for cost output.

4. **AMBA unit costs finalization**: The team is still defining exact ARS values. Use placeholder values with a disclaimer for the demo; structure as a versioned config file (`amba-2026-q1.ts`) for easy swap.

5. **Claude Argentine Spanish quality**: Test early with realistic phrasing — "quiero construir una casa de PB y PA, más o menos 120 metros en total, en zona norte del conurbano." Validate that Argentine abbreviations (PB, PA, 1P) and written-out numbers ("ochenta y cinco metros") are handled correctly. Fallback: `claude-opus-4` via AI Gateway.

6. **Zone multiplier data**: PITFALLS.md recommends `{ caba: 1.0, gba_norte: 0.92, gba_sur: 0.88, gba_oeste: 0.87 }` as rough approximations. Are these values accepted by the team, or do better reference values exist?
