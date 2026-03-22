# Phase 12: Estimate Versioning - Research

**Researched:** 2026-03-22
**Domain:** Supabase JSONB versioning, React Sheet/drawer UI, optimistic updates, AI SDK tool execute persistence
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Version persistence**
- D-01: Every `runEstimate` tool call persists a new row to the `estimates` table — the tool's `execute` function handles this (not `onFinish`), so the estimate is saved even if the user closes the tab mid-stream
- D-02: Version numbers are auto-incremented integers per conversation (query `MAX(version)` + 1 at insert time)
- D-03: Both `project_inputs` and `result` are stored as JSONB — immutable once written
- D-04: The estimate result is still returned as the tool result (no change to chat rendering), but `estimate.id` and `version` are included in the tool result so the UI can reference the persisted record

**Version history placement**
- D-05: Version history lives as a collapsible section at the top of the `CostBreakdown` component — shows current version badge ("v2 of 3") and a "View history" trigger
- D-06: "View history" opens a Sheet (slide-out drawer from the right) listing all versions for this conversation, ordered newest-first
- D-07: Each version row shows: version number, label (or "Untitled"), timestamp (relative like "2 hours ago"), total price, and a "Compare" checkbox
- D-08: The version history sheet is a client component that fetches versions via server action on open (not preloaded)

**Comparison UX**
- D-09: Single-table comparison layout — columns: Category | Version A | Version B | Delta
- D-10: User selects exactly 2 versions via checkboxes, then taps "Compare"
- D-11: Delta column shows signed values with color: green for savings (negative delta), red for cost increases (positive delta)
- D-12: Comparison view renders in the same Sheet, replacing the version list (with a back button)
- D-13: Summary row at top: total price delta, total percentage change, price/m2 delta

**Labeling flow**
- D-14: Auto-label is "Version N" (no timestamp in label)
- D-15: Labels are editable inline in the version history list — click to edit (same `useOptimistic` pattern as project-list.tsx)
- D-16: No prompt or modal after creating an estimate
- D-17: `updateEstimateLabel` server action handles the rename with `revalidatePath`

**Re-estimate trigger**
- D-18: Primary trigger is natural chat — user asks Claude to recalculate, Claude calls `runEstimate` again
- D-19: The disabled "Recalculate" button in `CostBreakdown` is NOT wired up in this phase
- D-20: After a new estimate is created, `CostBreakdown` renders with a subtle banner: "Version N saved — View history"

### Claude's Discretion
- Loading skeleton for version history sheet
- Exact spacing/typography in comparison table
- Empty state when only one version exists (no "Compare" available)
- Error handling for failed estimate persistence (should not block the chat response)

### Deferred Ideas (OUT OF SCOPE)
- "Recalculate" button wiring (programmatic re-estimate without chat)
- Version diffing at the line-item level (not just category totals)
- Export comparison as PDF
- Version branching (fork from an older version)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VERS-01 | Each runEstimate call creates an immutable snapshot (new row, old versions preserved) | D-01 through D-04; `estimates` table already exists with correct schema; `execute` function in `tools.ts` is the injection point |
| VERS-02 | User can see a version history list for each project with timestamps | D-05 through D-08; Sheet pattern confirmed for drawer UI; server action fetch on open |
| VERS-03 | User can compare two estimate versions side-by-side showing delta per category | D-09 through D-13; comparison math is pure function over `CategoryTotal[]` arrays from `result` JSONB |
| VERS-04 | User can name/label estimate versions (e.g., "with pool", "steel frame option") | D-14 through D-17; inline edit pattern identical to `project-list.tsx` `useOptimistic` rename |

</phase_requirements>

---

## Summary

Phase 12 wires the already-migrated `estimates` table into the application, adding three distinct capabilities: persistence (every `runEstimate` tool call saves a row), history browsing (collapsible sheet in `CostBreakdown`), and side-by-side comparison with delta display.

The foundation is sound. Migration `0001_initial_schema.sql` already defines the `estimates` table with all required columns (`id`, `conversation_id`, `version`, `label`, `project_inputs`, `result`, `created_at`). RLS is already in place — access flows through `conversations` → `projects` → `auth.uid()`, so no additional RLS work is needed. The `conversations` table has a unique index on `project_id` meaning each project has exactly one conversation row, and `estimates` references `conversation_id`.

