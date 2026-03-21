# Roadmap: Nelo

**Created:** 2026-03-20
**Phases:** 8
**Requirements covered:** 22/22 (v1) + 9 i18n

---

## Phase 1: Foundation — Types, Config, and Deploy
**Goal:** Establish the shared type contract, pricing/category configuration, and a live Vercel deployment so every developer can work in parallel without integration conflicts.
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, DATA-01, DATA-03, DATA-04
**Success criteria:**
1. `lib/estimate/types.ts` exports `ProjectInputs`, `LineItem`, `CategoryTotal`, `Estimate`, and `FloorPlanExtraction` — no module imports fail.
2. `lib/pricing/categories-config.ts` and `lib/pricing/amba-unit-costs.ts` compile with placeholder ARS values and export correctly typed objects.
3. `lib/pricing/system-prompt-builder.ts` exports `buildSystemPrompt(categories, userMode)` and returns a non-empty string.
4. A `/api/health` route returns `{ ok: true }` on the live Vercel URL.
5. `DATA-03` index formula (`price_updated = price_base × (ICC_current / ICC_base)`) is implemented and tested with a single assertion.
**Dependencies:** None
**Estimated hours:** H0–H2 (2 hours)

---

## Phase 2: Calculation Engine (TDD)
**Goal:** Build and fully unit-test the pure TypeScript calculation engine so it accepts structured inputs and produces a correct 26-category cost breakdown with confidence level.
**Requirements:** CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07
**Success criteria:**
1. `deriveQuantities(ProjectInputs)` correctly derives wall area (subtracting door/window openings), footprint, and all ~14 base measurements; verified against one known real presupuesto de obra fixture.
2. `applyUnitCosts(quantities, AMBA_UNIT_COSTS)` returns a typed array of `LineItem` with non-zero totals.
3. `sumByCategory(lineItems)` returns exactly 26 `CategoryTotal` entries summing to direct cost.
4. `computeEstimate(inputs)` chains all above and returns `price_per_m2`, `total_price`, and a full cost structure (direct → overhead → profit → IVA).
5. `computeConfidence(inputs)` returns `'quick'` for minimal inputs, `'standard'` for mid, `'detailed'` for full; verified with three test cases.
6. All engine functions pass Vitest; zero side effects (no I/O, no external calls).
**Dependencies:** Phase 1 (types, pricing config)
**Parallel:** Yes — can start Track A (engine) and Track B (UI shell, Phase 3) simultaneously once Phase 1 completes.
**Estimated hours:** H2–H8 (6 hours)

---

## Phase 3: Chat UI Shell
**Goal:** Build the chat interface with AI Elements so developers have a working UI against a stub API, unblocking front-end work in parallel with the calculation engine.
**Requirements:** CHAT-01, INFRA-02
**Success criteria:**
1. Chat page renders `MessageThread` and `PromptInput` from AI Elements with no console errors.
2. `useChat` sends a POST to `/api/chat` and displays streamed text responses in the thread.
3. UI is functional on mobile viewport (responsive layout confirmed in browser).
4. Stub `/api/chat` route streams a hardcoded assistant message — no real AI call needed yet.
**Dependencies:** Phase 1 (project scaffolding, Vercel deploy)
**Parallel:** Runs concurrently with Phase 2.
**Estimated hours:** H2–H8 (6 hours)

---

## Phase 4: Chat API — Tool Calling and System Prompt
**Goal:** Wire the real `/api/chat` route with Claude via AI Gateway, define all AI SDK tools with Zod schemas, and implement the dynamic system prompt so the chatbot can collect structured project data and call the calculation engine.
**Requirements:** CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, DATA-02, DATA-04, CALC-01
**Success criteria:**
1. `POST /api/chat` calls `streamText` with `claude-sonnet-4.6` via AI Gateway OIDC auth; response streams correctly.
2. `collectProjectData` tool fires and appends validated `ProjectInputs` fields to the conversation context; Zod parse errors are caught and returned as assistant messages.
3. Express mode (5–8 questions) completes and calls `computeEstimate` tool, returning a price/m² and total.
4. Chatbot states transparent assumptions for any missing field (e.g., "Estoy asumiendo una altura de piso a techo de 2.60 m").
5. User correction via plain text (e.g., "en realidad son 3 metros") updates the relevant field and triggers recalculation.
6. `buildSystemPrompt(categories, userMode)` injects current categories; system prompt static portion is under 1,500 tokens (verified by logging token count).
7. Real AMBA unit prices are populated in `amba-unit-costs.ts` (pricing data research feeds into this phase).
**Dependencies:** Phase 1 (types, config, system prompt builder), Phase 2 (calculation engine), Phase 3 (chat UI for manual testing)
**Estimated hours:** H8–H14 (6 hours)

---

