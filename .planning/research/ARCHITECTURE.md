# Nelo — System Architecture

*Research document for the hackathon build. Last updated: 2026-03-20.*

---

## 1. Component Overview

Five distinct layers with clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Chat UI Layer                          │  │
│  │  app/page.tsx  (useChat + AI Elements rendering)          │  │
│  │                                                           │  │
│  │  • Message list (text + tool-result parts)                │  │
│  │  • File upload input (floor plan images)                  │  │
│  │  • Confirmation widgets (floor plan data review)          │  │
│  │  • Cost breakdown display component                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────────┘
                        │  HTTP streaming  (toUIMessageStreamResponse)
                        │  POST /api/chat  { messages: UIMessage[] }
┌───────────────────────┼─────────────────────────────────────────┐
│                       │  SERVER (Next.js App Router)             │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AI Orchestration Layer                       │  │
│  │  app/api/chat/route.ts                                    │  │
│  │                                                           │  │
│  │  streamText({                                             │  │
│  │    model: claude-sonnet (via AI Gateway),                 │  │
│  │    system: buildSystemPrompt(categories),  ◄──────────┐  │  │
│  │    messages,                                           │  │  │
│  │    stopWhen: stepCountIs(20),                          │  │  │
│  │    tools: { collectProjectData,                        │  │  │
│  │             analyzeFloorPlan,                          │  │  │
│  │             confirmFloorPlanData,                      │  │  │
│  │             computeEstimate }                          │  │  │
│  │  })                                                    │  │  │
│  └──────┬──────────┬──────────────┬────────────────────┘  │  │
│         │          │              │                         │  │
│         ▼          ▼              ▼                         │  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐   │  │
│  │  Vision  │ │  Data    │ │   Calculation Engine      │   │  │
│  │ Analysis │ │ Collect  │ │   lib/estimate/           │   │  │
│  │  Tool    │ │  Tools   │ │                           │   │  │
│  │          │ │          │ │  deriveQuantities()        │   │  │
│  │ Claude   │ │  Zod     │ │  applyUnitCosts()          │   │  │
│  │ vision   │ │ schemas  │ │  sumByCategory()           │   │  │
│  │ call     │ │ validate │ │  computeConfidence()       │   │  │
│  └──────────┘ └──────────┘ └──────────────────────────┘   │  │
│                                          ▲                  │  │
│                                          │                  │  │
│  ┌───────────────────────────────────────┴────────────────┐ │  │
│  │              Pricing Data Layer                         │ │  │
│  │  lib/pricing/                                           │ │  │
│  │                                                         │ │  │
│  │  AMBA_UNIT_COSTS   (hardcoded, swap-in later)           │ │  │
│  │  CATEGORIES_CONFIG (21 categories + line items)         ├─┘  │
│  │  buildSystemPrompt(categories) → string                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Boundaries

### 2.1 Chat UI Layer (`app/page.tsx`, `components/`)

**Responsibility**: Render conversation, handle user input, display results.

**Uses**: `useChat` from `@ai-sdk/react`, `DefaultChatTransport`, `UIMessage` parts.

**What it knows**:
- Message history (text parts, tool result parts)
- Current streaming status
- Tool invocation state (`input-available` vs `output-available`)

**What it does NOT know**:
- How calculations are performed
- What categories exist
- Model selection

**Key behaviors**:
- Renders `tool-confirmFloorPlanData` parts as an editable form widget
- Renders `tool-computeEstimate` output-available parts as a cost breakdown table
- Attaches floor plan images as `FileUIPart` before sending messages
- Sends `{ parts: [{ type: 'text', text }, ...fileParts] }` via `sendMessage()`

### 2.2 AI Orchestration Layer (`app/api/chat/route.ts`)

**Responsibility**: Run the conversation loop; define all tools; build system prompt.

**Uses**: `streamText`, `tool`, `stepCountIs`, `convertToModelMessages` from `ai`.

