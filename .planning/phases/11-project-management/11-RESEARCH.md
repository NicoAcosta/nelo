# Phase 11: Project Management - Research

**Researched:** 2026-03-22
**Domain:** Next.js App Router Server Components + Supabase Postgres + inline editing UX
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERS-03 | User sees a project list page (/projects) showing all past conversations | `listProjects()` query on `projects` table ordered by `updated_at DESC` — Server Component fetches and renders; placeholder page already exists at `src/app/projects/page.tsx` |
| PERS-04 | Projects get auto-generated titles from the first user message, editable later | Auto-title already fires in `saveConversation()` in `conversations.ts`; inline rename needs a new Server Action + optimistic UI via `useState` + `onBlur` |
</phase_requirements>

---

## Summary

Phase 11 builds on top of the fully wired persistence from Phase 10. The database already has everything needed: `projects` table with `title`, `updated_at`, and the `users_own_projects` RLS policy. The `saveConversation()` function in Phase 10 already auto-generates titles from the first user message (sets `title` from first user message when current title is still `"New Project"`). Phase 11 is therefore purely a UI and thin data-layer task.

The two deliverables are: (1) replace the placeholder `/projects` page with a real list view that queries and renders all the user's projects sorted by recency; and (2) add inline title editing so users can rename any project by clicking its title. Both deliverables are scoped to Server Component + Server Action patterns — no new packages, no new client state managers, no external services.

The inline rename is the trickiest part. The correct pattern for Next.js App Router is a Server Action that calls `supabase.from('projects').update(...)` directly, paired with optimistic UI (`useState` + `useOptimistic`) in a lightweight Client Component. The project list itself can stay a Server Component; only the title cell needs to be a Client Component to enable the click-to-edit interaction.

**Primary recommendation:** Add `listProjects()` to `src/lib/db/conversations.ts`, implement the projects page as a Server Component with a `ProjectList` Client Component for inline editing, and expose title updates via a Server Action — no API route needed.

---

## Standard Stack

No new packages required. Phase 11 uses exclusively what Phases 9 and 10 installed.

### Already Installed (Use These)
| Library | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.99.x | DB queries — `projects` table reads and updates |
| `@supabase/ssr` | ^0.8.1 | Cookie-based server client (same pattern as Phase 10) |
| `next` | ^16.2 | App Router, Server Components, Server Actions |
| `react` | ^19.2 | `useOptimistic` hook for immediate UI feedback on rename |
| `shadcn/ui` | latest CLI | Input, Button primitives for inline edit UX |
| `tailwindcss` | ^4.1 | Dark theme styling consistent with existing design |

### What NOT to Add
- No `react-query` / `SWR` — server data loaded via Server Component RSC, no client-side fetch loop needed
- No `react-hook-form` — single-field inline edit does not justify a form library
- No Supabase Realtime — out of scope per REQUIREMENTS.md; standard request/response is sufficient
- No separate API route for rename — Server Action is the correct Next.js App Router pattern

---

## Architecture Patterns

### Recommended File Structure (New + Modified Files Only)

```
src/
├── app/
│   └── projects/
│       ├── page.tsx              MODIFIED: replace placeholder with real list view (Server Component)
│       └── project-list.tsx      NEW: Client Component — renders list + inline edit interaction
│
└── lib/
    ├── db/
    │   └── conversations.ts      MODIFIED: add listProjects() function
    └── actions/
        └── projects.ts           NEW: Server Action — updateProjectTitle()
```

### Pattern 1: Server Component Fetches List, Client Component Renders It

**What:** `app/projects/page.tsx` remains a Server Component. It calls `listProjects(userId)` and passes the result as a prop to `<ProjectList projects={...} />` (Client Component). The Server Component handles auth + data; the Client Component handles interaction.

**When to use:** Whenever the data fetch is the right responsibility of the server (auth context, RLS, no real-time update needed) but the interaction requires client state (click-to-edit, optimistic update).