## Phase 5: Cost Breakdown Display and Confidence Indicator
**Goal:** Surface the estimate output as a structured, readable cost breakdown in the chat UI, with the confidence tier displayed prominently.
**Requirements:** CALC-05, CALC-06, CHAT-05
**Success criteria:**
1. `CostBreakdown` component renders all 26 categories with cost, incidence percentage, and unit for a given `Estimate` object.
2. Confidence badge displays the correct tier (quick / standard / detailed) with the associated accuracy range (±40–50% / ±20–25% / ±10–15%).
3. Price per m² and total price are visually prominent (above the fold on desktop and mobile).
4. Component renders correctly when embedded in a `MessageThread` tool result slot (or custom message renderer if AI Elements does not support arbitrary nodes).
**Dependencies:** Phase 2 (engine output shape), Phase 3 (chat UI shell), Phase 4 (tool calling fires estimate)
**Parallel:** `CostBreakdown` component can be built against a mocked `Estimate` fixture in parallel with Phase 4.
**Estimated hours:** H12–H18 (6 hours)

---

## Phase 6: Floor Plan Upload and Vision Extraction
**Goal:** Add floor plan image upload, AI vision extraction of approximate measurements, and the user confirmation/correction flow before the data feeds the calculation engine.
**Requirements:** PLAN-01, PLAN-02, PLAN-03, PLAN-04
**Success criteria:**
1. User can attach a PNG/JPG/PDF floor plan via `PromptInput`; image is sent as base64 data URL in the messages array (no file system writes).
2. `analyzeFloorPlan` tool calls `generateObject` with vision and returns a typed `FloorPlanExtraction` (room count, room types, estimated area, door count, window count).
3. Chatbot presents extracted data as a confirmation message; user can correct individual fields through conversation before `mergeFloorPlanData` updates `ProjectInputs`.
4. After confirmation, `computeEstimate` fires with the merged inputs and displays a cost breakdown.
5. `experimental_attachments` (or promoted stable) API parameter is confirmed and functional end-to-end.
**Dependencies:** Phase 1 (FloorPlanExtraction type), Phase 4 (chat API, tool calling infrastructure)
**Note:** This phase is intentionally last — it is a differentiating enhancement, not the critical path. The Express mode in Phase 4 must work first. If time is tight, Phase 6 can be cut without breaking the core product.
**Estimated hours:** H14–H20 (6 hours)

---

## Timeline Summary

| Hours | Activity |
|-------|----------|
| H0–H2 | Phase 1: All 4 devs on foundation (types, config, deploy) |
| H2–H8 | Phase 2 (Track A, 2 devs: engine TDD) + Phase 3 (Track B, 2 devs: UI shell) |
| H8–H14 | Phase 4: All devs converge on chat API wiring + tool integration |
| H12–H18 | Phase 5 (Track B, can start at H12 once UI + engine shape is stable) |
| H14–H20 | Phase 6 (Track A, floor plan flow) |
| H20–H22 | Integration + end-to-end smoke test |
| H22–H24 | Demo prep, canned fallback, deployment smoke test |

**Pricing data** (real AMBA unit costs from CAC/ICC/UOCRA research) feeds into Phase 4 at H8. Placeholder values in Phase 1 keep the engine buildable from H2.

### Phase 7: Bilingual i18n — English default with Spanish/English language toggle

**Goal:** Make the entire Nelo system bilingual (English/Spanish) with English as default, browser auto-detection, manual EN/ES toggle in header, and localStorage persistence. Covers UI strings, system prompt, category names, engine assumption labels, and API locale routing.
**Requirements:** I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06, I18N-07, I18N-08, I18N-09
**Depends on:** Phase 6
**Plans:** 4 plans

Plans:
- [ ] 07-01-PLAN.md — i18n infrastructure (types, translations dictionary, LocaleProvider, useLocale hook)
- [ ] 07-02-PLAN.md — Backend bilingual (system prompt, category names, engine assumptions, API locale)
- [ ] 07-03-PLAN.md — Frontend bilingual (all UI components use t(), header toggle, LocaleProvider wrap)
- [ ] 07-04-PLAN.md — Documentation update + end-to-end verification checkpoint

### Phase 8: Real Pricing Data Pipeline — Replace all placeholder pricing with live/cached data from INDEC ICC, UOCRA, MercadoLibre, GCBA, Cifras Online, and composition formulas

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 7
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 8 to break down)

---

## Requirement Coverage

| Phase | Requirements |
|-------|-------------|
| Phase 1 | INFRA-01, INFRA-02, INFRA-03, INFRA-04, DATA-01, DATA-03, DATA-04 |
| Phase 2 | CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07 |
| Phase 3 | CHAT-01 (UI scaffolding), INFRA-02 (AI SDK wired to UI) |
| Phase 4 | CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, DATA-02 |
| Phase 5 | CALC-05, CALC-06, CHAT-05 (display layer) |
| Phase 6 | PLAN-01, PLAN-02, PLAN-03, PLAN-04 |
| Phase 7 | I18N-01 (Locale type), I18N-02 (translations dict), I18N-03 (context/hook), I18N-04 (system prompt), I18N-05 (category names), I18N-06 (API locale), I18N-07 (UI components), I18N-08 (header toggle), I18N-09 (docs/verification) |

*INFRA-02 spans Phase 1 (project setup) and Phase 3 (UI wiring). CALC-05 and CHAT-05 span Phase 2 (engine computation) and Phase 5 (display). DATA-04 is established in Phase 1 and consumed in Phase 4.*
