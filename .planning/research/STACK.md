# Stack Research

## Recommended Stack

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| next | ^16.2 | App Router framework, Vercel-native, Turbopack bundler | High |
| react | ^19.2 | Peer dep of Next.js 16; React Compiler built-in | High |
| ai | ^6.0 | Core AI SDK — streamText, generateText, tools, structured output | High |
| @ai-sdk/react | ^3.0 | useChat hook, attachment handling, tool rendering | High |
| @ai-sdk/gateway | included in `ai` | Vercel AI Gateway provider for Claude | High |
| @anthropic-ai/sdk | peer dep | Underlying Claude model driver (used internally by gateway) | High |
| zod | ^4.0 | Schema validation for tool inputs, structured output, form data | High |
| shadcn/ui (CLI v4) | latest | Copy-paste UI primitives — Button, Input, Card, Tabs, Badge | High |
| tailwindcss | ^4.1 | Utility CSS; CSS-first config in v4, ships with shadcn/ui | High |
| ai-elements | latest via npx | Pre-built chat components (MessageThread, PromptInput, etc.) built on shadcn/ui + AI SDK | High |
| typescript | ^5.x | Type safety across the whole stack | High |
| vitest | ^3.x | Unit test runner — replaces Jest for Vite-based projects | High |
| @testing-library/react | ^16.x | Component testing for Client Components | Medium |
| react-hook-form | ^7.x | Floor plan upload form + progressive data collection form state | Medium |
| @hookform/resolvers | ^3.x | Bridges react-hook-form with Zod v4 | Medium |
| nanoid | ^5.x | Unique IDs for generations, session tracking | Medium |

---

## Rationale

### Next.js 16.x

Next.js 16 is the recommended version as of March 2026. Key reasons for this project:

- **Turbopack is now the default bundler**: dev-server cold starts are 2-5x faster than Next.js 15 with webpack — directly improves the 24h hackathon iteration speed.
- **Predictable caching**: Next.js 15 had implicit caching that caused surprising stale data bugs. In v16, all routes are dynamic by default; you opt into caching with `"use cache"`. For a chatbot with real-time streaming responses, dynamic-by-default is exactly right.
- **React 19.2 + React Compiler**: eliminates the need to manually scatter `useMemo`/`useCallback`. Less boilerplate = faster feature shipping.
- **No significant breaking changes from Next.js 15**: codemods handle the migration; starting fresh on v16 avoids future upgrade debt.

Use `create-next-app@latest` which scaffolds v16 with App Router, Tailwind v4, and TypeScript pre-configured.

### AI SDK v6 (`ai` + `@ai-sdk/react`)

The project brief specifies AI SDK v6 explicitly. Key reasons it is the right choice:

- **Tool calling + structured output in one pass**: Previously you had to chain `generateText` and `generateObject`. v6 unifies them with `generateText({ output: schema })` after a tool-calling loop — critical for collecting the 14 base measurements progressively then outputting a fully-typed cost estimate.
- **`useChat` with file attachments**: Pass a `FileList` as `attachments` to `sendMessage({ text, attachments })` — the SDK converts files into data URLs automatically and sends them to the model. This is the simplest path for floor plan upload + Claude vision.
- **Zod v4 native support**: `zodSchema()` wraps Zod v4 schemas directly. No adapter layer needed.
- **AI Elements integration**: AI Elements components are designed specifically for the AI SDK v6 hook API — they bind to `useChat` internally.
- **`@ai-sdk/react` version 3.0.x** is the package that ships the `useChat` hook in v6. It is a separate package from `ai` core to keep the server bundle lean.

### Vercel AI Gateway (`@ai-sdk/gateway`)

The gateway provider is bundled inside the `ai` package as of v5.0.36+. Import via:

```ts
import { gateway } from "ai";
// or
import { gateway } from "@ai-sdk/gateway";
```

Reasons to use it over a direct `@ai-sdk/anthropic` provider:

- **OIDC auth on Vercel**: When deployed to Vercel, the gateway authenticates via OIDC tokens — no API key to manage in environment variables during the hackathon.
- **Provider abstraction**: If Claude vision proves insufficient during the hackathon, swapping to GPT-5.4 or Gemini vision is a one-line change (`gateway("openai/gpt-5.4")` vs `gateway("anthropic/claude-sonnet-4.6")`).
- **Built-in observability**: Usage, latency, and cost tracking come for free in the Vercel dashboard.
- **Latency**: Gateway routing adds <20ms overhead — negligible for a chatbot.