The biggest integration constraint is that `runEstimate`'s `execute` function currently has no access to the Supabase client or the `conversation_id` — these are not passed into the tool function. The chat route creates tools via `createChatTools(locale)` which is a pure function. The solution is to extend `createChatTools` to accept an optional `conversationId` and a Supabase client reference (or a persistence callback), so the tool's `execute` can call `saveEstimate()` without circular dependencies.

**Primary recommendation:** Add `conversationId` and a `saveEstimateFn` callback parameter to `createChatTools`; implement `saveEstimate()` as a typed DB function in `src/lib/db/estimates.ts` mirroring the pattern in `src/lib/db/conversations.ts`; build the version history Sheet as a standalone client component that calls a `listEstimates` server action on mount.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | already installed | Supabase server client for DB ops in tools and server actions | Already used throughout; `createClient()` from `@/lib/supabase/server` |
| React `useOptimistic` | React 19 (built-in) | Optimistic label edits before server action confirms | Already used in `project-list.tsx` — identical pattern |
| React `useTransition` | React 19 (built-in) | Wrap server action calls without blocking UI | Already used in `project-list.tsx` |
| `Intl.RelativeTimeFormat` | Platform API | Relative timestamps ("2 hours ago") | Already used in `project-list.tsx` `formatRelativeTime` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `shadcn/ui Sheet` | via CLI | Slide-out drawer for version history | D-06 mandates a Sheet drawer — project uses custom components, but Sheet is the right primitive; adapt to project design tokens |
| Tailwind CSS v4 | already installed | Styling comparison table delta colors | `text-green-*` / `text-red-*` for positive/negative deltas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sheet drawer | Modal/Dialog | Sheet is better on mobile (slides from edge, doesn't obscure full screen); decisions lock Sheet |
| Server action fetch on open | Preload with `loadConversation` | Preload increases initial page load for data rarely needed; D-08 explicitly locks lazy fetch |

**Installation:** No new packages required. All dependencies are already in the project.

---

## Architecture Patterns

### New Files to Create

```
src/
├── lib/
│   ├── db/
│   │   └── estimates.ts          # saveEstimate(), listEstimates(), updateEstimateLabel() DB functions
│   └── actions/
│       └── estimates.ts          # "use server" wrappers: listEstimatesAction(), updateEstimateLabelAction()
└── components/
    └── version-history-sheet.tsx  # Client component: Sheet + version list + comparison table
```

### Pattern 1: Persistence Injection into Tool Execute

The `execute` function in `runEstimate` runs server-side inside the AI SDK streaming loop. It needs Supabase access. The cleanest approach — matching existing patterns — is to extend `createChatTools` to accept a persistence callback:

```typescript
// src/lib/ai/tools.ts (modified signature)
export function createChatTools(
  locale: Locale = "en",
  options?: {
    conversationId?: string;
    onEstimateSaved?: (estimateId: string, version: number) => void;
    saveEstimate?: (params: SaveEstimateParams) => Promise<{ id: string; version: number }>;
  }
)
```

The `execute` function then calls `options?.saveEstimate?.(...)` after `computeEstimate()`. Errors from persistence must be swallowed with `console.error` so they never throw and never block the tool result returned to the model.

```typescript
// Inside runEstimate execute:
const estimate = computeEstimate(projectInputs, locale);
if (options?.saveEstimate && options?.conversationId) {
  try {
    const { id, version } = await options.saveEstimate({
      conversationId: options.conversationId,
      projectInputs,
      result: estimate,
    });
    return { ...estimate, _persistedId: id, _version: version };
  } catch (err) {
    console.error("Failed to persist estimate:", err);
  }
}
return estimate;
```

The chat route passes the callback after resolving the `conversation_id` from the project:

```typescript
// src/app/api/chat/route.ts (addition)
const conversation = await getConversationId(projectId, supabase); // new DB helper
const tools = createChatTools(locale, {
  conversationId: conversation?.id,
  saveEstimate: (params) => saveEstimate(params, supabase),
});
```

### Pattern 2: DB Function — estimates.ts

Mirrors `conversations.ts` exactly:

```typescript
// src/lib/db/estimates.ts
export interface EstimateSummary {
  id: string;
  version: number;
  label: string | null;
  total_price: number;      // extracted from result JSONB for list display
  created_at: string;
}

export async function saveEstimate(
  params: { conversationId: string; projectInputs: ProjectInputs; result: Estimate },
  client?: SupabaseServerClient,
): Promise<{ id: string; version: number }> {
  const supabase = client ?? await createClient();
  // Get MAX(version) for this conversation
  const { data: maxRow } = await supabase
    .from("estimates")
    .select("version")
    .eq("conversation_id", params.conversationId)
    .order("version", { ascending: false })
    .limit(1)
    .single();
  const nextVersion = (maxRow?.version ?? 0) + 1;
  const { data, error } = await supabase
    .from("estimates")
    .insert({
      conversation_id: params.conversationId,
      version: nextVersion,
      label: null,         // auto-label "Version N" is display-only
      project_inputs: params.projectInputs,
      result: params.result,
    })
    .select("id, version")
    .single();
  if (error) throw new Error(`saveEstimate failed: ${error.message}`);
  return { id: data.id, version: data.version };
}

export async function listEstimates(
  conversationId: string,
  client?: SupabaseServerClient,
): Promise<EstimateSummary[]> { ... }

export async function updateEstimateLabel(
  estimateId: string,
  label: string,
  client?: SupabaseServerClient,
): Promise<void> { ... }
```

### Pattern 3: Server Actions — actions/estimates.ts

```typescript
"use server";
// src/lib/actions/estimates.ts
export async function listEstimatesAction(conversationId: string): Promise<EstimateSummary[]>
export async function updateEstimateLabelAction(estimateId: string, label: string): Promise<{ error?: string }>
```

`updateEstimateLabelAction` calls `revalidatePath` on the chat page path after success, matching the `updateProjectTitle` pattern in `src/lib/actions/projects.ts`.

### Pattern 4: Version History Sheet Component

The Sheet component is a client component that:
1. Renders as closed by default
2. On open: calls `listEstimatesAction(conversationId)` and shows a loading skeleton
3. Manages two states: `"list"` view and `"compare"` view
4. In list view: renders rows with checkboxes, inline label editing via `useOptimistic`, relative timestamps
5. In compare view: renders the single-table comparison with delta column

```typescript
// src/components/version-history-sheet.tsx
"use client";
interface VersionHistorySheetProps {
  conversationId: string;
  currentVersion: number;
  totalVersions: number;  // for the "v2 of 3" badge — passed from CostBreakdown
}
```

`CostBreakdown` needs `conversationId` and version metadata added to its props. Since `runEstimate` tool result now includes `_persistedId` and `_version`, `chat-content.tsx`'s `renderToolResult` must thread these through to `CostBreakdown`.

### Pattern 5: Comparison Delta Computation

Pure function, no side effects, fully testable:

```typescript
// src/lib/estimate/compare.ts
export interface EstimateComparison {
  categories: CategoryDelta[];
  totalPriceDelta: number;
  totalPricePercentDelta: number;
  pricePerM2Delta: number;
}

export interface CategoryDelta {
  id: string;
  name: string;
  versionA: number;
  versionB: number;
  delta: number;           // versionB - versionA
  deltaPercent: number;
}

export function compareEstimates(a: Estimate, b: Estimate): EstimateComparison
```

### Anti-Patterns to Avoid

- **Calling `createClient()` inside `execute`:** The tool execute function runs in a Vercel Function request context but `cookies()` from `next/headers` is not safe to call after the streaming response has begun. Pass a pre-created client (or callback) from the route handler instead.
- **Storing auto-label "Version N" in DB as label:** The label column is nullable; `null` means "not yet labeled". "Version N" is rendered from `version` number client-side. Storing "Version 1" as label creates a rename conflict when user adds a real label.
- **Race condition on MAX(version):** If two simultaneous estimates are inserted for the same conversation, both could read MAX=0 and both insert version=1. This phase is single-user single-session, so the risk is negligible. If robustness is needed later, add a `UNIQUE(conversation_id, version)` constraint and handle the conflict on retry.
- **Blocking the stream on save failure:** If `saveEstimate` throws, catching and logging (never re-throwing) ensures the AI response reaches the user even if DB is down.
- **Fetching estimate list in `loadConversation`:** The version history is lazy-loaded on sheet open (D-08). Do not add estimates to `loadConversation` — it would increase cold-start latency for every chat page load.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sheet/drawer UI | Custom sliding panel with CSS transitions | shadcn/ui `Sheet` component | Handles focus trap, keyboard nav, aria-modal, scroll lock |
| Relative time formatting | Custom "2 hours ago" logic | `Intl.RelativeTimeFormat` | Already in `project-list.tsx`, same API, handles ES/EN locale |
| Optimistic label editing | Manual state + setTimeout rollback | `useOptimistic` + `useTransition` | Already proven in `project-list.tsx`; React 19 built-in |
| Delta color classes | Conditional inline styles | Tailwind `text-green-400` / `text-red-400` | Consistent with existing color token patterns |

**Key insight:** Every UI pattern needed for this phase is already implemented elsewhere in the codebase. The labeling UX mirrors `project-list.tsx` line-for-line. The Sheet is the only new component primitive.

---

## Common Pitfalls

### Pitfall 1: Tool Execute Has No Supabase Client
**What goes wrong:** `createClient()` inside `execute` fails at runtime with "cookies() was called outside a request scope" because the AI SDK streaming loop may invoke tool execute in a context where `next/headers` is not available after the response stream starts.
**Why it happens:** Next.js `cookies()` (used by `@supabase/ssr`) reads request cookies from the current async context. Once `result.toUIMessageStreamResponse()` starts streaming, the original request context may no longer be active for async calls within tool execute.
**How to avoid:** Pass a pre-created Supabase client (created before `streamText` is called) as a callback to `createChatTools`. This is the pattern already used in `saveConversation` — the route handler creates `supabase` once and passes it down.
**Warning signs:** `Error: cookies() was called outside a request scope` in Vercel logs during estimate tool calls.

### Pitfall 2: MAX(version) + 1 Returns null on First Estimate
**What goes wrong:** `SELECT MAX(version)` on an empty table returns `null`, not 0. If the code does `maxRow.version + 1` without null-guard, the insert gets `null + 1 = null` or a type error.
**Why it happens:** PostgreSQL aggregate `MAX()` on an empty set returns NULL. Supabase returns `null` in the JS data object.
**How to avoid:** `const nextVersion = (maxRow?.version ?? 0) + 1;` — the `?? 0` handles the empty-table case.
**Warning signs:** First estimate for a new project has `version = null` in the DB.

### Pitfall 3: CostBreakdown Re-render Drops Version Metadata
**What goes wrong:** When the assistant streams a second `runEstimate` result, `chat-content.tsx` re-renders `CostBreakdown` using only the raw `Estimate` type (which has no `_persistedId`). The version badge shows stale data or nothing.
**Why it happens:** `renderToolResult` casts `output` to `Estimate` — if `_persistedId` and `_version` are tacked onto the result as non-typed fields, TypeScript strips them or they're ignored.
**How to avoid:** Define a `EstimateToolResult` type that extends `Estimate` with optional `_persistedId: string` and `_version: number`. Update `renderToolResult` to pass these to `CostBreakdown`.
**Warning signs:** Version badge always shows "v? of ?" or the "Version N saved" banner never appears.

### Pitfall 4: Sheet Opens Before conversationId Is Resolved
**What goes wrong:** `VersionHistorySheet` renders before the conversation row exists (new chat, no messages yet). `listEstimatesAction(conversationId)` called with `undefined` or an empty string returns an error or crashes.
**Why it happens:** For a brand-new chat, the conversation row is created by `saveConversation` in `onFinish` — which fires after the first assistant response. Before that, `conversationId` may not exist.
**How to avoid:** Make `conversationId` prop optional in `VersionHistorySheet`. Only render the version badge + trigger once `_persistedId` is present in the tool result (i.e., at least one estimate has been persisted).
**Warning signs:** Console errors on new chats before any estimate is created.

### Pitfall 5: getConversationId Requires an Extra Round-Trip
**What goes wrong:** The chat route needs the `conversation_id` UUID to pass to `createChatTools`, but `conversations` is only identified by `project_id` in the request body. An extra `SELECT id FROM conversations WHERE project_id = $1` query adds latency to every chat request.
**Why it happens:** The route only receives `projectId`, not `conversationId`.
**How to avoid:** The query is a simple indexed lookup (index on `project_id` exists via the unique constraint). It adds ~2ms. Accept this cost. Alternatively, return `conversationId` from `loadConversation` and pass it to the client, which then includes it in the request body — but that adds client-side complexity for minimal gain.
**Warning signs:** Measurable latency increase on chat response start. (Acceptable at current scale.)

---

## Code Examples

Verified patterns from existing codebase:

### Supabase Mock Pattern (for tests)
```typescript
// Source: src/lib/db/__tests__/conversations.test.ts
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));
// Chain: mockFrom("estimates").select(...).eq(...).order(...).limit(1).single()
```

### useOptimistic for Inline Label Edit (copy from project-list.tsx)
```typescript
// Source: src/app/projects/project-list.tsx
const [optimisticVersions, updateOptimistic] = useOptimistic(
  versions,
  (state, { id, label }: { id: string; label: string }) =>
    state.map((v) => (v.id === id ? { ...v, label } : v)),
);
```

### Server Action Pattern (copy from src/lib/actions/projects.ts)
```typescript
"use server";
// Validate UUID, trim input, call Supabase, revalidatePath on success
export async function updateEstimateLabelAction(
  estimateId: string,
  label: string,
): Promise<{ error?: string }>
```

### formatARS (reuse from cost-breakdown.tsx)
```typescript
// Source: src/components/cost-breakdown.tsx
function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}
```
Delta column: prefix with `+` when positive, `-` when negative (JS Math.abs + sign check).

### formatRelativeTime (reuse from project-list.tsx)
```typescript
// Source: src/app/projects/project-list.tsx
function formatRelativeTime(dateStr: string, locale: string): string
// Already handles ES/EN, days/weeks/months
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate shadcn/ui install for Sheet | `npx shadcn@latest add sheet` | shadcn v4 CLI | Sheet component copies into `src/components/ui/sheet.tsx` |
| `useOptimistic` was an experimental API | Stable in React 19 | React 19 GA | No `experimental_` prefix needed |

**Note on Sheet vs custom drawer:** The CONTEXT.md specifies "no shadcn/ui — project uses custom components." If `shadcn/ui Sheet` has not been added yet, the planner must include a task to either add it via CLI or implement a custom accessible drawer. Check `src/components/ui/` for existing Sheet before planning.

---

## Open Questions

1. **Does `src/components/ui/sheet.tsx` already exist?**
   - What we know: The project uses custom components and avoids shadcn/ui per CONTEXT.md specifics ("glass-card backgrounds, zinc tokens, no shadcn/ui")
   - What's unclear: Whether a Sheet/drawer primitive exists anywhere in the codebase
   - Recommendation: Planner should check `src/components/ui/` before deciding to add via CLI or build a minimal custom sheet. If it does not exist, add one task in Wave 0 to scaffold it (`npx shadcn@latest add sheet` then adapt tokens).

2. **Does the `conversations` table have an index queryable by `conversation_id` for estimates?**
   - What we know: `estimates` has `conversation_id` FK. `conversations` has `project_id` unique index. No index on `estimates.conversation_id` is defined in the migration.
   - What's unclear: Supabase/Postgres creates an implicit index on FK columns in some configurations, but this is not guaranteed.
   - Recommendation: Add `CREATE INDEX idx_estimates_conversation_id ON estimates(conversation_id);` in a new migration (Wave 0). At low row counts the missing index is harmless, but adding it is correct practice.

3. **What does `_persistedId` and `_version` in the tool result mean for `initialMessages` serialization?**
   - What we know: `saveConversation` stores the full `messages` array as JSONB including tool result parts. The extra fields on `Estimate` will be stored and round-tripped through JSONB.
   - What's unclear: Whether the `useChat` `initialMessages` round-trip correctly preserves extra fields on tool output objects.
   - Recommendation: Keep extra fields prefixed with `_` to signal they are non-schema and ignore them gracefully in `CostBreakdown` if missing (optional chaining). No test breakage expected since `conversations.test.ts` uses `expect.any(Array)` for messages.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/db/__tests__/estimates.test.ts src/lib/actions/__tests__/estimates.test.ts src/lib/estimate/__tests__/compare.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VERS-01 | `saveEstimate()` inserts new row, returns `{ id, version }` | unit | `npx vitest run src/lib/db/__tests__/estimates.test.ts` | Wave 0 |
| VERS-01 | `saveEstimate()` auto-increments version: MAX(version)+1 | unit | same | Wave 0 |
| VERS-01 | `saveEstimate()` handles first estimate (MAX returns null) | unit | same | Wave 0 |
| VERS-01 | `runEstimate` tool execute calls `saveEstimate` without blocking result | unit | `npx vitest run src/lib/ai/__tests__/tools.test.ts` | Wave 0 (extend existing) |
| VERS-02 | `listEstimates()` returns versions ordered newest-first | unit | `npx vitest run src/lib/db/__tests__/estimates.test.ts` | Wave 0 |
| VERS-02 | `listEstimatesAction()` server action returns summary array | unit | `npx vitest run src/lib/actions/__tests__/estimates.test.ts` | Wave 0 |
| VERS-03 | `compareEstimates(a, b)` computes correct per-category delta | unit | `npx vitest run src/lib/estimate/__tests__/compare.test.ts` | Wave 0 |
| VERS-03 | Comparison correctly handles missing categories in one version | unit | same | Wave 0 |
| VERS-04 | `updateEstimateLabelAction()` trims, validates, calls revalidatePath | unit | `npx vitest run src/lib/actions/__tests__/estimates.test.ts` | Wave 0 |
| VERS-04 | `updateEstimateLabelAction()` returns `{ error }` for invalid UUID | unit | same | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/db/__tests__/estimates.test.ts src/lib/actions/__tests__/estimates.test.ts src/lib/estimate/__tests__/compare.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/db/__tests__/estimates.test.ts` — covers VERS-01, VERS-02 DB layer
- [ ] `src/lib/actions/__tests__/estimates.test.ts` — covers VERS-02, VERS-04 server actions
- [ ] `src/lib/estimate/__tests__/compare.test.ts` — covers VERS-03 pure comparison logic
- [ ] Check `src/components/ui/sheet.tsx` — if missing, add via CLI: `npx shadcn@latest add sheet`
- [ ] New migration: `supabase/migrations/0003_estimates_conversation_index.sql` — index on `estimates.conversation_id`

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `supabase/migrations/0001_initial_schema.sql` — `estimates` table schema, RLS policies
- Direct source read: `src/lib/ai/tools.ts` — `runEstimate` execute structure, `createChatTools` signature
- Direct source read: `src/app/api/chat/route.ts` — `createChatTools` call site, `supabase` client lifetime
- Direct source read: `src/lib/db/conversations.ts` — DB function patterns, `SupabaseServerClient` usage
- Direct source read: `src/lib/actions/projects.ts` — server action pattern with validation + `revalidatePath`
- Direct source read: `src/components/cost-breakdown.tsx` — existing component structure, `formatARS`, props shape
- Direct source read: `src/app/projects/project-list.tsx` — `useOptimistic` + `useTransition` inline rename pattern
- Direct source read: `src/app/chat/[id]/chat-content.tsx` — tool result rendering, `CostBreakdown` mount

### Secondary (MEDIUM confidence)
- Inference from Supabase JS SDK behavior: `MAX()` on empty set returns null row — standard PostgreSQL/Supabase behavior, consistent with how `maxRow?.version ?? 0` guard is used in similar patterns

### Tertiary (LOW confidence)
- `cookies()` async context safety in AI SDK streaming tool execute: inferred from Next.js App Router request context documentation and existing `saveConversation` pattern — should be validated with a smoke test in Wave 1.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already in project
- Architecture: HIGH — all patterns derived directly from existing codebase files
- Pitfalls: HIGH — derived from actual code reading, not hypothesis
- DB schema: HIGH — read directly from migration files

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable codebase; extends as long as migration files don't change)