**What it knows**:
- Tool definitions and their Zod input schemas
- System prompt template + categories config
- When to stop (stepCountIs cap)

**What it does NOT know**:
- UI rendering details
- How to derive m2 quantities from base measurements (delegated to engine)

**Pattern**: Single POST handler. All state lives in the `messages` array passed back and forth — the full conversation history is the state store. Tool results accumulate as message parts.

### 2.3 Calculation Engine (`lib/estimate/`)

**Responsibility**: Pure functions that turn collected measurements into a priced budget.

**Files**:
- `derive-quantities.ts` — maps 14 base measurements → ~80 line-item quantities
- `apply-unit-costs.ts` — multiplies quantities × unit prices from pricing layer
- `sum-by-category.ts` — aggregates into 21-category totals
- `compute-confidence.ts` — scores completeness of inputs (quick/standard/detailed)
- `types.ts` — `ProjectInputs`, `LineItem`, `CategoryTotal`, `Estimate` types

**Contract**: All functions are pure. No I/O. No AI SDK imports. Testable in isolation.

**Input** (`ProjectInputs`):
```typescript
{
  totalFloorArea: number,       // m2
  buildingFootprint: number,    // m2
  perimeter: number,            // ml
  stories: number,
  ceilingHeight: number,        // m
  doorCount: number,
  doorTypes: DoorType[],
  windowCount: number,
  windowTypes: WindowType[],
  bathroomCount: number,
  kitchenCount: number,
  hasAzotea: boolean,
  hasGas: boolean,
  energySavingOptions: string[],
  userMode: 'consumer' | 'professional',
}
```

**Output** (`Estimate`):
```typescript
{
  categories: CategoryTotal[],  // 21 categories with subtotals
  totalCost: number,            // ARS
  costPerM2: number,            // ARS/m2
  confidence: 'quick' | 'standard' | 'detailed',
  lineItems: LineItem[],        // full ~80-item breakdown
}
```

### 2.4 Pricing Data Layer (`lib/pricing/`)

**Responsibility**: Reference data for AMBA unit costs and category definitions.

**Files**:
- `amba-unit-costs.ts` — hardcoded `Record<LineItemId, { unit, costARS }>` table
- `categories-config.ts` — 21 categories with display names, line item IDs, icons
- `system-prompt-builder.ts` — `buildSystemPrompt(categories, userMode)` → string

**Key design decision**: `categories-config.ts` is the single source of truth. The system prompt is dynamically built from it at request time, so the LLM's knowledge of what to ask always matches the calculation engine's expectations.

### 2.5 Floor Plan Analysis Pipeline

**Not a separate service** — implemented as the `analyzeFloorPlan` tool inside the route handler.

**Sequence**:
1. User message arrives with `FileUIPart` (image) + text
2. `streamText` sees the image part; Claude can invoke `analyzeFloorPlan`
3. Tool `execute()` calls `generateObject` (or `generateText`) with the image directly passed to the model — Claude vision extracts approximate measurements
4. Result is a `FloorPlanExtraction` object (partial `ProjectInputs`)
5. LLM then calls `confirmFloorPlanData` tool, rendering a confirmation widget to the user
6. User corrects values in the widget and re-submits
7. Confirmed data merges into the accumulated `ProjectInputs`

---

## 3. Data Flow

### 3.1 Conversational Data Collection

```
User types answer
       │
       ▼
useChat.sendMessage({ parts: [{ type: 'text', text }] })
       │
       ▼  POST /api/chat  { messages: UIMessage[] }
       │
       ▼
streamText sees full history → decides which tool to call next
       │
       ▼
tool: collectProjectData({ fieldName, value })
  └── execute() returns { collected: { [fieldName]: value } }
       │
       ▼  tool result appended to messages stream
       │
       ▼
LLM continues → asks next question OR calls computeEstimate
       │
       ▼
toUIMessageStreamResponse() → streamed back to client
       │
       ▼
useChat appends new assistant message parts to messages[]
(tool-result parts carry collected data for display)
```