Model string to use: `gateway("anthropic/claude-sonnet-4.6")` for the main chat (good Spanish, strong tool-calling, vision-capable). Use `gateway("anthropic/claude-haiku-3.5")` for cheap internal classification calls if needed.

### Zod v4

Zod v4 was released August 2025 and is now the standard:

- **14x faster string parsing** and **7x faster object parsing** vs v3 — meaningful when validating large budget structures with 80+ line items.
- **Built-in `.toJSONSchema()`**: Eliminates the `zod-to-json-schema` dependency if the system prompt needs a JSON Schema representation of the budget categories.
- **AI SDK native**: AI SDK v6 supports Zod v4 directly; no extra adapter.
- **`zod/mini`** sub-package (~10KB gzipped) is available if bundle size becomes a concern on client components.

For this project, Zod schemas serve three roles: (1) validate AI tool call inputs, (2) type the calculation engine's inputs and outputs, (3) validate the floor plan upload form.

### shadcn/ui + Tailwind CSS v4

shadcn/ui CLI v4 (March 2026 release) is the current standard for Next.js 16 + React 19 + Tailwind v4 projects.

- **Copy-paste architecture**: Components live in your repo. In a 24h hackathon you will need to modify them — shadcn/ui gives you that without fighting a third-party API.
- **Tailwind v4**: CSS-first config (no `tailwind.config.ts`), Lightning CSS engine, incremental builds 100x faster. shadcn/ui v4 CLI scaffolds Tailwind v4 automatically.
- **AI Elements companion**: AI Elements is built on shadcn/ui primitives. Having both ensures visual consistency without extra design work.

Components you will definitely use: `Button`, `Input`, `Textarea`, `Card`, `Badge`, `Tabs`, `Separator`, `Skeleton` (for streaming loading states), `Progress` (confidence indicator), `Sheet` or `Dialog` (cost breakdown overlay).

### AI Elements

AI Elements (`npx ai-elements@latest`) is a component registry (not an npm package — components are installed into your `components/ai-elements/` directory) that provides:

- **`MessageThread`**: Renders a conversation with proper streaming, tool call states, and markdown — replaces ~300 lines of custom rendering code.
- **`PromptInput`**: Textarea with attachment button, send button, and keyboard shortcuts — replaces custom chat input.
- **`ReasoningPanel`**: Shows Claude's reasoning traces if extended thinking is enabled.
- **`ResponseActions`**: Copy, regenerate, thumbs up/down actions on messages.

For the hackathon, use AI Elements for the chat shell and write custom components for the cost breakdown display (it's domain-specific enough that AI Elements won't cover it).

Add via: `npx ai-elements@latest add message-thread prompt-input`.

### Vitest

Vitest is the standard test runner for Vite/Next.js projects as of 2026. Official Next.js docs recommend Vitest over Jest for App Router projects.

- **Important caveat**: Vitest does NOT support async Server Components. Test your async RSCs with Playwright (E2E), not Vitest.
- **What to test with Vitest**: The calculation engine (pure functions, no React), Zod schemas, utility functions. This is the highest-value test coverage for a construction cost estimator — the math must be correct.
- **What to test with Playwright** (if time allows): Full chat flow, file upload flow, cost breakdown rendering.

For the hackathon, focus Vitest on the calculation engine only. The 21-category budget math is the most error-prone and most important part of the app.

### react-hook-form + @hookform/resolvers

The progressive data collection flow (8-15 questions) has an intermediate confirmation step after floor plan analysis where the user corrects extracted data. This is a form, not a chat input. React Hook Form handles it well:

- Controlled form state without re-renders on every keystroke.
- `@hookform/resolvers/zod` connects directly to the same Zod schemas used for AI tool validation — single source of truth for the data model.
- Lightweight: 24KB gzipped.

If time is tight, this can be deprioritized — you could collect corrections through chat messages instead. But for the confirmation/correction flow it provides a much better UX.

### File Upload (built-in AI SDK, no UploadThing)

For the floor plan upload, use the native `useChat` attachment mechanism:

```ts
sendMessage({
  text: inputValue,
  attachments: files // FileList from <input type="file">
})
```

