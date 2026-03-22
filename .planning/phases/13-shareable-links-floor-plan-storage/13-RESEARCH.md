# Phase 13: Shareable Links and Floor Plan Storage - Research

**Researched:** 2026-03-22
**Domain:** Supabase Storage, share link generation, public read-only pages, Next.js Server Components
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Share link creation flow**
- D-01: Wire the existing topbar share button (`estimate-topbar.tsx` placeholder) to open a Popover with share options — replaces the current "copy page URL" behavior
- D-02: Popover flow: "Create shareable link" button + expiration select → calls `createShareLinkAction` → shows `/share/{token}` URL with "Copy" button + checkmark confirmation
- D-03: Expiration picker is a simple select with presets: "No expiration" (default), "7 days", "30 days", "90 days" — no custom date picker
- D-04: If a share link already exists for this estimate version, the popover shows it directly (no duplicates) — one link per estimate version
- D-05: Token generated via `nanoid` (already in deps) — short, URL-safe
- D-06: Popover also shows "Revoke link" (small destructive text button) when a link exists — deletes the share_links row

**Public share page (`/share/[token]`)**
- D-07: Server Component at `/share/[token]` — calls `get_share_link(token)` security-definer function (already exists in migration 0003), loads the estimate, renders read-only CostBreakdown
- D-08: Minimal branded header: Nelo logo + "Estimate shared via Nelo" subtitle
- D-09: Shows: full 26-category cost breakdown, summary cards (price/m2, total), confidence badge, version label — same data the owner sees
- D-10: Does NOT show: version history, chat messages, recalculate button, floor plan images — just the estimate snapshot
- D-11: Footer: small "Powered by Nelo — Get your own estimate" link pointing to `/` (marketing CTA, non-intrusive)
- D-12: Expired state: clean page with Nelo logo + "This estimate link has expired. Ask the owner for a new link."
- D-13: Not-found state: same layout with "Estimate not found"
- D-14: No authentication required — `/share/**` already excluded from proxy.ts auth middleware (Phase 9 D-14/D-38)

**Floor plan storage**
- D-15: Forward-only migration — new uploads saved to Supabase Storage from this phase onward. No retroactive migration of existing base64 data in messages.
- D-16: Upload path convention: `floor-plans/{user_id}/{project_id}/{nanoid}.{ext}` — bucket and RLS policies already provisioned (migration 0001)
- D-17: `/api/documents/process` route saves file to Storage and returns a storage path alongside the base64 data URL (base64 still needed for AI vision analysis in the same request)
- D-18: Messages store the storage path reference. `stripBase64Attachments()` continues to clean base64 before DB save — messages now contain storage paths for later retrieval.
- D-19: Floor plan images in chat displayed via short-lived signed URLs (1 hour) generated server-side when loading conversation
- D-20: Floor plan images NOT shown on the public share page — avoids cross-user storage access complexity. Shared view is cost breakdown only.

**Link management**
- D-21: No dedicated "Manage share links" page — creation, viewing, and revocation happen in the topbar share popover
- D-22: Popover shows link status: URL, expiry date (if set), "Copy" button, "Revoke link" button
- D-23: Expiration is soft — expired links stay in DB, share page shows expired message. No cron cleanup needed.
- D-24: Default expiration: none (no expiry). User opts into expiry via the select dropdown.

### Claude's Discretion
- Loading state for share page (skeleton or spinner)
- Exact popover layout and spacing
- Copy-to-clipboard animation/feedback style
- Error handling for failed link creation (should show inline error in popover)
- Whether to show "Share" button when estimate has no persisted ID yet (likely hide it)