**State note**: The `messages` array IS the state. Each tool call result is a message part in the history. The route re-receives all messages on each turn and the LLM has full context of everything collected so far. No separate server-side session store needed for MVP.

### 3.2 Floor Plan Analysis Flow

```
User uploads image + "here is my floor plan"
       │
       ▼
sendMessage({ parts: [{ type: 'text', text }, { type: 'file', mediaType: 'image/png', url: dataUrl }] })
       │
       ▼  POST /api/chat  (messages include file part)
       │
       ▼
streamText: Claude sees image in message history
       │
       ▼
Claude calls tool: analyzeFloorPlan({ imageIndex: 0 })
  └── execute():
        generateObject({
          model: claude-sonnet,
          schema: FloorPlanExtractionSchema,   // Zod
          messages: [{ role: 'user', content: [{ type: 'image', image: <url> }, { type: 'text', text: 'extract...' }] }]
        })
        → returns FloorPlanExtraction (partial ProjectInputs with confidence flags)
       │
       ▼
Claude calls tool: confirmFloorPlanData({ extraction })
  └── execute() returns extraction as-is (UI renders editable widget)
       │
       ▼
UI renders confirmation form (pre-filled with extracted values)
User reviews, corrects, submits
       │
       ▼
sendMessage({ parts: [{ type: 'text', text: 'confirmed, here are corrections: ...' }] })
       │
       ▼
Claude merges confirmed values, continues data collection for missing fields
```

### 3.3 Calculation Trigger Flow

```
LLM decides enough data is collected (or user requests estimate)
       │
       ▼
Claude calls tool: computeEstimate({ inputs: ProjectInputs })
  └── execute():
        quantities = deriveQuantities(inputs)
        lineItems  = applyUnitCosts(quantities, AMBA_UNIT_COSTS)
        categories = sumByCategory(lineItems)
        confidence = computeConfidence(inputs)
        return { categories, totalCost, costPerM2, confidence, lineItems }
       │
       ▼
Tool result streamed as message part: type: 'tool-computeEstimate', state: 'output-available'
       │
       ▼
UI renders cost breakdown table from tool output part
LLM generates summary text alongside the breakdown
```

### 3.4 System Prompt ← Categories Config

```
At request time (each POST /api/chat):

import { CATEGORIES_CONFIG } from '@/lib/pricing/categories-config'
import { buildSystemPrompt } from '@/lib/pricing/system-prompt-builder'

const system = buildSystemPrompt(CATEGORIES_CONFIG, userMode)

Resulting prompt includes:
- Role: Argentine construction cost estimator
- User mode instructions (consumer: 8 questions, professional: 15+)
- List of the 21 categories and what data each requires
- Instructions on when to call each tool
- Language instructions (respond in Spanish by default)
- Confidence guidance (flag when quick estimate vs. detailed)
```

---

## 4. AI SDK v6 Patterns Used

### 4.1 `streamText` + tools for progressive collection

The route handler uses a single `streamText` call with all tools available. The LLM decides the conversation flow — which field to ask about next, when to trigger floor plan analysis, when enough data exists to compute. `stopWhen: stepCountIs(20)` prevents infinite loops.

```typescript
// app/api/chat/route.ts
const result = streamText({
  model: anthropic('claude-sonnet-4-5'),
  system: buildSystemPrompt(CATEGORIES_CONFIG, userMode),
  messages: convertToModelMessages(messages),
  stopWhen: stepCountIs(20),
  tools: {
    collectProjectData,
    analyzeFloorPlan,
    confirmFloorPlanData,
    computeEstimate,
  },
});
return result.toUIMessageStreamResponse();
```

### 4.2 Tool definitions with Zod schemas

Each tool uses `z.object()` for `inputSchema`, giving the LLM a strict contract and giving us runtime validation for free.

