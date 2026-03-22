# Roadmap: Nelo

## Milestones

- ✅ **v1.0 MVP** - Phases 1-8 (shipped 2026-03-21)
- 🚧 **v1.1 Persistence & Sharing** - Phases 9-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-8) - SHIPPED 2026-03-21</summary>

### Phase 1: Foundation — Types, Config, and Deploy
**Goal:** Establish the shared type contract, pricing/category configuration, and a live Vercel deployment so every developer can work in parallel without integration conflicts.
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, DATA-01, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. `lib/estimate/types.ts` exports `ProjectInputs`, `LineItem`, `CategoryTotal`, `Estimate`, and `FloorPlanExtraction` — no module imports fail.
  2. `lib/pricing/categories-config.ts` and `lib/pricing/amba-unit-costs.ts` compile with placeholder ARS values and export correctly typed objects.
  3. `lib/pricing/system-prompt-builder.ts` exports `buildSystemPrompt(categories, userMode)` and returns a non-empty string.
  4. A `/api/health` route returns `{ ok: true }` on the live Vercel URL.
  5. `DATA-03` index formula (`price_updated = price_base × (ICC_current / ICC_base)`) is implemented and tested with a single assertion.
**Plans**: TBD

### Phase 2: Calculation Engine (TDD)
**Goal:** Build and fully unit-test the pure TypeScript calculation engine so it accepts structured inputs and produces a correct 26-category cost breakdown with confidence level.
**Requirements:** CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07
**Success Criteria** (what must be TRUE):
  1. `deriveQuantities(ProjectInputs)` correctly derives wall area, footprint, and all ~14 base measurements; verified against one known real presupuesto de obra fixture.
  2. `applyUnitCosts(quantities, AMBA_UNIT_COSTS)` returns a typed array of `LineItem` with non-zero totals.
  3. `sumByCategory(lineItems)` returns exactly 26 `CategoryTotal` entries summing to direct cost.
  4. `computeEstimate(inputs)` chains all above and returns `price_per_m2`, `total_price`, and a full cost structure.
  5. `computeConfidence(inputs)` returns the correct tier; verified with three test cases.
  6. All engine functions pass Vitest; zero side effects.
**Plans**: TBD

### Phase 3: Chat UI Shell
**Goal:** Build the chat interface with AI Elements so developers have a working UI against a stub API.
**Requirements:** CHAT-01, INFRA-02
**Success Criteria** (what must be TRUE):
  1. Chat page renders `MessageThread` and `PromptInput` from AI Elements with no console errors.
  2. `useChat` sends a POST to `/api/chat` and displays streamed text responses in the thread.
  3. UI is functional on mobile viewport.
  4. Stub `/api/chat` route streams a hardcoded assistant message.
**Plans**: TBD

### Phase 4: Chat API — Tool Calling and System Prompt
**Goal:** Wire the real `/api/chat` route with Claude, define all AI SDK tools with Zod schemas, and implement the dynamic system prompt.
**Requirements:** CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, DATA-02, DATA-04, CALC-01
**Success Criteria** (what must be TRUE):
  1. `POST /api/chat` calls `streamText` with Claude; response streams correctly.
  2. `collectProjectData` tool fires and appends validated `ProjectInputs` fields to the conversation context.
  3. Express mode completes and calls `computeEstimate` tool, returning a price/m² and total.
  4. Chatbot states transparent assumptions for any missing field.
  5. User correction updates the relevant field and triggers recalculation.
**Plans**: TBD

### Phase 5: Cost Breakdown Display and Confidence Indicator
**Goal:** Surface the estimate output as a structured, readable cost breakdown in the chat UI.
**Requirements:** CALC-05, CALC-06, CHAT-05
**Success Criteria** (what must be TRUE):
  1. `CostBreakdown` component renders all 26 categories with cost, incidence percentage, and unit.
  2. Confidence badge displays the correct tier with associated accuracy range.
  3. Price per m² and total price are visually prominent above the fold.
  4. Component renders correctly when embedded in a `MessageThread` tool result slot.
**Plans**: TBD

### Phase 6: Floor Plan Upload and Vision Extraction
**Goal:** Add floor plan image upload, AI vision extraction of approximate measurements, and the user confirmation/correction flow.
**Requirements:** PLAN-01, PLAN-02, PLAN-03, PLAN-04
**Success Criteria** (what must be TRUE):
  1. User can attach a PNG/JPG/PDF floor plan via `PromptInput`; image is sent as base64 data URL.
  2. `analyzeFloorPlan` tool returns a typed `FloorPlanExtraction` with room count, area, door/window counts.
  3. Chatbot presents extracted data as a confirmation message; user can correct fields through conversation.
  4. After confirmation, `computeEstimate` fires with merged inputs and displays a cost breakdown.