### Deferred Ideas (OUT OF SCOPE)
- Floor plan images on shared pages — add later with signed URL pass-through if client presentations need it
- Bulk share link management page — not needed until users have many shared estimates
- Share link analytics (view count, last accessed) — future enhancement
- Social media preview / OG image for share links — nice-to-have for future milestone
- Retroactive migration of existing base64 floor plans to Storage — only if storage savings justify the effort
- QR code generation for share links — print-friendly sharing, defer
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHARE-01 | User can generate a shareable link for any estimate (public read-only, nanoid token) | D-01 through D-06 cover link creation; `share_links` table + `get_share_link()` function already exist in DB; `createShareLinkAction` pattern follows established server action conventions |
| SHARE-02 | Shared links support optional expiration dates | D-03 and D-24 define expiry presets; `expires_at` column already in `share_links` table; `get_share_link()` already filters by `expires_at > now()` |
| SHARE-03 | Floor plan images stored in Supabase Storage (replaces base64 in-memory) | D-15 through D-19 define the forward-only migration; `floor-plans` bucket + RLS policies already provisioned; `supabase.storage.from('floor-plans').upload()` and `.createSignedUrl()` are the correct API methods |
</phase_requirements>

---

## Summary

Phase 13 delivers three tightly related features: shareable read-only estimate links, optional expiry for those links, and Supabase Storage persistence for floor plan images. All three rely heavily on infrastructure already provisioned in previous phases — the `share_links` table, `get_share_link()` security-definer function, the `floor-plans` storage bucket, and the `/share/**` auth-middleware exclusion are all live and tested. The primary implementation work is wiring up the UI (share popover in the topbar), the new `/share/[token]` page, the server actions for CRUD on `share_links`, and the Storage upload step in the document processing route.

The `CostBreakdown`, `SummaryCards`, and `NeloFooter` components are already built and reusable on the share page. The `estimate-topbar.tsx` share button already exists as a placeholder. The DB layer (`getEstimate`) is ready. The main new code is: `createShareLinkAction`, `getShareLinkAction`, `deleteShareLinkAction` (server actions); `getShareLink()` DB function caller; the Storage upload logic in `/api/documents/process`; the signed URL generator in `loadConversation`; and the public `/app/share/[token]/page.tsx` route.

One important gap: `nanoid` is listed as "already in deps" in the CONTEXT.md decisions, but it is NOT present in `package.json`. It must be added (`npm install nanoid`). Node's built-in `crypto.randomUUID()` is an acceptable fallback (already available in Node 16+), but `nanoid` produces shorter, URL-safe tokens. The plan should include adding `nanoid` as a first task.

**Primary recommendation:** Split into two plans — Plan 13-01 for the server layer (DB functions, server actions, Storage integration) and Plan 13-02 for the UI layer (share popover, `/share/[token]` page). This mirrors the established pattern from Phase 12.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `^2.99.3` (installed) | Storage upload, createSignedUrl, `rpc()` for security-definer function | Already used throughout project; confirmed `upload` and `createSignedUrl` methods present |
| `@supabase/ssr` | `^0.9.0` (installed) | Server-side Supabase client factory | Established pattern via `createClient()` from `@/lib/supabase/server` |
| `nanoid` | `^5.x` (NOT YET INSTALLED) | Short URL-safe token generation for share links | Listed in CLAUDE.md recommended stack; shorter tokens than UUID; URL-safe alphabet |
| Next.js App Router | `16.2.1` | Server Components for `/share/[token]`, Server Actions for share CRUD | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vercel/blob` | `^0.27.3` (installed) | Already in deps — NOT used for floor plans | Floor plans go to Supabase Storage (same platform, RLS policies already set up); Blob would bypass RLS |
| Node.js `crypto` | built-in | Fallback for token generation if nanoid install is blocked | Prefer nanoid per D-05 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `nanoid` for token | `crypto.randomUUID()` | UUID is 36 chars vs ~21 for nanoid; both are URL-safe; UUID is always available without install |
| Supabase Storage for floor plans | `@vercel/blob` | Blob bypasses Supabase RLS; Storage keeps files under same auth/policy umbrella as DB data |

**Installation (nanoid only — not yet in package.json):**
```bash
npm install nanoid
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── share/
│       └── [token]/
│           └── page.tsx          # Public Server Component — calls get_share_link RPC
├── lib/
│   ├── actions/
│   │   └── share-links.ts        # createShareLinkAction, getShareLinkAction, deleteShareLinkAction
│   ├── db/
│   │   └── share-links.ts        # DB layer — getShareLink(), createShareLink(), deleteShareLink()
│   └── documents/
│       └── processor.ts          # No change to signature; route.ts adds Storage step
├── components/
│   └── estimate/
│       └── share-popover.tsx     # New: Popover UI, wires to actions
```

### Pattern 1: Security-Definer Function for Anonymous Share Access

The DB already has `get_share_link(token TEXT)` as a `SECURITY DEFINER` function with `GRANT EXECUTE TO anon`. This is the correct pattern for allowing unauthenticated access to a specific record without exposing the full table to anonymous enumeration.

**How to call it from a Server Component (uses service role or anon key):**
```typescript
// src/lib/db/share-links.ts
import { createClient } from "@/lib/supabase/server";

