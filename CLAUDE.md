<!-- GSD:project-start source:PROJECT.md -->
## Project

**ArquiCost — AI Construction Cost Estimator**

An AI-powered chatbot that helps consumers and architects/engineers estimate construction costs in Buenos Aires (AMBA region). Users describe their project through conversation and upload floor plans. The app collects structured data progressively, analyzes uploaded plans with vision AI, and outputs a detailed cost breakdown with price per square meter and total construction price based on a 21-category Argentine construction budget (presupuesto de obra).

**Core Value:** Accurate, transparent construction cost estimation through natural conversation — the user gets a detailed price breakdown they can trust, without needing to know construction terminology or fill out complex forms.

### Constraints

- **Timeline**: ~24 hours hackathon — must prioritize ruthlessly
- **Tech stack**: Next.js App Router on Vercel, AI SDK v6, Claude via AI Gateway
- **Pricing data**: Hardcoded reference table for AMBA (team is still defining exact values)
- **Categories table**: Team is finalizing the options/criteria for each category (will be plugged in)
- **Floor plan accuracy**: Limited to LLM vision capabilities (~approximate, not pixel-perfect)
- **Language**: App should work in Spanish (primary) and English; all docs in English
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
## Rationale
### Next.js 16.x
- **Turbopack is now the default bundler**: dev-server cold starts are 2-5x faster than Next.js 15 with webpack — directly improves the 24h hackathon iteration speed.
- **Predictable caching**: Next.js 15 had implicit caching that caused surprising stale data bugs. In v16, all routes are dynamic by default; you opt into caching with `"use cache"`. For a chatbot with real-time streaming responses, dynamic-by-default is exactly right.
- **React 19.2 + React Compiler**: eliminates the need to manually scatter `useMemo`/`useCallback`. Less boilerplate = faster feature shipping.
- **No significant breaking changes from Next.js 15**: codemods handle the migration; starting fresh on v16 avoids future upgrade debt.
### AI SDK v6 (`ai` + `@ai-sdk/react`)
- **Tool calling + structured output in one pass**: Previously you had to chain `generateText` and `generateObject`. v6 unifies them with `generateText({ output: schema })` after a tool-calling loop — critical for collecting the 14 base measurements progressively then outputting a fully-typed cost estimate.
- **`useChat` with file attachments**: Pass a `FileList` as `attachments` to `sendMessage({ text, attachments })` — the SDK converts files into data URLs automatically and sends them to the model. This is the simplest path for floor plan upload + Claude vision.
- **Zod v4 native support**: `zodSchema()` wraps Zod v4 schemas directly. No adapter layer needed.
- **AI Elements integration**: AI Elements components are designed specifically for the AI SDK v6 hook API — they bind to `useChat` internally.
- **`@ai-sdk/react` version 3.0.x** is the package that ships the `useChat` hook in v6. It is a separate package from `ai` core to keep the server bundle lean.
### Vercel AI Gateway (`@ai-sdk/gateway`)
- **OIDC auth on Vercel**: When deployed to Vercel, the gateway authenticates via OIDC tokens — no API key to manage in environment variables during the hackathon.
- **Provider abstraction**: If Claude vision proves insufficient during the hackathon, swapping to GPT-5.4 or Gemini vision is a one-line change (`gateway("openai/gpt-5.4")` vs `gateway("anthropic/claude-sonnet-4.6")`).
- **Built-in observability**: Usage, latency, and cost tracking come for free in the Vercel dashboard.
- **Latency**: Gateway routing adds <20ms overhead — negligible for a chatbot.
### Zod v4
- **14x faster string parsing** and **7x faster object parsing** vs v3 — meaningful when validating large budget structures with 80+ line items.
- **Built-in `.toJSONSchema()`**: Eliminates the `zod-to-json-schema` dependency if the system prompt needs a JSON Schema representation of the budget categories.
- **AI SDK native**: AI SDK v6 supports Zod v4 directly; no extra adapter.
- **`zod/mini`** sub-package (~10KB gzipped) is available if bundle size becomes a concern on client components.
### shadcn/ui + Tailwind CSS v4
- **Copy-paste architecture**: Components live in your repo. In a 24h hackathon you will need to modify them — shadcn/ui gives you that without fighting a third-party API.
- **Tailwind v4**: CSS-first config (no `tailwind.config.ts`), Lightning CSS engine, incremental builds 100x faster. shadcn/ui v4 CLI scaffolds Tailwind v4 automatically.
- **AI Elements companion**: AI Elements is built on shadcn/ui primitives. Having both ensures visual consistency without extra design work.
### AI Elements
- **`MessageThread`**: Renders a conversation with proper streaming, tool call states, and markdown — replaces ~300 lines of custom rendering code.
- **`PromptInput`**: Textarea with attachment button, send button, and keyboard shortcuts — replaces custom chat input.
- **`ReasoningPanel`**: Shows Claude's reasoning traces if extended thinking is enabled.
- **`ResponseActions`**: Copy, regenerate, thumbs up/down actions on messages.
### Vitest
- **Important caveat**: Vitest does NOT support async Server Components. Test your async RSCs with Playwright (E2E), not Vitest.
- **What to test with Vitest**: The calculation engine (pure functions, no React), Zod schemas, utility functions. This is the highest-value test coverage for a construction cost estimator — the math must be correct.
- **What to test with Playwright** (if time allows): Full chat flow, file upload flow, cost breakdown rendering.
### react-hook-form + @hookform/resolvers
- Controlled form state without re-renders on every keystroke.
- `@hookform/resolvers/zod` connects directly to the same Zod schemas used for AI tool validation — single source of truth for the data model.
- Lightweight: 24KB gzipped.
### File Upload (built-in AI SDK, no UploadThing)
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
## Open Questions
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
