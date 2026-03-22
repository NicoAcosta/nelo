# Phase 13: Shareable Links and Floor Plan Storage - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can send a read-only estimate link to a client or colleague who can view the full cost breakdown without needing an account. Floor plan images move from base64 in-memory to Supabase Storage for persistent, efficient storage.

</domain>

<decisions>
## Implementation Decisions

### Share link creation flow
- **D-01:** Wire the existing topbar share button (`estimate-topbar.tsx` placeholder) to open a Popover with share options — replaces the current "copy page URL" behavior
- **D-02:** Popover flow: "Create shareable link" button + expiration select → calls `createShareLinkAction` → shows `/share/{token}` URL with "Copy" button + checkmark confirmation
- **D-03:** Expiration picker is a simple select with presets: "No expiration" (default), "7 days", "30 days", "90 days" — no custom date picker
- **D-04:** If a share link already exists for this estimate version, the popover shows it directly (no duplicates) — one link per estimate version
- **D-05:** Token generated via `nanoid` (already in deps) — short, URL-safe
- **D-06:** Popover also shows "Revoke link" (small destructive text button) when a link exists — deletes the share_links row

### Public share page (`/share/[token]`)
- **D-07:** Server Component at `/share/[token]` — calls `get_share_link(token)` security-definer function (already exists in migration 0003), loads the estimate, renders read-only CostBreakdown
- **D-08:** Minimal branded header: Nelo logo + "Estimate shared via Nelo" subtitle
- **D-09:** Shows: full 26-category cost breakdown, summary cards (price/m2, total), confidence badge, version label — same data the owner sees
- **D-10:** Does NOT show: version history, chat messages, recalculate button, floor plan images — just the estimate snapshot
- **D-11:** Footer: small "Powered by Nelo — Get your own estimate" link pointing to `/` (marketing CTA, non-intrusive)
- **D-12:** Expired state: clean page with Nelo logo + "This estimate link has expired. Ask the owner for a new link."
- **D-13:** Not-found state: same layout with "Estimate not found"
- **D-14:** No authentication required — `/share/**` already excluded from proxy.ts auth middleware (Phase 9 D-14/D-38)

### Floor plan storage
- **D-15:** Forward-only migration — new uploads saved to Supabase Storage from this phase onward. No retroactive migration of existing base64 data in messages.
- **D-16:** Upload path convention: `floor-plans/{user_id}/{project_id}/{nanoid}.{ext}` — bucket and RLS policies already provisioned (migration 0001)
- **D-17:** `/api/documents/process` route saves file to Storage and returns a storage path alongside the base64 data URL (base64 still needed for AI vision analysis in the same request)
- **D-18:** Messages store the storage path reference. `stripBase64Attachments()` continues to clean base64 before DB save — messages now contain storage paths for later retrieval.
- **D-19:** Floor plan images in chat displayed via short-lived signed URLs (1 hour) generated server-side when loading conversation
- **D-20:** Floor plan images NOT shown on the public share page — avoids cross-user storage access complexity. Shared view is cost breakdown only.

### Link management
- **D-21:** No dedicated "Manage share links" page — creation, viewing, and revocation happen in the topbar share popover
- **D-22:** Popover shows link status: URL, expiry date (if set), "Copy" button, "Revoke link" button
- **D-23:** Expiration is soft — expired links stay in DB, share page shows expired message. No cron cleanup needed.
- **D-24:** Default expiration: none (no expiry). User opts into expiry via the select dropdown.

### Claude's Discretion
- Loading state for share page (skeleton or spinner)
- Exact popover layout and spacing
- Copy-to-clipboard animation/feedback style
- Error handling for failed link creation (should show inline error in popover)
- Whether to show "Share" button when estimate has no persisted ID yet (likely hide it)

</decisions>

<specifics>
## Specific Ideas

- The share popover should feel lightweight — not a modal. Similar to GitHub's "Share" popover on repos.
- The public share page should look professional enough that a user would share it with a client — clean typography, no rough edges.
- "Powered by Nelo" footer link should be subtle (small text, muted color) — the estimate is the focus, not the marketing.
- Revoke link should have a confirmation (small "Are you sure?" inline, not a dialog).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database schema
- `supabase/migrations/0001_initial_schema.sql` — `share_links` table definition, `floor-plans` bucket, RLS policies
- `supabase/migrations/0003_postgres_audit_fixes.sql` — `get_share_link(token)` security-definer function, RLS audit fixes, storage policies

### Estimate data layer
- `src/lib/db/estimates.ts` — `saveEstimate`, `getEstimate`, `listEstimates`, `updateEstimateLabel` functions
- `src/lib/actions/estimates.ts` — Server action patterns for estimate operations
- `src/lib/estimate/types.ts` — `Estimate` interface (the result shape rendered on share page)

### Existing share infrastructure
- `src/components/estimate/estimate-topbar.tsx` — Placeholder share button (lines 45-50, currently copies URL to clipboard)
- `src/proxy.ts` — Auth middleware already excludes `/share/**` from protection

### UI components to reuse
- `src/components/cost-breakdown.tsx` — Main estimate display (render in read-only mode on share page)
- `src/components/estimate/summary-cards.tsx` — Summary cards component
- `src/components/estimate/nelo-footer.tsx` — Footer component
- `src/components/estimate/estimate-topbar.tsx` — Topbar to modify for share popover

### Floor plan processing
- `src/app/api/documents/process/route.ts` — File upload endpoint (add Storage save)
- `src/lib/documents/processor.ts` — Document processing pipeline (returns base64 data URL)
- `src/lib/db/conversations.ts` — `stripBase64Attachments()` utility, `saveConversation` / `loadConversation`

### Patterns to follow
- `src/lib/actions/projects.ts` — Server action pattern (UUID validation, error returns, revalidatePath)
- `src/components/version-history-sheet.tsx` — Sheet/popover component pattern with lazy data fetching

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CostBreakdown` component: Already renders the full estimate — share page can use it in read-only mode (hide version badge, history trigger, action buttons)
- `SummaryCards` component: Reusable on share page for price/m2 and total display
- `NeloFooter` component: Reusable on share page
- `estimate-topbar.tsx`: Already has share button with clipboard logic — extend with Popover
- `get_share_link(token)` DB function: Security-definer function already handles anonymous access safely
- `nanoid`: Already in package.json dependencies
- `stripBase64Attachments()`: Continues to work for cleaning messages

### Established Patterns
- Server actions in `src/lib/actions/` with `"use server"` directive
- DB functions in `src/lib/db/` as plain async functions accepting optional `SupabaseServerClient`
- `revalidatePath` after mutations
- RLS-based access control (no explicit user_id filters)
- Popover from shadcn/ui available in project

### Integration Points
- `estimate-topbar.tsx` share button → replace clipboard copy with Popover + link creation
- `/api/documents/process` route → add Supabase Storage upload step
- `loadConversation` → generate signed URLs for floor plan storage paths in messages
- New `/share/[token]` route → Server Component calling `get_share_link` + rendering CostBreakdown

</code_context>

<deferred>
## Deferred Ideas

- Floor plan images on shared pages — add later with signed URL pass-through if client presentations need it
- Bulk share link management page — not needed until users have many shared estimates
- Share link analytics (view count, last accessed) — future enhancement
- Social media preview / OG image for share links — nice-to-have for future milestone
- Retroactive migration of existing base64 floor plans to Storage — only if storage savings justify the effort
- QR code generation for share links — print-friendly sharing, defer

</deferred>

---

*Phase: 13-shareable-links-floor-plan-storage*
*Context gathered: 2026-03-22*