export interface ShareLinkRow {
  id: string;
  estimate_id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
}

export async function getShareLink(token: string): Promise<ShareLinkRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_share_link", { share_token: token });
  if (error || !data || data.length === 0) return null;
  return data[0] as ShareLinkRow;
}
```

**Critical note:** The `/share/[token]` page is a Server Component. It calls `createClient()` which uses the anon key. The `get_share_link` function has `GRANT EXECUTE TO anon`, so this works without authentication.

### Pattern 2: Share Link CRUD Server Actions

Follow the pattern from `src/lib/actions/estimates.ts` exactly: UUID validation, try/catch, error returns, `revalidatePath`.

```typescript
// src/lib/actions/share-links.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ShareLinkResult {
  id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
}

// createShareLinkAction: creates or returns existing link for this estimate
export async function createShareLinkAction(
  estimateId: string,
  expiresInDays: number | null,
): Promise<ShareLinkResult | { error: string }> {
  if (!UUID_RE.test(estimateId)) return { error: "Invalid estimate ID" };
  const supabase = await createClient();

  // Check for existing link (D-04: no duplicates)
  const { data: existing } = await supabase
    .from("share_links")
    .select("id, token, expires_at, created_at")
    .eq("estimate_id", estimateId)
    .maybeSingle();

  if (existing) return existing as ShareLinkResult;

  const token = nanoid(12); // 12-char URL-safe token
  const expires_at = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("share_links")
    .insert({ estimate_id: estimateId, token, expires_at })
    .select("id, token, expires_at, created_at")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/chat");
  return data as ShareLinkResult;
}
```

### Pattern 3: Supabase Storage Upload in Document Processing Route

The Storage API is confirmed present: `upload()` and `createSignedUrl()`. The upload step is added inside `POST /api/documents/process` after processing, using the authenticated `user.id`.

```typescript
// Inside /api/documents/process/route.ts — after processDocument() returns
import { nanoid } from "nanoid";

// Storage upload (only for image/pdf — types that produce renderedImage)
const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
const storagePath = `floor-plans/${user.id}/${projectId}/${nanoid()}.${ext}`;

const { error: uploadError } = await supabase.storage
  .from("floor-plans")
  .upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

// storagePath returned alongside renderedImage (base64 still needed for AI vision)
```

**Caveat on `projectId`:** The `/api/documents/process` route currently does not receive a `projectId`. The route must be updated to accept `projectId` from the FormData (sent by the client) so it can construct the storage path per D-16. If `projectId` is not yet available (new chat), generate a temp path using `user.id/pending/` or skip storage (see Pitfall 3).

### Pattern 4: Signed URLs for Chat Display

When `loadConversation` loads messages, any message attachment with a `storagePath` field gets a 1-hour signed URL injected before returning:

```typescript
// In loadConversation() — after fetching messages
const signedMessages = await injectSignedUrls(supabase, messages);