**Plans**: TBD

### Phase 7: Bilingual i18n
**Goal:** Make the entire Nelo system bilingual (English/Spanish) with English as default, browser auto-detection, manual EN/ES toggle in header, and localStorage persistence.
**Requirements:** I18N-01, I18N-02, I18N-03, I18N-04, I18N-05, I18N-06, I18N-07, I18N-08, I18N-09
**Depends on:** Phase 6
**Plans:** 4 plans

Plans:
- [x] 07-01-PLAN.md — i18n infrastructure (types, translations dictionary, LocaleProvider, useLocale hook)
- [x] 07-02-PLAN.md — Backend bilingual (system prompt, category names, engine assumptions, API locale)
- [x] 07-03-PLAN.md — Frontend bilingual (all UI components use t(), header toggle, LocaleProvider wrap)
- [x] 07-04-PLAN.md — Documentation update + end-to-end verification checkpoint

### Phase 8: Real Pricing Data Pipeline
**Goal:** Replace every placeholder unit cost with a real, composition-formula-derived price. Wire DolarAPI for blue rate USD conversion. Build cache infrastructure, manual override system, and daily cron refresh.
**Requirements:** D-01 through D-24
**Depends on:** Phase 7
**Plans:** 5/5 plans complete

Plans:
- [x] 08-01-PLAN.md — Cache infrastructure, blue rate adapter, manual override system (TDD)
- [x] 08-02-PLAN.md — UOCRA rates with zone supplement, composition formula engine (TDD)
- [x] 08-03-PLAN.md — Populate all ~130 items with real prices, ICC update, fallback replacement
- [x] 08-04-PLAN.md — USD conversion (blue rate), price freshness in Estimate output
- [x] 08-05-PLAN.md — Daily cron refresh endpoint + architect validation checkpoint

</details>

---

### v1.1 Persistence & Sharing (In Progress)

**Milestone Goal:** Add Supabase-powered auth, chat persistence, estimate versioning, and shareable estimate links so users can recover previous conversations, revise inputs, compare estimates, and share results with clients.

## Phase Details

### Phase 9: Supabase Auth Infrastructure
**Goal**: Users can securely sign in and maintain sessions — the authenticated identity required by every persistence feature in this milestone.
**Depends on**: Phase 8
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User receives an email with both a clickable magic link and a 6-digit OTP code; clicking either completes sign-in and redirects to `/projects`.
  2. Authenticated user can refresh the browser tab on any protected page and remain signed in without re-entering credentials.
  3. Unauthenticated user visiting `/chat` or `/projects` is redirected to the sign-in page and lands on their intended destination after signing in.
  4. User can click "Sign out" and is redirected to the landing page; returning to `/chat` or `/projects` requires signing in again.
  5. `/share/**` routes are accessible without authentication (public read-only paths are not blocked by auth middleware).
**Plans:** 3/3 plans complete

Plans:
- [x] 09-01-PLAN.md — Supabase packages, client factories, proxy.ts session middleware, database migration SQL
- [x] 09-02-PLAN.md — AuthProvider context, sign-in page (email + OTP), PKCE callback route, i18n strings
- [x] 09-03-PLAN.md — Header user menu with sign-out, chat API auth guard, projects page placeholder

### Phase 10: Chat Persistence
**Goal**: Chat conversations survive page refreshes, tab closes, and browser sessions — users can return to `/chat/[id]` and see their full history exactly as they left it.
**Depends on**: Phase 9
**Requirements**: PERS-01, PERS-02
**Success Criteria** (what must be TRUE):
  1. After an assistant response completes, refreshing the page at `/chat/[id]` restores all messages including tool calls, tool results, and cost breakdowns — nothing is lost.
  2. If a user closes the tab mid-stream (while the assistant is still generating), the partial response is still saved when the stream finishes on the server.
  3. Navigating directly to a `/chat/[id]` URL for a previous conversation loads the full message history via `initialMessages` before the first user interaction.
  4. Floor plan images in messages are stored as Supabase Storage paths — not as multi-megabyte base64 strings in the database.
**Plans:** 2/2 plans complete

Plans:
- [x] 10-01-PLAN.md — DB migration (unique index), conversations.ts save/load layer with tests, route handler onFinish + consumeStream
- [x] 10-02-PLAN.md — Route restructure: /chat redirect, /chat/[id] Server+Client Component split, end-to-end verification