```typescript
// app/projects/page.tsx — Server Component (replaces placeholder)
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { ProjectList } from "./project-list";
import { listProjects } from "@/lib/db/conversations";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/projects");

  const projects = await listProjects(user.id);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-on-surface mb-8">Projects</h1>
        <ProjectList projects={projects} />
      </main>
    </div>
  );
}
```

### Pattern 2: listProjects() DB Function

**What:** A new function added to `src/lib/db/conversations.ts`. Queries the `projects` table ordered by `updated_at DESC`. Includes `id`, `title`, `created_at`, `updated_at`. RLS automatically scopes to the calling user.

```typescript
// src/lib/db/conversations.ts — addition
export type ProjectSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export async function listProjects(): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`listProjects failed: ${error.message}`);
  return data ?? [];
}
```

**Note:** No `userId` parameter is needed — `createClient()` uses the authenticated cookie session, and RLS policy `users_own_projects` enforces `auth.uid() = user_id` at the DB level. The function signature keeps it clean. This is consistent with the existing `loadConversation(_userId: string)` pattern (userId is implicit, kept for readability — but listProjects can omit it entirely since there's no FK to pass).

### Pattern 3: Server Action for Title Update

**What:** A Server Action in `src/lib/actions/projects.ts` that updates `projects.title` in Supabase. Server Actions in Next.js App Router run on the server, have access to cookies/session, and can be called directly from Client Components without a fetch/API route.

```typescript
// src/lib/actions/projects.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProjectTitle(
  projectId: string,
  newTitle: string,
): Promise<{ error?: string }> {
  const trimmed = newTitle.trim();
  if (!trimmed) return { error: "Title cannot be empty" };
  if (trimmed.length > 100) return { error: "Title too long" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ title: trimmed })
    .eq("id", projectId);

  if (error) return { error: error.message };

  // Revalidate so the Server Component re-fetches on next navigation
  revalidatePath("/projects");
  return {};
}
```

**Why Server Action instead of API route:** Server Actions eliminate the boilerplate of a `fetch('/api/...')` round-trip. They have direct access to cookies for auth. `revalidatePath('/projects')` invalidates the cached Server Component render so the next navigation shows fresh data. For a single-field update, this is the idiomatic Next.js 15/16 pattern.

### Pattern 4: Inline Edit with useOptimistic

**What:** The `<ProjectList>` Client Component renders a list of project rows. Each row has a title that is clickable. On click, the title becomes an `<input>`. On blur or Enter, the Server Action fires. `useOptimistic` provides immediate visual feedback while the server round-trip is in flight.

```typescript
// app/projects/project-list.tsx — Client Component
"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { updateProjectTitle } from "@/lib/actions/projects";
import type { ProjectSummary } from "@/lib/db/conversations";

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  const [optimisticProjects, updateOptimistic] = useOptimistic(
    projects,
    (state, { id, title }: { id: string; title: string }) =>
      state.map((p) => (p.id === id ? { ...p, title } : p)),
  );

  return (
    <ul className="space-y-2">
      {optimisticProjects.map((project) => (
        <ProjectRow
          key={project.id}
          project={project}
          onRename={(id, title) => updateOptimistic({ id, title })}
        />
      ))}
    </ul>
  );
}

function ProjectRow({
  project,
  onRename,
}: {
  project: ProjectSummary;
  onRename: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(project.title);
  const [, startTransition] = useTransition();

  function handleBlur() {
    setEditing(false);
    if (value.trim() === project.title) return;
    onRename(project.id, value.trim());
    startTransition(async () => {
      await updateProjectTitle(project.id, value.trim());
    });
  }

  return (
    <li className="flex items-center justify-between p-4 rounded-lg border border-outline/10 bg-white hover:bg-surface-container transition-colors group">
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            className="w-full text-sm font-medium text-on-surface bg-transparent border-b border-primary outline-none"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setValue(project.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-on-surface truncate text-left w-full hover:text-primary transition-colors"
            title="Click to rename"
          >
            {value}
          </button>
        )}
        <p className="text-xs text-on-surface/40 mt-0.5">
          {new Date(project.updated_at).toLocaleDateString()}
        </p>
      </div>
      <Link
        href={`/chat/${project.id}`}
        className="ml-4 px-4 py-1.5 text-xs font-bold text-primary border border-primary/30 rounded-full hover:bg-primary hover:text-on-primary transition-colors"
      >
        Open
      </Link>
    </li>
  );
}
```

**React 19 note (HIGH confidence):** `useOptimistic` is stable in React 19.2 (ships with Next.js 16). It was experimental in React 18. The API `useOptimistic(state, updateFn)` is confirmed in React docs. `useTransition` wrapping the Server Action call is the recommended pattern to avoid blocking the UI during the async operation.

### Pattern 5: Auto-Title (Already Implemented — Verify Only)

Auto-title generation is already wired in `saveConversation()` in Phase 10:

```typescript
// src/lib/db/conversations.ts (existing, verified)
if (firstUserMsg) {
  const titleText = getTextFromMessage(firstUserMsg).slice(0, 60);
  if (titleText) {
    await supabase
      .from("projects")
      .update({ title: titleText, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("title", "New Project"); // Only updates if still default
  }
}
```

Phase 11 does NOT need to re-implement this. The only PERS-04 work remaining is: (a) surface the auto-generated title in the project list (PERS-03 covers this), and (b) allow the user to edit the title inline (Pattern 4 above). The `updated_at` trigger already fires on `UPDATE` (migration `0001` sets `set_updated_at` trigger on `projects`), so `updated_at` will reflect renames correctly for sort order.

### Anti-Patterns to Avoid

- **Making ProjectList a Server Component:** The inline edit interaction requires `useState` and `useOptimistic`. The list component MUST be a Client Component. Only the page-level data fetch stays in the Server Component.
- **Calling `revalidatePath` without `"use server"`:** `revalidatePath` only works inside Server Actions or Route Handlers. Calling it in a Client Component throws a build error.
- **Fetching the project list inside the Client Component:** This would require `useEffect` + `fetch`, losing the server-side auth context and RLS guarantees. Keep the fetch in the Server Component and pass data as props.
- **Storing rename state in a global store (Zustand/Context):** This is a purely local interaction — one row at a time. `useState` inside `ProjectRow` is the correct scope.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth-scoped DB query | Custom auth middleware in DB layer | Supabase RLS (already enabled on `projects`) | `users_own_projects` policy enforces `auth.uid() = user_id` — no app-level filter needed |
| Server → Client data passing | `fetch()` from Client Component | RSC props from Server Component to Client Component | RSC props are zero-latency, typed, and auth-context-aware |
| Pessimistic rename UX (spinner) | Custom loading state | `useOptimistic` (React 19, zero deps) | Immediate visual feedback; reverts automatically on error |
| Invalidate cached page after rename | Manual cache busting | `revalidatePath('/projects')` in Server Action | One-line Next.js built-in; works with the dynamic-by-default routing in Next.js 16 |
| Empty state design | Custom empty illustration | Inline conditional render with a CTA link to `/chat` | Consistent with the existing simple design language of the app |

**Key insight:** The entire feature is plumbing between already-built pieces. No new library, no new schema, no complex state machine — just wiring `listProjects()` → Server Component → Client Component → Server Action.

---

## Schema Facts (Confirmed from Migration Files)

All tables and columns needed for Phase 11 exist in the current schema:

| Need | Schema Location | Status |
|------|----------------|--------|
| List user's projects | `projects` table, `user_id` indexed (`idx_projects_user_id`) | Exists |
| Sort by recency | `projects.updated_at`, trigger fires on UPDATE | Exists |
| Display title | `projects.title TEXT NOT NULL DEFAULT 'New Project'` | Exists |
| Display created date | `projects.created_at TIMESTAMPTZ` | Exists |
| Navigate to chat | `projects.id UUID` — used as `/chat/[id]` param | Exists (Phase 10 established this URL pattern) |
| Update title | `projects.update` via RLS `users_own_projects` FOR ALL | Exists |
| Unique index for upsert | `conversations_project_id_unique` (migration 0002) | Exists |

**No new migrations needed for Phase 11.** The schema is complete.

---

## Common Pitfalls

### Pitfall 1: `updateProjectTitle` Bypasses RLS If Called with Service Role
**What goes wrong:** If the Server Action uses `SUPABASE_SERVICE_ROLE_KEY` instead of the anon key + cookie session, RLS is bypassed entirely. Any user could rename any project by guessing a UUID.
**How to avoid:** Always call `createClient()` from `@/lib/supabase/server` (not a service-role client) in Server Actions. The cookie session scopes the `UPDATE` to the authenticated user's projects via the `users_own_projects` policy.
**Warning sign:** A test that renames a project with a different user's session succeeds when it should fail.

### Pitfall 2: `revalidatePath` Has No Effect in Next.js 16 Without Proper Cache Config
**What goes wrong:** Next.js 16 is dynamic-by-default for all routes. `revalidatePath('/projects')` may appear to do nothing because the route was never statically cached in the first place. This is actually fine — the page will re-fetch on the next navigation naturally. The call is harmless and future-proof if caching is ever opted into.
**How to avoid:** Don't add `export const revalidate = X` to the projects page. Dynamic-by-default is correct for auth-gated, user-specific data.
**Warning sign:** Developer adds `export const dynamic = 'force-static'` to the projects page — this is wrong and will cause a build error (Server Component with auth cookies cannot be statically generated).

### Pitfall 3: `useOptimistic` Update Not Matching Server State After Error
**What goes wrong:** `useOptimistic` applies the optimistic update immediately. If the Server Action returns an error, the optimistic state is NOT automatically reverted — the developer must handle the error case and reset the input value.
**How to avoid:** In the `handleBlur` / Server Action call path, check the return value. If `{ error }` is returned, reset `setValue(project.title)` to the original. Example:
```typescript
startTransition(async () => {
  const result = await updateProjectTitle(project.id, value.trim());
  if (result.error) setValue(project.title); // revert on error
});
```
**Warning sign:** User types a title that's too long (>100 chars), blur fires, the UI shows the truncated title briefly then snaps back — but without error handling, it stays on the invalid title.

### Pitfall 4: Clicking the Title Link Navigates Instead of Starting Edit
**What goes wrong:** If the title is rendered as an `<a>` or `<Link>` for accessibility, clicking it navigates to `/chat/[id]` instead of starting inline edit. The click target must be a `<button>` that toggles the edit state, separate from the "Open" navigation link.
**How to avoid:** Keep the title as a `<button onClick={() => setEditing(true)}>` and provide a separate "Open" `<Link href="/chat/[id]">` button. This is the pattern shown in Pattern 4 above.

### Pitfall 5: Empty State When User Has No Projects Yet
**What goes wrong:** New users arrive at `/projects` immediately after signing up (redirect from sign-in). The list is empty. Without an empty state, the page shows "Projects" heading and nothing else — looks broken.
**How to avoid:** Add an empty state branch:
```typescript
if (projects.length === 0) {
  return (
    <div className="text-center py-20">
      <p className="text-on-surface/40 mb-4">No projects yet.</p>
      <Link href="/chat" className="...">Start your first estimate</Link>
    </div>
  );
}
```

### Pitfall 6: Title Auto-Update Races with Manual Rename
**What goes wrong:** User sends their first message, `saveConversation()` fires `onFinish` and sets the title from the message text. Simultaneously, the user navigates to `/projects` and manually renames the project. The `onFinish` callback arrives late and overwrites the user's rename (because it checks `title = 'New Project'` — but if the user's rename hasn't hit the DB yet, the condition passes).
**How to avoid:** This is an acceptable race condition for v1.1. The auto-title only fires if `title = 'New Project'` (the `.eq("title", "New Project")` guard). A manual rename changes the title away from "New Project", so subsequent auto-title attempts are no-ops. The only losing case is if auto-title and manual rename arrive at the DB in the same millisecond — statistically negligible for a single-user app.

---

## Code Examples

### Supabase Query: List Projects Ordered by Recency
```typescript
// Source: existing conversations.ts pattern (verified against @supabase/supabase-js docs)
const { data, error } = await supabase
  .from("projects")
  .select("id, title, created_at, updated_at")
  .order("updated_at", { ascending: false });
```

### Server Action: Update Title
```typescript
// Source: Next.js App Router Server Actions pattern
// https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
"use server";
import { revalidatePath } from "next/cache";
```

### useOptimistic: React 19 Stable API
```typescript
// Source: React 19 docs — https://react.dev/reference/react/useOptimistic
const [optimisticState, addOptimistic] = useOptimistic(
  state,
  (currentState, optimisticValue) => { /* return new state */ }
);
```

### Relative Date Formatting (No Library Needed)
```typescript
// For "2 days ago" style display — Intl.RelativeTimeFormat is built into browsers
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const diffDays = Math.round((Date.now() - new Date(updated_at).getTime()) / 86400000);
const label = diffDays === 0 ? "Today" : rtf.format(-diffDays, "day");
```

---

## i18n Integration

Phase 11 adds new UI strings. Following the existing pattern in `src/lib/i18n/translations.ts`, new keys must be added to BOTH `en` and `es` objects in `translations.ts`, AND the TypeScript type must be updated in `types.ts` if `Translations` is typed as a strict record.

Current `Translations` type is `{ [key: string]: string }` (index signature), so no type changes needed — just add keys.

**New i18n keys needed for Phase 11:**

| Key | EN | ES |
|-----|----|----|
| `projects.title` | "Projects" | "Proyectos" |
| `projects.empty` | "No projects yet." | "Sin proyectos aun." |
| `projects.startFirst` | "Start your first estimate" | "Empeza tu primera estimacion" |
| `projects.open` | "Open" | "Abrir" |
| `projects.renameHint` | "Click to rename" | "Hacer click para renombrar" |
| `projects.lastUpdated` | "Updated" | "Actualizado" |
| `projects.titleTooLong` | "Title too long" | "Titulo demasiado largo" |
| `projects.titleEmpty` | "Title cannot be empty" | "El titulo no puede estar vacio" |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^3.x |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/lib/db/ src/lib/actions/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERS-03 | `listProjects()` returns array of `ProjectSummary` sorted by `updated_at DESC` | unit (mock Supabase) | `npx vitest run src/lib/db/__tests__/conversations.test.ts` | ✅ (extend existing file) |
| PERS-03 | `listProjects()` returns `[]` when user has no projects | unit | same file | ✅ (extend existing file) |
| PERS-04 | `updateProjectTitle()` Server Action calls supabase update with trimmed title | unit (mock Supabase) | `npx vitest run src/lib/actions/__tests__/projects.test.ts` | ❌ Wave 0 |
| PERS-04 | `updateProjectTitle()` returns `{ error }` for empty title | unit | same file | ❌ Wave 0 |
| PERS-04 | `updateProjectTitle()` returns `{ error }` for title > 100 chars | unit | same file | ❌ Wave 0 |
| PERS-04 | Auto-title: `saveConversation()` skips title update when title != 'New Project' | unit | `npx vitest run src/lib/db/__tests__/conversations.test.ts` | ✅ (extend existing file — currently untested path) |

**Manual-only scenarios:**
- Inline edit: click title, type, press Enter → title updates in list — requires browser interaction
- Navigate from project list to `/chat/[id]` — requires browser navigation
- Empty state appearance for new user — requires a fresh account

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/db/ src/lib/actions/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/actions/__tests__/projects.test.ts` — covers `updateProjectTitle` validation, Supabase update call, error return
- [ ] `src/lib/actions/` directory — does not exist yet, create with `__tests__/` subdirectory
- Extend `src/lib/db/__tests__/conversations.test.ts` — add `listProjects()` tests and the "skip auto-title when not default" edge case

*(Existing test infrastructure: `vitest.config.ts`, `src/test/setup.ts`, mock pattern for Supabase all present — no framework install needed)*

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| API route for mutations (`/api/projects/rename`) | Server Actions (`"use server"`) in Next.js App Router | No boilerplate fetch/response wiring; direct function call from Client Component; auth via cookie session |
| `useEffect` + `fetch` for client-side data refresh | `revalidatePath` in Server Action + RSC re-render | Next navigation triggers fresh Server Component render with updated data — no client state management |
| Controlled list re-render on optimistic update | `useOptimistic` (React 19 stable) | Zero-dep optimistic UI; automatically reconciles with server state |

---

## Open Questions

1. **Header `projectName` prop on the projects page**
   - What we know: `Header` accepts an optional `projectName` prop that renders a breadcrumb between the logo and the rest of the header. This is used on chat pages.
   - What's unclear: Should `/projects` pass `projectName="Projects"` to `<Header>`? Or leave it blank (just the Nelo logo)?
   - Recommendation: Leave `projectName` undefined on the projects page — the page already has its own `<h1>Projects</h1>`. The projectName prop is for the chat page context (Phase 10 likely sets this to the conversation title). Not a blocker.

2. **Sidebar `activeItem` on the projects page**
   - What we know: The `Sidebar` component accepts `activeItem?: NavItem` and highlights the active nav item. The sidebar currently shows "Estimates" linking to `/chat`. There's no "Projects" nav item.
   - What's unclear: Should the sidebar's "Estimates" item be updated to link to `/projects` instead of `/chat`? Or add a new nav item?
   - Recommendation: Update the `"estimates"` nav item `href` from `/chat` to `/projects` (the list is the natural entry point; creating a new chat still goes via the "New Estimate" button in the header). This is a one-line change to `sidebar.tsx`. Alternatively, keep as-is if the planner considers it out of scope for Phase 11.

3. **Truncation length for auto-generated titles**
   - What we know: `saveConversation()` slices the first user message to 60 characters for the title.
   - What's unclear: The inline rename validation in the Server Action uses 100 characters as the max. There's a minor inconsistency (auto-title max = 60, manual rename max = 100).
   - Recommendation: Accept the inconsistency — auto-titles are meant to be short identifiers; manual names can be longer. No action needed.

---

## Sources

### Primary (HIGH confidence)
- `/Users/nico/dev/arqui/src/lib/db/conversations.ts` — actual `saveConversation`, `loadConversation`, `getTextFromMessage` implementations from Phase 10
- `/Users/nico/dev/arqui/supabase/migrations/0001_initial_schema.sql` — confirmed `projects` schema: columns, RLS policy, `updated_at` trigger
- `/Users/nico/dev/arqui/supabase/migrations/0002_conversations_unique_project_id.sql` — confirms unique index already applied
- `/Users/nico/dev/arqui/src/app/projects/page.tsx` — placeholder page structure (Server Component, auth check, `<Header>`)
- `/Users/nico/dev/arqui/src/components/header.tsx` — `projectName` prop, `useAuth()`, styling patterns
- `/Users/nico/dev/arqui/src/components/sidebar.tsx` — nav item structure, activeItem pattern, i18n keys
- `/Users/nico/dev/arqui/src/lib/i18n/translations.ts` — all existing i18n keys (EN + ES), `Translations` type confirmed as index signature
- `/Users/nico/dev/arqui/src/lib/db/__tests__/conversations.test.ts` — confirmed Supabase mock pattern for new tests
- `.planning/phases/10-chat-persistence/10-RESEARCH.md` — Phase 10 architecture decisions, schema facts, DB layer patterns
- React 19.2 `useOptimistic` API — stable in React 19, ships with Next.js 16 (confirmed from React docs reference)

### Secondary (MEDIUM confidence)
- Next.js App Router Server Actions docs — `"use server"`, `revalidatePath`, calling Server Actions from Client Components

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all confirmed installed
- Architecture: HIGH — all patterns verified against actual codebase files and existing Phase 10 patterns
- Pitfalls: HIGH — discovered from reading actual code (RLS, useOptimistic revert, race condition analysis)
- i18n keys: HIGH — derived from existing translations.ts pattern, index signature type confirmed

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack; Next.js 16 Server Actions API is stable)