async function injectSignedUrls(supabase, messages: UIMessage[]): Promise<UIMessage[]> {
  return Promise.all(messages.map(async (msg) => {
    if (!msg.experimental_attachments?.length) return msg;
    const updated = await Promise.all(
      msg.experimental_attachments.map(async (att) => {
        if (att.url === "[image-stripped]" && att.storagePath) {
          const { data } = await supabase.storage
            .from("floor-plans")
            .createSignedUrl(att.storagePath, 3600); // 1 hour
          return data ? { ...att, url: data.signedUrl } : att;
        }
        return att;
      })
    );
    return { ...msg, experimental_attachments: updated };
  }));
}
```

**Note:** The `experimental_attachments` type from AI SDK may not include `storagePath`. It will need to be stored in a separate place — either in the attachment object as a custom field (if the type allows it) or as a parallel structure in the message's `annotations` field. The planner must decide storage location for the path reference.

### Pattern 5: Public Share Page as Server Component

```typescript
// src/app/share/[token]/page.tsx
import { notFound } from "next/navigation";
import { getShareLink } from "@/lib/db/share-links";
import { getEstimate } from "@/lib/db/estimates";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await getShareLink(token);

  if (!link) notFound(); // handles both not-found and expired (get_share_link filters expired)

  const estimate = await getEstimate(link.estimate_id);
  if (!estimate) notFound();

  return <ShareView estimate={estimate.result} link={link} />;
}
```

The expired state requires a separate check: if the token exists but `expires_at < now()`, return an expired page. The current `get_share_link` function already filters out expired links (returns null). So "expired" and "not found" both result in `null` from `getShareLink()`. To distinguish them, a separate query is needed for the expired message (query `share_links` by token without the expiry filter). See Pitfall 1.

### Pattern 6: Popover Component (No shadcn/ui Popover installed)

The `src/components/ui/` directory currently only contains `sheet.tsx`. There is no `popover.tsx`. The share popover must either:

1. **Use shadcn/ui CLI to add the Popover component:** `npx shadcn@latest add popover` — this is the standard approach and installs Radix UI Popover under the hood.
2. **Build a lightweight custom popover** using a relative-positioned container with `useRef` + click-outside detection.

**Recommended: Use shadcn/ui CLI** (consistent with project conventions, Radix gives accessibility for free). The plan should include `npx shadcn@latest add popover` as a Wave 0 prerequisite step.

### Anti-Patterns to Avoid
- **Calling `getEstimate` with the RLS-blocked anon client:** The `/share/[token]` page is unauthenticated. `getEstimate()` from `src/lib/db/estimates.ts` uses RLS via `auth.uid()`. Calling it anonymously will return null because the estimate's owning user is not authenticated. The solution: call `get_share_link()` via RPC (which is SECURITY DEFINER and returns the `estimate_id`), then fetch the estimate using a **service-role client** or a second security-definer function. See Pitfall 2 for the full analysis.
- **Storing base64 in JSONB as a long-term strategy:** `stripBase64Attachments()` already prevents this. The Storage integration makes it permanent.
- **Generating share tokens with `Math.random()`:** Not cryptographically safe. Use `nanoid` or `crypto.randomUUID()`.
- **Showing the share button when `persistedId` is undefined:** The button should be hidden or disabled until the estimate has been saved to DB (D-02 flow requires a valid `estimate_id`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Anonymous access to estimate data | Custom "public" API endpoint with no auth | `get_share_link()` SECURITY DEFINER + service-role `getEstimate` | RLS complexity; enumeration attacks; the DB function already handles expiry checks atomically |
| Token generation | `Math.random()` hash | `nanoid(12)` | Cryptographic quality, URL-safe, shorter than UUID |
| Signed URL generation | Proxy endpoint that streams files | `supabase.storage.from('floor-plans').createSignedUrl(path, 3600)` | Built into Supabase, signed by JWT, no compute cost |
| Click-outside popover detection | Manual event listeners + refs | `shadcn/ui Popover` (Radix UI) | Focus trapping, keyboard nav, accessibility all handled |

---

## Common Pitfalls

### Pitfall 1: Distinguishing "expired" from "not found" on the share page

**What goes wrong:** `get_share_link()` returns null for both "token doesn't exist" and "token exists but expired". The D-12 decision requires showing a specific expired message, not a generic 404.

**Why it happens:** The security-definer function intentionally filters expired links (it's the correct security behavior — don't leak that a token existed). But UX requires distinguishing the two states.

**How to avoid:** Add a second query (or a separate DB function) that looks up the token without the expiry filter, used only to determine if the "expired" message should show. This second query can use the anon role safely because it only returns `expires_at` (no sensitive data). Alternative: `notFound()` for both cases (simpler, but doesn't satisfy D-12).

**Decision for planner:** Either add `get_share_link_status(token)` security-definer function that returns `{exists: boolean, expired: boolean}` (cleaner), or accept that 404 = "not found or expired" (simpler, misses D-12). Based on D-12 being a locked decision, the planner should include the status function or a direct `share_links` query (filtered by token only, no expiry check) using the service-role key.

**Warning signs:** If the expired page never shows and all expired links show 404 — this pitfall occurred.

### Pitfall 2: RLS blocks `getEstimate` on unauthenticated share page

**What goes wrong:** The `/share/[token]` Server Component calls `getEstimate(link.estimate_id)` using the standard `createClient()` (anon key + no cookie). The `estimates` RLS policy requires `auth.uid()` to match the project owner. With no authenticated user, RLS returns 0 rows → `getEstimate` returns null → share page shows 404 even for valid links.

**Why it happens:** `createClient()` uses `@supabase/ssr` which reads cookies for auth. The share page visitor has no auth cookie, so they are anon. Anon cannot read estimates via RLS.

**How to avoid:** Two options:
1. **Service-role client for the share page** — create a `createServiceClient()` in `src/lib/supabase/service.ts` using `SUPABASE_SERVICE_ROLE_KEY` (env var, server-only). Use it only after validating the token via `get_share_link()`.
2. **Security-definer function** — add `get_estimate_for_share(share_token)` that joins `share_links → estimates` in one SECURITY DEFINER query, eliminating the need for a service-role key on the client.

**Recommended:** Service-role client is simpler to implement and matches established Supabase patterns. The service key must never be exposed client-side.

**Warning signs:** Share page shows "Estimate not found" for a valid, non-expired share link.

### Pitfall 3: `projectId` not available at document upload time

**What goes wrong:** D-16 defines the path as `floor-plans/{user_id}/{project_id}/{nanoid}.{ext}`. But `/api/documents/process` is called from the chat interface, where a new project may not have been assigned a `projectId` yet (first message in a new chat).

**Why it happens:** Projects are created when the first conversation is started, but the document upload can happen before the project ID is confirmed client-side.

**How to avoid:** Require `projectId` as a required FormData field in the upload request. The chat client must send it. If a `projectId` is not yet available, generate a placeholder path `floor-plans/{user_id}/pending/{nanoid}.{ext}` and update the path after project creation. Alternatively, treat the project as always existing before upload (since the chat page always has a `chatId`/`projectId` from the URL).

**Check:** Look at how the chat page calls `/api/documents/process` — does it already send a `projectId`? If yes, this pitfall is moot. The planner should verify `src/app/chat/page.tsx` and any upload-triggering client code.

**Warning signs:** Files uploaded without a `projectId` get orphaned in `floor-plans/{user_id}/pending/` with no cleanup mechanism.

### Pitfall 4: `experimental_attachments` type mismatch for `storagePath`

**What goes wrong:** The AI SDK `UIMessage.experimental_attachments` type is `{ name?: string; url: string; contentType?: string }[]`. Adding a `storagePath` field requires either a type cast or a parallel storage mechanism.

**Why it happens:** The SDK type is narrow and not designed for custom fields.

**How to avoid:** Store the storage path in the message `annotations` array (which is `unknown[]` in the AI SDK type, i.e. arbitrary JSON). Structure as `{ type: "floor-plan-storage-path", name: string, path: string }`. The `stripBase64Attachments` function continues to clean the `url` field. `loadConversation` reads the annotations to resolve paths to signed URLs.

Alternative: Extend the attachment object with a non-standard field and cast to `unknown` — acceptable for a hackathon context, but less clean.

### Pitfall 5: `nanoid` is not in `package.json`

**What goes wrong:** The CONTEXT.md decisions state "Token generated via nanoid (already in deps)" but `nanoid` is NOT in `package.json`. Using `import { nanoid } from "nanoid"` will fail at build time.

**Why it happens:** The decision was made during discussion before verifying the actual deps.

**How to avoid:** The very first task in Plan 13-01 must be `npm install nanoid`. As a zero-install fallback, `crypto.randomUUID()` is available in Node 18+ and produces a UUID string (36 chars) that is URL-safe, or `crypto.getRandomValues` can produce a base62 token.

---

## Code Examples

### Supabase Storage: Upload file
```typescript
// Confirmed method signature from @supabase/supabase-js ^2.99.3
const { data, error } = await supabase.storage
  .from("floor-plans")
  .upload(storagePath, fileBuffer, {
    contentType: "image/png",
    upsert: false,
  });
