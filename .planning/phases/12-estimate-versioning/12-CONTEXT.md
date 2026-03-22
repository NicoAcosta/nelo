# Phase 12: Estimate Versioning - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Every re-estimation creates a preserved snapshot so users can compare how costs change when they update their inputs or material choices. The `estimates` table already exists in the DB schema (migration 0001) with `version`, `label`, `project_inputs`, `result` columns. This phase wires persistence, builds the version history UI, and adds side-by-side comparison.

</domain>

<decisions>
## Implementation Decisions

### Version persistence
- **D-01:** Every `runEstimate` tool call persists a new row to the `estimates` table — the tool's `execute` function handles this (not `onFinish`), so the estimate is saved even if the user closes the tab mid-stream
- **D-02:** Version numbers are auto-incremented integers per conversation (query `MAX(version)` + 1 at insert time)
- **D-03:** Both `project_inputs` (the full `ProjectInputs` snapshot) and `result` (the full `Estimate` object) are stored as JSONB — immutable once written
- **D-04:** The estimate result is still returned as the tool result (no change to chat rendering), but the `estimate.id` and `version` are included in the tool result so the UI can reference the persisted record

### Version history placement
- **D-05:** Version history lives as a collapsible section at the top of the `CostBreakdown` component — shows current version badge ("v2 of 3") and a "View history" trigger
- **D-06:** "View history" opens a Sheet (slide-out drawer from the right) listing all versions for this conversation, ordered newest-first
- **D-07:** Each version row shows: version number, label (or "Untitled"), timestamp (relative like "2 hours ago"), total price, and a "Compare" checkbox
- **D-08:** The version history sheet is a client component that fetches versions via server action on open (not preloaded)

### Comparison UX
- **D-09:** Single-table comparison layout (not side-by-side panels) — works on mobile: columns are Category | Version A | Version B | Delta
- **D-10:** User selects exactly 2 versions via checkboxes in the version history list, then taps "Compare" button
- **D-11:** Delta column shows signed values with color: green for savings (negative delta), red for cost increases (positive delta), e.g., "+$12,400" in red
- **D-12:** Comparison view renders in the same Sheet, replacing the version list (with a back button to return to list)
- **D-13:** Summary row at top of comparison: total price delta, total percentage change, price/m2 delta

### Labeling flow
- **D-14:** Auto-label is "Version N" (no timestamp in label — timestamp shown separately)
- **D-15:** Labels are editable inline in the version history list — click the label text to edit (same pattern as project title rename on /projects page using `useOptimistic`)
- **D-16:** No prompt or modal after creating an estimate — labeling is optional and non-interruptive
- **D-17:** `updateEstimateLabel` server action handles the rename with `revalidatePath`

### Re-estimate trigger
- **D-18:** Primary trigger is natural chat flow — user says "recalculate with steel frame" or modifies inputs through conversation, Claude calls `runEstimate` again, which auto-creates a new version
- **D-19:** The disabled "Recalculate" button in `CostBreakdown` is NOT wired up in this phase — it would require programmatically injecting a user message into the chat, which adds complexity for minimal value since the user can just type "recalculate"
- **D-20:** After a new estimate is created, the CostBreakdown renders with a subtle banner: "Version N saved — View history" linking to the version sheet

### Claude's Discretion
- Loading skeleton for version history sheet
- Exact spacing/typography in comparison table
- Empty state when only one version exists (no "Compare" available)
- Error handling for failed estimate persistence (should not block the chat response)

</decisions>

<specifics>
## Specific Ideas

- The version badge on CostBreakdown should feel lightweight — not a full toolbar, just a small pill like "v2 of 3" with a chevron to open history
- Comparison deltas should use the same currency formatting as the existing category table (ARS with dot separators)
- The version history sheet should match the existing design language (glass-card backgrounds, zinc tokens, no shadcn/ui — project uses custom components)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database schema
- `supabase/migrations/0001_initial_schema.sql` — `estimates` table definition, RLS policies, relationship to `conversations`
- `supabase/migrations/0002_conversations_unique_project_id.sql` — Unique constraint on `conversations.project_id`

### Estimate engine
- `src/lib/estimate/types.ts` — `Estimate` interface (the result shape stored in `estimates.result`), `ProjectInputs` interface (stored in `estimates.project_inputs`)
- `src/lib/ai/tools.ts` — `runEstimate` tool definition, where persistence call needs to be added

### Chat persistence pattern
- `src/lib/db/conversations.ts` — Existing DB function patterns (`saveConversation`, `loadConversation`), `SupabaseServerClient` type usage
- `src/lib/actions/projects.ts` — Server action patterns (`"use server"`, `createClient()`, `revalidatePath`)
- `src/app/api/chat/route.ts` — `onFinish` handler, `consumeStream()` pattern, how Supabase client is passed to DB functions

### UI components
- `src/components/cost-breakdown.tsx` — Where version badge and history trigger will be added
- `src/app/chat/[id]/chat-content.tsx` — Tool result rendering, how `CostBreakdown` is mounted
- `src/app/projects/project-list.tsx` — Inline rename pattern with `useOptimistic` (model for label editing)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CostBreakdown` component: Already has the category table structure — comparison table mirrors it with added columns
- `useOptimistic` pattern in `project-list.tsx`: Same inline-rename UX for estimate labels
- `SupabaseServerClient` type: Reuse for passing pre-created clients to DB functions
- Currency formatting in `cost-breakdown.tsx`: Reuse for comparison delta formatting
- `stripBase64Attachments` utility: Pattern for cleaning data before DB insert

### Established Patterns
- Server actions in `src/lib/actions/` with `"use server"` directive
- DB functions in `src/lib/db/` as plain async functions accepting optional `SupabaseServerClient`
- `revalidatePath` after mutations
- RLS-based access control (no explicit `user_id` filters in queries — RLS handles it)

### Integration Points
- `runEstimate` tool execute function → add `saveEstimate()` call after `computeEstimate()`
- `CostBreakdown` component → add version badge + sheet trigger
- `loadConversation` → may need to also load estimate metadata (version count) for initial render

</code_context>

<deferred>
## Deferred Ideas

- "Recalculate" button wiring (programmatic re-estimate without chat) — future enhancement
- Version diffing at the line-item level (not just category totals) — adds complexity, defer to v2
- Export comparison as PDF — deferred with all export features
- Version branching (fork from an older version) — over-engineering for v1.1

</deferred>

---

*Phase: 12-estimate-versioning*
*Context gathered: 2026-03-22*