```typescript
const collectProjectData = tool({
  description: 'Record a collected project measurement or choice',
  inputSchema: z.object({
    field: z.enum(['totalFloorArea', 'stories', 'bathroomCount', ...]),
    value: z.union([z.number(), z.string(), z.boolean()]),
  }),
  execute: async ({ field, value }) => ({ field, value, collected: true }),
});
```

### 4.3 Vision analysis as a tool

`analyzeFloorPlan` tool calls the model a second time (nested `generateObject`) with the image attached. The outer `streamText` passes the image URL from the message history into the inner call.

```typescript
const analyzeFloorPlan = tool({
  description: 'Analyze a floor plan image to extract approximate measurements',
  inputSchema: z.object({ imageUrl: z.string() }),
  execute: async ({ imageUrl }) => {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: FloorPlanExtractionSchema,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', image: imageUrl },
          { type: 'text', text: 'Extract room count, approximate floor area, door count, window count, and number of stories from this floor plan. Provide confidence level for each field.' },
        ],
      }],
    });
    return object;
  },
});
```

### 4.4 How tools feed into calculation

Tool results accumulate in the message history as `tool-result` parts. When the LLM calls `computeEstimate`, its `inputSchema` requires a complete `ProjectInputs` object. The LLM must synthesize this from the tool results visible in its context window — every `collectProjectData` result and every `confirmFloorPlanData` result is visible to the model when it assembles the final call.

This means: **no server-side accumulation state needed**. The full message history is the source of truth.

---

## 5. State Management

### 5.1 Where collected data lives

**During a session**: In the `messages` array managed by `useChat` on the client. Each round-trip sends the full history. Tool results (e.g., `{ field: 'totalFloorArea', value: 120 }`) are embedded as message parts.

**No database, no session store** for MVP. In-memory only — losing the tab loses the session. This is explicitly out of scope.

### 5.2 How tool results accumulate

```
Turn 1: user says "120 square meters"
  → Claude calls collectProjectData({ field: 'totalFloorArea', value: 120 })
  → messages now has assistant message with tool-result part

Turn 2: user says "two floors"
  → Claude sees prior tool results in history
  → Claude calls collectProjectData({ field: 'stories', value: 2 })
  → messages now has two tool-result parts across history

Turn N: Claude judges sufficient data
  → Claude assembles ProjectInputs from all tool results in context
  → Claude calls computeEstimate({ inputs: { totalFloorArea: 120, stories: 2, ... } })
  → Estimate streams back as tool output part
```

The LLM context window is effectively the working memory. The `messages` array is serialized to JSON and sent on every POST — this is stateless on the server.

### 5.3 Client-side display state

The `useChat` hook owns `messages`. Additional UI state (e.g., "is floor plan confirmation pending?") is derived by checking whether a `tool-confirmFloorPlanData` part with `state: 'output-available'` exists in the latest assistant message. No separate Zustand/Redux store needed.

---

## 6. Build Order

### Phase 1 — Foundation (must be first, no dependencies)

These can be built in parallel by different team members:

| Component | Owner | Output |
|-----------|-------|--------|
| `lib/pricing/categories-config.ts` | Data | 21-category config object |
| `lib/pricing/amba-unit-costs.ts` | Data | Unit cost table |
| `lib/estimate/types.ts` | Backend | TypeScript types for all data |

### Phase 2 — Core Engine (depends on Phase 1 types + pricing)

Parallel work:

| Component | Owner | Depends on |
|-----------|-------|------------|
| `lib/estimate/derive-quantities.ts` | Backend | `types.ts` |
| `lib/estimate/apply-unit-costs.ts` | Backend | `types.ts`, `amba-unit-costs.ts` |
| `lib/estimate/sum-by-category.ts` | Backend | `types.ts` |
| `lib/estimate/compute-confidence.ts` | Backend | `types.ts` |
| `lib/pricing/system-prompt-builder.ts` | Backend | `categories-config.ts` |

Write tests for all engine functions before implementing (pure functions = easy to test).