// data: { path: string, id: string, fullPath: string } | null
// error: StorageError | null
```

### Supabase Storage: Create signed URL (1 hour)
```typescript
// Confirmed method signature from @supabase/supabase-js ^2.99.3
const { data, error } = await supabase.storage
  .from("floor-plans")
  .createSignedUrl(storagePath, 3600);
// data: { signedUrl: string } | null
```

### RPC call to security-definer function
```typescript
// Calls public.get_share_link(share_token) on the DB
const { data, error } = await supabase.rpc("get_share_link", {
  share_token: token,
});
// data is an array (TABLE return type) — access data[0]
```

### Service-role client (for share page estimate fetch)
```typescript
// src/lib/supabase/service.ts — NEW FILE
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _serviceClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createServiceClient() {
  if (_serviceClient) return _serviceClient;
  _serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
  );
  return _serviceClient;
}
```

### Adding shadcn/ui Popover
```bash
npx shadcn@latest add popover
# Installs: src/components/ui/popover.tsx
# Installs Radix UI peer: @radix-ui/react-popover
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Base64 floor plans in JSONB messages | Storage path reference + signed URLs | Phase 13 | Eliminates multi-MB JSONB rows; floor plans persist across sessions |
| Clipboard-copy of current page URL | Share popover with `/share/{token}` URL | Phase 13 | Proper public-read-only page; no auth required for recipient |