The AI SDK converts files to base64 data URLs and sends them as vision content to Claude automatically. No third-party upload service (UploadThing, Cloudinary) needed.

**Why avoid UploadThing for MVP**: It requires a separate file router API endpoint, additional environment variables, and introduces a third-party service dependency. For a hackathon where floor plans are ephemeral (no persistence), base64 data URLs are sufficient.

If you add persistence later, use Vercel Blob for image storage.

---

## Avoid

| Library | Why Not |
|---------|---------|
| **Jest** | Vitest is the current standard; Jest requires additional config for ESM and is slower. No reason to choose it for a greenfield project in 2026. |
| **tRPC** | Adds complexity (router, client, server setup) not justified for a 24h build. AI SDK route handlers + standard Next.js API routes are sufficient. |
| **Prisma / Drizzle** | No database needed for MVP — project explicitly scopes out persistence. Adding an ORM introduces migration complexity with zero benefit for the hackathon. |
| **Redux / Zustand** | Over-engineered state management for a single-session chatbot. React state + `useChat` hook state is sufficient. If global state is needed, React Context covers it. |
| **LangChain / LlamaIndex** | Heavy abstractions that obscure what's happening. AI SDK v6 has everything needed (tools, structured output, streaming) natively and is better integrated with Claude via AI Gateway. |
| **UploadThing / Cloudinary** | Third-party upload services add env vars, API endpoints, and billing setup. The native AI SDK attachment API (base64 data URLs) handles floor plan images sufficiently for a session-scoped MVP. |
| **next-auth / Auth.js** | Authentication is out of scope for the MVP. Don't add it during the hackathon. |
| **React Query / SWR** | No REST API data fetching needed. AI SDK `useChat` manages the streaming conversation state. Server Components handle any data loading. |
| **Direct `@ai-sdk/anthropic` provider** | Use AI Gateway instead. Direct Anthropic gives you no observability, no fallback, and requires managing an API key. Gateway is strictly better when deploying to Vercel. |
| **Zod v3** | Zod v4 is the current standard. AI SDK v6 supports it natively. No reason to use v3 on a greenfield project. |
| **CAD/DXF parsing libs** (dxf-parser, etc.) | Explicitly out of scope. Vision-only floor plan analysis is the correct approach for the hackathon. |
| **jsPDF / pdfmake** | PDF export is a nice-to-have explicitly out of scope. Do not add it during the hackathon. |

---

## Open Questions

1. **AI SDK v6 `experimental_attachments` stability**: The `experimental_` prefix indicates this API may change. As of v6.0.116 it remains experimental but is widely used in production. Verify the API signature in the current docs before wiring up the floor plan upload — the parameter may have been promoted to stable and renamed.

2. **Zod v4 + `@hookform/resolvers` compatibility**: `@hookform/resolvers` may not have full Zod v4 support in older minor versions. Pin to `@hookform/resolvers@^3.10` or later and verify with `zod@^4.0` at setup time. If there are issues, falling back to Zod v3 for form validation (while using v4 for AI SDK tools) is a viable workaround.

3. **AI Elements `MessageThread` customization for cost breakdown**: The cost breakdown is a structured table (21 categories, unit costs, totals). Determine early whether AI Elements `MessageThread` renders arbitrary React nodes in tool result slots, or whether you need to fall back to a custom message renderer for the cost output. Check the `toolResult` render prop in the component docs.

4. **Claude Sonnet 4.5 Spanish quality**: The project serves Argentine Spanish users. Claude's Spanish is strong but regional terminology for Argentine construction (revoques, contrapisos, azotea, medianera) should be tested early. If quality is insufficient, test with `claude-opus-4` via AI Gateway as a fallback.

5. **Next.js 16 + shadcn/ui CLI v4 setup friction**: `npx shadcn@latest init` (CLI v4) and `create-next-app@latest` should produce a compatible project, but verify the generated Tailwind config uses the CSS-first v4 format (no `tailwind.config.ts`). Some AI Elements components may assume Tailwind v3 class syntax if they haven't been updated — check at install time.

6. **Calculation engine architecture**: The 21-category budget is pure TypeScript (no library needed). Consider whether the engine lives in `lib/calculator/` as pure functions (best for Vitest coverage) or as an AI SDK tool (allows the LLM to invoke it). Recommended: pure functions testable by Vitest, wrapped in an AI SDK tool that calls them.