### Phase 3 — API Route (depends on Phase 1 + 2)

| Component | Owner | Depends on |
|-----------|-------|------------|
| Tool schemas (`tool-schemas.ts`) | Backend | `types.ts` |
| `app/api/chat/route.ts` | Backend | engine, tools, system-prompt-builder |

Integration point: The route wires all pieces together for the first time here.

### Phase 4 — UI (can start in parallel with Phase 2/3)

| Component | Owner | Depends on |
|-----------|-------|------------|
| Basic `useChat` chat shell | Frontend | None (mock API response) |
| Message rendering (text + tool parts) | Frontend | Tool schemas (for types) |
| Floor plan upload widget | Frontend | None |
| Confirmation form widget | Frontend | `FloorPlanExtraction` type |
| Cost breakdown display | Frontend | `Estimate` type |

Frontend can develop against a stub `/api/chat` that returns hardcoded tool results until Phase 3 is ready.

### Phase 5 — Integration + Polish (everything done)

- Wire real `/api/chat` to frontend
- End-to-end test: upload floor plan → confirm → get estimate
- Confidence indicator display
- Spanish/English language handling
- Error states (file too large, extraction failed)

### Dependency Graph

```
categories-config ──┐
amba-unit-costs ────┼──► types ──► derive-quantities ─┐
                    │          ──► apply-unit-costs   ─┼──► route.ts ──► UI
                    │          ──► sum-by-category    ─┤
                    └──► system-prompt-builder ────────┘
```

### Critical Path

```
types.ts → derive-quantities.ts → route.ts → end-to-end test
```

Bottleneck: The calculation engine (derive-quantities + apply-unit-costs) is the hardest logic and blocks the final integration. Prioritize this.

---

## 7. File Structure

```
arqui/
├── app/
│   ├── page.tsx                        # Chat UI (useChat)
│   ├── api/
│   │   └── chat/
│   │       └── route.ts                # streamText orchestration
│   └── components/
│       ├── ChatMessage.tsx             # Message + tool part renderer
│       ├── FloorPlanConfirmation.tsx   # Editable extraction review widget
│       └── CostBreakdown.tsx           # 21-category estimate display
├── lib/
│   ├── pricing/
│   │   ├── categories-config.ts        # Source of truth: 21 categories
│   │   ├── amba-unit-costs.ts          # Hardcoded AMBA prices
│   │   └── system-prompt-builder.ts    # Builds system prompt from config
│   └── estimate/
│       ├── types.ts                    # ProjectInputs, Estimate, etc.
│       ├── derive-quantities.ts        # 14 inputs → 80 line-item quantities
│       ├── apply-unit-costs.ts         # quantities × prices
│       ├── sum-by-category.ts          # aggregate to 21 categories
│       └── compute-confidence.ts       # quick/standard/detailed scoring
└── lib/
    └── tools/
        ├── collect-project-data.ts     # Tool: record one field
        ├── analyze-floor-plan.ts       # Tool: vision extraction
        ├── confirm-floor-plan-data.ts  # Tool: trigger confirmation UI
        └── compute-estimate.ts         # Tool: run calculation engine
```

---

## 8. Key Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| LLM assembles wrong `ProjectInputs` for `computeEstimate` | Zod schema validates on arrival; return error message for LLM to retry |
| Floor plan vision returns garbage | All fields optional with `null`; user sees confidence flags; UI prompts corrections |
| Message history grows too large (many tool calls) | Cap with `stopWhen: stepCountIs(20)`; prune old `collectProjectData` results if needed |
| Categories config not ready in time | Stub with 3–4 categories for demo; engine and prompt work the same |
| Unit costs not finalized | Use placeholder ARS values; display disclaimer; easy to swap |
| Two user modes complicate prompt | Build consumer mode first; add professional mode as a flag in `buildSystemPrompt` |

---

*This document should be read alongside PROJECT.md. Update at each significant architectural decision.*