---

## Open Questions

1. **How to distinguish expired vs not-found on the share page**
   - What we know: `get_share_link()` returns null for both cases. D-12 requires a specific expired message.
   - What's unclear: Whether to add a `get_share_link_status()` DB function, use a service-role query, or accept a combined "not found or expired" 404.
   - Recommendation: Add a minimal `check_share_token(token)` SECURITY DEFINER function that returns `{exists: boolean, expired: boolean}`. This is a small new migration (0004 or appended to existing).

2. **Where to store `storagePath` in message attachments**
   - What we know: `experimental_attachments.url` gets stripped to `"[image-stripped]"`. The path needs to survive serialization.
   - What's unclear: Whether to use `annotations` array (supported but arbitrary JSON) vs custom attachment field.
   - Recommendation: Use `message.annotations` as `{ type: "floor-plan-ref", attachmentName: string, storagePath: string }[]`. Clean, typed, no SDK type conflict.

3. **Does the chat client send `projectId` to `/api/documents/process`?**
   - What we know: `src/app/chat/page.tsx` has a `chatId` param which corresponds to the project ID.
   - What's unclear: Whether the fetch call to `/api/documents/process` currently includes `projectId` in FormData.
   - Recommendation: Planner reads `src/app/chat/page.tsx` to verify before writing the upload route changes.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHARE-01 | `createShareLink()` DB function inserts row, returns token | unit | `npx vitest run src/lib/db/__tests__/share-links.test.ts -x` | ❌ Wave 0 |