### Phase 11: Project Management
**Goal**: Returning users see all their past projects in one place and can give them meaningful names so they can find and resume the right conversation.
**Depends on**: Phase 10
**Requirements**: PERS-03, PERS-04
**Success Criteria** (what must be TRUE):
  1. Authenticated user visiting `/projects` sees a list of all their past conversations sorted by most recent activity, each showing its title and last-updated timestamp.
  2. A new conversation gets an auto-generated title derived from the first user message (e.g., "Casa 120m2 en Palermo, steel frame") within seconds of sending that message.
  3. User can click a project's title inline to rename it; the new name persists immediately and appears in the list on next load.
  4. User can click any project in the list to navigate to `/chat/[id]` and resume that conversation with full history loaded.
**Plans:** 2/2 plans complete

Plans:
- [x] 11-01-PLAN.md — Data layer: listProjects() query, updateProjectTitle() server action, i18n keys, TDD tests
- [x] 11-02-PLAN.md — UI: Projects page with ProjectList component, inline rename, empty state, sidebar/nav link updates

### Phase 12: Estimate Versioning
**Goal**: Every re-estimation creates a preserved snapshot so users can compare how costs change when they update their inputs or material choices.
**Depends on**: Phase 11
**Requirements**: VERS-01, VERS-02, VERS-03, VERS-04
**Success Criteria** (what must be TRUE):
  1. Running the estimate a second time in the same chat creates a new version row in the database; the original estimate is unchanged and still retrievable.
  2. User can view a version history list for their project showing each estimate version with its timestamp and label.
  3. User can select two versions and see a side-by-side comparison showing the cost delta per category (e.g., "Estructura: +$12,400 ARS").
  4. User can type a label for any estimate version (e.g., "con pileta", "steel frame option") and the label persists and appears in the version history list.
**Plans:** 2 plans

Plans:
- [ ] 12-01-PLAN.md — Data layer: DB functions, comparison logic, server actions, tool persistence wiring (TDD)
- [ ] 12-02-PLAN.md — UI: Sheet primitive, VersionHistorySheet, CostBreakdown version badge, i18n keys

### Phase 13: Shareable Links and Floor Plan Storage
**Goal**: Users can send a read-only estimate link to a client or colleague who can view the full cost breakdown without needing an account.
**Depends on**: Phase 12
**Requirements**: SHARE-01, SHARE-02, SHARE-03
**Success Criteria** (what must be TRUE):
  1. User can click "Share estimate" on any saved estimate version and receive a `/share/{token}` URL they can copy and send.
  2. Anyone with the share link can view the full cost breakdown at `/share/{token}` without signing in — the page is publicly readable.
  3. User can optionally set an expiration date when creating a share link; once expired, the link returns a "This link has expired" message rather than the estimate.
  4. Floor plan images uploaded during a chat session are stored in a private Supabase Storage bucket and served via signed URLs — they are not embedded as base64 strings anywhere in the database or shared pages.
**Plans**: TBD

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | - | Complete | 2026-03-21 |
| 2. Calculation Engine | v1.0 | - | Complete | 2026-03-21 |
| 3. Chat UI Shell | v1.0 | - | Complete | 2026-03-21 |
| 4. Chat API | v1.0 | - | Complete | 2026-03-21 |
| 5. Cost Breakdown Display | v1.0 | - | Complete | 2026-03-21 |
| 6. Floor Plan Upload | v1.0 | - | Complete | 2026-03-21 |
| 7. Bilingual i18n | v1.0 | 4/4 | Complete | 2026-03-21 |
| 8. Real Pricing Data Pipeline | v1.0 | 5/5 | Complete | 2026-03-21 |
| 9. Supabase Auth Infrastructure | v1.1 | 3/3 | Complete |  |
| 10. Chat Persistence | v1.1 | 2/2 | Complete    | 2026-03-22 |
| 11. Project Management | v1.1 | 2/2 | Complete    | 2026-03-22 |
| 12. Estimate Versioning | v1.1 | 0/2 | Not started | - |
| 13. Shareable Links and Floor Plan Storage | v1.1 | 0/TBD | Not started | - |

---

## Requirement Coverage (v1.1)

| Phase | Requirements |
|-------|-------------|
| Phase 9 | AUTH-01, AUTH-02, AUTH-03, AUTH-04 |
| Phase 10 | PERS-01, PERS-02 |
| Phase 11 | PERS-03, PERS-04 |
| Phase 12 | VERS-01, VERS-02, VERS-03, VERS-04 |
| Phase 13 | SHARE-01, SHARE-02, SHARE-03 |

**Coverage: 15/15 v1.1 requirements mapped. No orphans.**