| SHARE-01 | `createShareLinkAction` returns existing link for duplicate estimate_id (D-04) | unit | `npx vitest run src/lib/actions/__tests__/share-links.test.ts -x` | ❌ Wave 0 |
| SHARE-01 | `deleteShareLinkAction` removes the row | unit | same file | ❌ Wave 0 |
| SHARE-02 | `createShareLink()` sets `expires_at` correctly for 7/30/90 day presets | unit | `npx vitest run src/lib/db/__tests__/share-links.test.ts -x` | ❌ Wave 0 |
| SHARE-03 | Storage path construction follows `floor-plans/{uid}/{pid}/{nanoid}.{ext}` pattern | unit | `npx vitest run src/lib/documents/__tests__/storage-path.test.ts -x` | ❌ Wave 0 |
| SHARE-03 | `stripBase64Attachments` still strips base64 after storage integration | unit | existing or extended `src/lib/db/__tests__/conversations.test.ts` | ❌ Wave 0 |

Note: The `/share/[token]` page and share popover are UI components — test via Playwright smoke test (or manual verification during `/gsd:verify-work`). Vitest cannot test async Server Components.

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/db/__tests__/share-links.test.ts src/lib/actions/__tests__/share-links.test.ts -x`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/db/__tests__/share-links.test.ts` — covers SHARE-01 (createShareLink, deleteShareLink) and SHARE-02 (expires_at calculation)
- [ ] `src/lib/actions/__tests__/share-links.test.ts` — covers SHARE-01 duplicate prevention (D-04)
- [ ] `src/lib/documents/__tests__/storage-path.test.ts` — covers SHARE-03 path construction

---

## Sources

### Primary (HIGH confidence)
- Codebase read — `supabase/migrations/0001_initial_schema.sql` and `0003_postgres_audit_fixes.sql`: confirmed `share_links` table schema, `get_share_link()` function signature, `floor-plans` bucket, RLS policies
- Codebase read — `@supabase/supabase-js ^2.99.3` installed version: confirmed `upload`, `createSignedUrl`, `rpc` method names via runtime enumeration of `StorageFileApi.prototype`
- Codebase read — `src/proxy.ts`: confirmed `/share/**` is already excluded from auth middleware via regex `share/` in the matcher
- Codebase read — `package.json`: confirmed `nanoid` is NOT installed (CONTEXT.md was incorrect); `@vercel/blob ^0.27.3` IS installed but should not be used for floor plans

### Secondary (MEDIUM confidence)
- Codebase inspection — `src/lib/db/estimates.ts`, `src/lib/actions/estimates.ts`: established patterns for DB layer + server actions (optional SupabaseServerClient param, UUID_RE validation, try/catch error returns, revalidatePath)
- Codebase inspection — `src/components/ui/` only contains `sheet.tsx` — Popover component not installed, must be added via shadcn CLI

### Tertiary (LOW confidence)
- None — all critical claims verified from installed code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and runtime method enumeration
- Architecture: HIGH — all DB infrastructure confirmed from migration files; patterns confirmed from existing actions/db files
- Pitfalls: HIGH — RLS pitfall and nanoid gap verified from actual code; storage path issue derived from reading the route handler

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable infrastructure — Supabase Storage API changes infrequently)
