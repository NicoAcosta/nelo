# Nelo — Common Pitfalls & Prevention Guide

Research-based guide covering the most common failure modes for AI chatbot + construction estimation projects, mapped to this project's specific context: Next.js App Router, AI SDK v6, Claude via AI Gateway, 24-hour hackathon, Argentine construction domain, Spanish-first UX.

---

## 1. AI / LLM Pitfalls

---

### 1.1 Tool Calling Reliability

**The problem**: Models sometimes skip tool calls entirely and answer in plain text, call the wrong tool, hallucinate tool arguments that don't match the Zod schema, or chain tool calls in an order the system didn't expect. In a data-collection chatbot like Nelo, a skipped tool call means the structured data never arrives — the calculation engine silently runs on incomplete input.

**Warning signs**:
- The model responds with a summary of what it "collected" rather than invoking a tool
- Zod validation throws at runtime because the model passed a string where a number was expected
- The conversation advances past a question but the corresponding field remains `undefined` in state
- The model calls `runCalculation` before all required fields are populated

**Prevention**:
- Keep each tool narrow and single-purpose. A `collectFloorArea` tool is more reliably called than a `collectProjectDetails` tool with 10 optional fields.
- Use `required` in tool descriptions and mark fields as non-optional in Zod schemas wherever truly needed. The model treats schema optionality as a hint that it can skip fields.
- Add a guard in the calculation engine: validate that all 14 base measurements have values before calling `runCalculation`. Return a structured error that tells the model which fields are still missing.
- In the system prompt, give a concrete example of when each tool should be called. Models follow examples more reliably than abstract rules.
- Log every tool call invocation server-side. During the demo, this is your first debugging signal.
- Test with `temperature: 0` for determinism during QA.

**Phase to address**: Architecture / system prompt design (before any UI work begins).

---

### 1.2 Vision Model Accuracy on Floor Plans

**The problem**: The project document already notes ~12% accuracy on precise measurements. The real pitfall is not the low accuracy itself — it's treating the vision output as ground truth and piping it directly into the calculation engine without user verification. A 2x error in floor area produces a 2x error in total cost.

**Warning signs**:
- Vision output feeds directly into calculations with no confirmation step
- The UI asks the user to "confirm" but pre-selects the AI's values so users just click through
- The extracted area is given in inconsistent units (sometimes m2, sometimes "approximately 80 square meters")
- Windows and doors are counted from interior decorations or furniture rather than actual openings

**Prevention**:
- The extraction prompt must request structured JSON with explicit uncertainty markers: `{ "total_area_m2": 85, "confidence": "low", "note": "irregular floor plan, east wing unclear" }`.
- Render an editable summary card after vision analysis. Every field must be editable. Pre-fill with the AI's values but make the edit affordance obvious, not a small pencil icon.
- Treat vision output as a convenience that saves the user from typing, not as a data source. The canonical values are always the confirmed user values.
- Separate the vision extraction prompt from the conversation system prompt. The extraction is a one-shot structured output call; keep it isolated.
- If the image is low-resolution, blurry, or a photo of a printed plan (common in Argentina), the model will still return numbers. Add a `"warning"` field to the extraction schema and surface it to the user.

**Phase to address**: Floor plan analysis implementation + confirmation flow UI.

---

### 1.3 System Prompt Length and Effectiveness

**The problem**: The Nelo system prompt must carry: role definition, conversation flow rules for two user modes (consumer/professional), tool invocation instructions for multiple tools, the 21-category budget structure, AMBA pricing context, and Spanish language instructions. That is a lot. Past roughly 2,000–3,000 tokens of dense instructions, models begin to weight earlier sections more heavily and silently ignore later ones.

**Warning signs**:
- The model ignores the professional mode branching logic (a lower section of the prompt)
- Tool invocation rules near the bottom of the prompt are frequently skipped
- The model stops asking follow-up questions mid-conversation
- Behavior is inconsistent across sessions with identical inputs

**Prevention**:
- Structure the prompt with the highest-priority instructions first: role → current mode → active tool → conversation rules. Categories and pricing data can be referenced later or injected dynamically.
- Do not embed the full 21-category table in the static system prompt. Build a `getCategoryContext(relevantCategories)` helper that injects only the relevant subset when the calculation step is reached. This is the "dynamic system prompt built from configurable categories" requirement — implement it as late injection, not front-loading.
- Use delimiters (`---`, XML tags like `<rules>`, `<mode>`) to give the model structural anchors. Claude responds better to tagged sections than to paragraphs.
- Measure prompt token count. Aim for under 1,500 tokens for the static portion; inject context dynamically.
- Run a prompt regression test: a fixed set of conversation turns with known expected tool calls. Catch regressions before the demo.

**Phase to address**: System prompt design (P0, before building conversation flow).

---

### 1.4 Spanish Language Tool Calling

**The problem**: LLM benchmarks for tool calling are overwhelmingly English-language. Claude performs well in Spanish conversationally, but tool calling in Spanish adds a layer of complexity: the model may translate field names before calling, misinterpret Spanish phrasing for numeric values ("ochenta y cinco metros cuadrados"), or fail to handle Argentine idioms ("PB + 2 pisos" for a 3-story building).

**Warning signs**:
- Numeric extraction fails on written-out numbers ("cien metros" → `null` instead of `100`)
- The model echoes the user's Spanish description in the tool call instead of the normalized value
- Regional abbreviations (PB = planta baja, PA = planta alta) are not recognized
- The model asks the same question twice because it didn't recognize the answer

**Prevention**:
- Write tool descriptions in English but accept Spanish input values. The model handles cross-lingual tool calling better than full-Spanish schemas.
- Add explicit synonym handling in the system prompt for Argentine construction vocabulary: PB = ground floor (story 0), PA/1P = first floor (story 1), etc.
- For numeric fields, specify in the schema description: `"Accept written Spanish numbers. Normalize to integer before calling."` This primes the model's behavior.
- Test with realistic Argentine user phrasing: "quiero construir una casa de PB y PA, más o menos 120 metros en total, en zona norte del conurbano."
- Have a Spanish-fluent team member do a dedicated QA pass on the conversation flow.

**Phase to address**: System prompt design + conversation flow QA.

---

### 1.5 Streaming + Tool Results Rendering

**The problem**: AI SDK v6 streaming with tool calls has a specific rendering challenge: the UI needs to handle intermediate states (streaming text → tool call pending → tool result → streaming resumes). If the component doesn't account for all states, the user sees blank space, duplicate messages, or the tool call JSON exposed raw in the chat.

**Warning signs**:
- A raw JSON object appears in the chat bubble during tool execution
- The chat scrolls to the bottom mid-stream and the user loses context
- Tool result data (e.g., extracted floor plan data) flickers in and out while the model continues generating
- The "thinking" indicator disappears before the model's follow-up text appears, creating a silent gap

**Prevention**:
- Use AI SDK's `useChat` with explicit `onToolCall` handling. Map each tool name to a dedicated result component (e.g., `FloorPlanConfirmation`, `CostBreakdownCard`).
- Never render `tool-call` message parts as text. Filter them explicitly: `if (part.type === 'tool-call') return <ToolCallIndicator />`.
- Test streaming with a slow network (Chrome DevTools throttling). Bugs that only appear during slow responses are common.
- Add a visible processing indicator that persists from first token to last. A simple "Nelo está calculando..." banner works.
- For the cost breakdown, do not stream the calculation results. Wait for the complete tool result, then render the full breakdown as a single non-streaming component. Partial cost tables confuse users.

**Phase to address**: Chat UI implementation.

---

### 1.6 Rate Limiting During Demos

**The problem**: Hackathon demos typically involve multiple judges running the app simultaneously, or a single judge reloading and trying again when something looks off. Claude via AI Gateway has rate limits. A rate limit error during a live demo is a hard stop.

**Warning signs**:
- 429 errors in console during parallel test sessions
- Demo environment shares API keys with development environment
- No retry logic in the API route

**Prevention**:
- Use a separate API key for the demo environment. Set it in Vercel environment variables under a production-only variable.
- Implement exponential backoff with 2 retries in the `/api/chat` route. AI SDK's `generateText` supports retry configuration.
- Prepare a "canned demo" fallback: a pre-generated conversation transcript that can be played back if the API is unavailable. This is not ideal but beats a blank screen in front of judges.
- In the hour before the demo, run through the complete flow 3 times to warm up any cold-start latency.
- Set `maxTokens` appropriately — don't let the model generate 4,000 tokens when 800 suffice. This reduces both latency and token consumption.

**Phase to address**: Deployment preparation (final phase before demo).

---

## 2. Construction Domain Pitfalls

---

### 2.1 Pricing Data Accuracy

**The problem**: Argentine construction pricing is volatile. Costs are denominated in USD (stable reference) but paid in ARS (fluctuating). Published reference prices go stale within months. Using stale data for an MVP is acceptable — but not disclosing it to users creates trust risk. Additionally, "AMBA" is large: construction costs in CABA differ from GBA norte, which differ from GBA sur.

**Warning signs**:
- Pricing data has no timestamp or source reference
- The code treats all AMBA zones identically
- Categories have wildly different unit costs with no sanity-check range
- Labor costs are priced in ARS without noting the exchange rate assumption

**Prevention**:
- Store all pricing data with a `lastUpdated` date and a `source` string (e.g., "UOCRA March 2026 reference", "INDEC construction cost index").
- Display a disclaimer on every estimate: "Precios de referencia AMBA, actualizados [fecha]. Los precios reales pueden variar según zona, materiales específicos y condiciones del mercado."
- Structure the pricing table as a config file (`/lib/pricing/amba-2026-q1.ts`) with a version in the filename. Easy to swap when data is refreshed.
- Define min/max sanity bounds per category. If a calculated line item falls outside the expected range, flag it as `"suspicious"` rather than silently returning the number.
- For the hackathon MVP: prioritize correctness of the 5 highest-cost categories (structure, masonry, electrical, plumbing, finishes) over completeness of lower-cost ones.

**Phase to address**: Pricing data setup (before calculation engine).

---

### 2.2 Unit Conversion Errors

**The problem**: The 21-category budget uses m2, m3, ml, GL, and U. Mixing these up produces errors that are off by the ceiling height (typically 2.6–3m). For example, calculating wall area in m3 instead of m2 inflates plastering costs by a factor of 2.7. These bugs are hard to catch visually because the total still looks like a plausible number.

**Warning signs**:
- Unit is stored as a string field and compared with `===` against hardcoded strings
- Wall area is derived from floor area (m2) without the perimeter × height calculation
- Linear meter items (skirting boards, gutters) are calculated in m2

**Prevention**:
- Define a TypeScript union type for units: `type Unit = 'm2' | 'm3' | 'ml' | 'gl' | 'u'`. Never use raw strings for units in calculation code.
- Write unit tests for every quantity derivation function before implementing. Cover the edge cases: single-story vs multi-story, irregular perimeters, zero bathrooms.
- Document the derivation formula for each line item as a comment in the code:
  ```ts
  // Wall area = perimeter (ml) × ceiling height (m) × stories
  // Subtract door area (doorCount × 0.9m × 2.1m) and window area (windowCount × 1.2m × 1.2m)
  const wallArea = (perimeter * ceilingHeight * stories) - (doorArea + windowArea);
  ```
- The calculation engine should log input units and output units for each step during development. Remove the logs for demo but keep the structure.

**Phase to address**: Calculation engine implementation (TDD required here).

---

### 2.3 Quantity Derivation Errors

**The problem**: The 14 base measurements underpin ~80 line items. A single wrong derivation (e.g., wall area) cascades into errors across plaster, paint, insulation, and cladding. The most common errors: forgetting to subtract door and window openings from wall area, using total floor area instead of footprint for foundation work, and forgetting to account for staircase area in multi-story buildings.

**Warning signs**:
- Wall finishing costs are implausibly high (likely forgot to subtract openings)
- Foundation cost equals exactly floor area × unit cost (forgot to use footprint only)
- Roofing cost for a 2-story building equals 2× that of a 1-story building (should be roughly the same footprint)
- Electrical and plumbing scale perfectly linearly with area (they don't — there are fixed costs per installation)

**Prevention**:
- Write a derivation spec before coding. For each of the 14 base measurements, document what it represents, how it is derived or collected, and which line items consume it.
- The wall area calculation is the most error-prone. Use this formula as the canonical reference:
  - `wallArea = (perimeter × ceilingHeight × stories) - (doors × 1.89m2) - (windows × 1.44m2)`
  - Standard Argentine door: 0.90m × 2.10m = 1.89m2
  - Standard Argentine window: 1.20m × 1.20m = 1.44m2
- Footprint vs. total area: footprint is the area of the ground floor only. For foundation, roofing, and earthwork, use footprint. For wall derivations, use perimeter. For floor finishes, use total area (all stories).
- Build a test case from a real Argentine construction budget (the team has one). Verify that the engine's output matches the known line items within ±10%.

**Phase to address**: Calculation engine implementation (P0, TDD).

---

### 2.4 Missing Categories in Estimation

**The problem**: Users consistently underestimate total construction cost because professional estimates include categories that non-experts don't think about: site preparation, earthwork, safety compliance (Seguridad e Higiene), environmental management (Plan de Gestión Ambiental), and the "miscellaneous" buffer (Varios). Omitting these can understate total cost by 10–20%.

**Warning signs**:
- The calculation engine skips GL (global/lump sum) categories because they're hard to parametrize
- Categories 20 (Seguridad e Higiene) and 21 (Plan de Gestión Ambiental) are commented out as "TODO"
- The total estimate matches what the user expects (which, for construction, usually means it's too low)

**Prevention**:
- GL categories should be estimated as a percentage of the subtotal of other categories. Industry standard: Seguridad e Higiene ≈ 1.5–2%, Plan de Gestión Ambiental ≈ 0.5–1%, Varios ≈ 3–5%.
- Show all 21 categories in the output, even if some are marked "included in total" or "regulatory minimum." Hiding categories reduces trust.
- Add a "contingency" line to the output UI: "Recomendamos presupuestar un 10–15% adicional para imprevistos." This is standard practice in Argentine construction.
- The professional mode should collect enough data to parametrize every category. Consumer mode can use percentage-based estimates for the 4–5 categories with insufficient data.

**Phase to address**: Calculation engine + output UI design.

---

### 2.5 Regional Pricing Assumptions

**The problem**: Even within AMBA, construction costs vary by zone. Labor costs in CABA are higher than GBA. Material delivery adds cost in outlying areas. Using a single average hides this variation and produces estimates that feel wrong to users who know their local market.

**Warning signs**:
- The pricing table has a single value per line item with no zone modifier
- The chatbot never asks where in AMBA the project is located
- User feedback: "this seems too cheap" or "this seems too expensive" without a clear pattern

**Prevention**:
- For the MVP, use CABA as the baseline and add a simple zone multiplier: `{ "caba": 1.0, "gba_norte": 0.92, "gba_sur": 0.88, "gba_oeste": 0.87 }`. These are rough approximations but better than no zoning.
- The chatbot should ask for the project zone as one of the first questions. It's a high-leverage data point.
- Disclose the zone assumption in the estimate output: "Estimación para [zona seleccionada]. Precios base CABA con factor de ajuste regional."
- Design the pricing data structure to support per-zone overrides from the start, even if the MVP only uses multipliers.

**Phase to address**: Data model + chatbot conversation flow.

---

## 3. Hackathon Pitfalls

---

### 3.1 Scope Creep

**The problem**: The biggest hackathon killer. With 4 developers and 24 hours, every "wouldn't it be cool if" feature costs approximately 2–4 hours that should have gone to polish, testing, or the demo script.

**Warning signs**:
- Someone suggests adding PDF export, 3D visualization, or real-time pricing APIs (all explicitly out of scope)
- A developer starts building something not on the project board because "it'll only take an hour"
- The integration step is planned for hour 20 of 24

**Prevention**:
- The scope is defined. Everything not on the Active requirements list requires a team vote to add, with an explicit decision to drop something else.
- Timebox the build into phases with hard cutoffs. Suggested structure for 24h:
  - H0–H2: Setup, shared types, pricing data, calculation engine scaffold
  - H2–H8: Calculation engine (TDD) + system prompt v1
  - H8–H14: Chat UI + tool calling integration
  - H14–H18: Floor plan upload + vision extraction
  - H18–H22: Integration + end-to-end testing
  - H22–H24: Demo prep, deployment, fallback plans
- Designate one person as scope guardian. Their only job during build is to say "that's out of scope."

**Phase to address**: Project kickoff (before the first line of code).

---

### 3.2 Integration Hell

**The problem**: 4 developers building in parallel will produce components with incompatible interfaces. The calculation engine developer makes different assumptions about units than the chat developer. The vision extraction developer returns data in a format the confirmation component doesn't expect.

**Warning signs**:
- Shared types are defined in multiple files (or not defined at all, just inferred)
- The API contract between the chat route and the calculation engine is not written down
- "I'll just stringify it and parse it on the other side"
- Integration is planned after individual components are "done"

**Prevention**:
- Spend the first 2 hours on shared type definitions only. Define `ProjectData`, `LineItem`, `CostBreakdown`, `FloorPlanExtraction`, and `UserMode` as TypeScript interfaces in `/lib/types.ts`. Everyone imports from this file — no local type redefinitions.
- Define the API contract for the calculation engine as a pure function signature before implementation: `calculateCost(data: ProjectData): CostBreakdown`. This is the integration point; both sides must agree before coding.
- Run integration builds hourly. If the TypeScript compiler reports errors at the integration boundaries, fix them immediately.
- Assign ownership: one developer owns the calculation engine, one owns the chat/AI layer, one owns the UI components, one owns deployment + integration. The integration owner is responsible for keeping the shared types file current.

**Phase to address**: Project kickoff + first 2 hours.

---

### 3.3 Demo Failures

**The problem**: Demos fail for reasons unrelated to code quality: the WiFi is slow, the API returns an error on the judge's first try, the uploaded floor plan is a format the server rejects, or the first message in the demo triggers an edge case that was never tested.

**Warning signs**:
- The demo flow has never been run end-to-end on the deployed URL
- The demo floor plan is a full-resolution architect scan (large, slow to upload)
- The demo relies on a specific prompt that only works with a particular input sequence
- No one has practiced the demo script

**Prevention**:
- Prepare a demo floor plan specifically for the hackathon: a simple, clean, small-file PNG at a resolution the vision model handles well (aim for 800×600 to 1600×1200).
- Write a demo script with exact conversation inputs. Practice it at least 3 times before the demo.
- Pre-warm the deployed URL 15 minutes before the demo with a full run-through.
- Prepare a local backup (localhost) with all environment variables set. If the deployed URL fails, switch instantly.
- Have the pre-generated "canned demo" transcript ready to paste if everything fails. Showing a polished screenshot and explaining the flow is better than a live error.

**Phase to address**: Final 2 hours before demo.

---

### 3.4 "It Works on My Machine" Deployment Issues

**The problem**: Next.js App Router on Vercel has specific deployment behaviors that differ from `next dev`: edge runtime vs. Node.js runtime, environment variable availability, file system access (none on Vercel), and cold start behavior. A feature that works locally can fail silently on deployment.

**Warning signs**:
- Environment variables are hardcoded in the local `.env` file but not added to Vercel project settings
- The pricing data is loaded from the file system at runtime (works locally, fails on Vercel)
- The floor plan upload writes to disk instead of memory/Vercel Blob
- The deployment step is planned for the last hour

**Prevention**:
- Deploy to Vercel at hour 2, before any features are built. Establish that the deployment pipeline works while the codebase is still trivial.
- Use `next/headers` and route handlers correctly. Avoid `fs` in any code that runs on Vercel.
- Pricing data should be a TypeScript module (imported at build time), not a JSON file read from disk at runtime.
- Floor plan uploads: use in-memory processing with the multipart form body. Do not `writeFile` to disk.
- Set all required environment variables in Vercel before the first deployment: `ANTHROPIC_API_KEY` (or AI Gateway equivalent). Verify with a health check endpoint that returns `{ "status": "ok", "ai": "connected" }`.
- The person responsible for deployment should do a full smoke test on the Vercel URL at H18, with 4–6 hours to fix issues.

**Phase to address**: Setup (H0–H2) + ongoing.

---

## 4. UX Pitfalls

---

### 4.1 Chatbot Feels Like a Form

**The problem**: The most common failure mode for data-collection chatbots. The model asks questions one at a time in a fixed order, never references prior answers, uses the same phrasing every session, and the experience is indistinguishable from a registration form with extra steps. Users drop off.

**Warning signs**:
- Every session follows the exact same question sequence
- The bot never makes inferences ("you said it's a 2-story house, so I'll assume 2 bathrooms minimum — correct?")
- Questions are phrased in formal, technical language regardless of user mode
- The bot ignores context in the user's earlier messages

**Prevention**:
- The system prompt must emphasize progressive inference. If the user says "quiero construir una casa familiar de dos pisos en zona norte," the bot should infer: residential, 2 stories, AMBA GBA norte zone. It should confirm these inferences rather than re-asking.
- Consumer mode tone: casual, warm, no construction jargon. "¿Cuántos dormitorios vas a tener?" not "Especifique la cantidad de dormitorios."
- The tool-calling approach (AI SDK tools with Zod) enables a good UX pattern: the model collects data through natural conversation and calls the tool when it has enough information, rather than asking one question per tool field.
- Allow the user to give information in any order. The model should track what it has and what it still needs.
- Test with a real non-technical user (family member, friend) before the demo. Watch where they hesitate or re-read.

**Phase to address**: System prompt design + conversation flow QA.

---

### 4.2 Information Overload in Results

**The problem**: A 21-category, ~80 line item breakdown is the right level of detail for a professional, but overwhelming for a consumer who just wants to know if they can afford their dream house. Showing all 80 items at once causes users to disengage or distrust the estimate because they can't validate it.

**Warning signs**:
- The cost breakdown renders all 80 line items in a flat list
- Consumer and professional modes show identical output
- Users scroll past the detail without reading it
- The total cost number is buried at the bottom

**Prevention**:
- Consumer output: show total cost, price per m2, and a collapsed 5-category summary (structure, finishes, installations, equipment, other). Allow expansion.
- Professional output: show full 21-category breakdown with line items, expandable by category.
- Lead with the number. The total cost and price/m2 should be the first thing visible, large, prominent.
- Add a confidence level indicator as planned (quick/standard/detailed). This sets expectations and explains why some categories show ranges rather than exact numbers.
- Use a visual hierarchy: total → categories → line items. Not a flat list.

**Phase to address**: Output UI design.

---

### 4.3 Floor Plan Upload Failures

**The problem**: Users will upload files in unexpected formats (PDF, DWG, HEIC from iPhone, photos taken at an angle, very large scans). Each failure mode is handled differently and unhelpfully if not anticipated. A silent failure (upload appears to succeed but vision extraction returns garbage) is worse than a clear error.

**Warning signs**:
- The upload accepts any MIME type without validation
- A 20MB architectural scan causes a timeout with no user feedback
- The vision extraction returns numbers from a HEIC-formatted iPhone photo that the model couldn't actually parse
- Blurry or angled photos produce confident-looking but wrong extractions

**Prevention**:
- Validate file type client-side before upload: accept `image/jpeg`, `image/png`, `image/webp` only. Show a clear message for PDFs, DWGs, and other formats: "Por ahora aceptamos imágenes JPG, PNG o WebP. Si tenés un PDF, podés exportar una página como imagen."
- Validate file size client-side: reject files over 5MB with a message. For the demo environment, aim for under 2MB for reliable performance.
- The vision extraction response must include a `confidence` and `warnings` field. If confidence is below a threshold or warnings are present, show a yellow banner: "La imagen puede ser difícil de analizar. Por favor revisá y corregí los valores detectados."
- Test with: a clean PNG floor plan, a photo of a printed plan, a blurry photo, a plan with furniture shown, and a plan that is not a floor plan at all (test the "not a floor plan" path).
- If vision extraction fails completely, fall back gracefully: "No pude analizar el plano. ¿Me contás vos las medidas?" — and continue the conversation.

**Phase to address**: Floor plan upload + vision analysis implementation.

---

### 4.4 No Feedback During Long AI Processing

**The problem**: The AI processing pipeline for Nelo can be slow: floor plan vision analysis, multi-tool conversation turns, and final calculation can each take 3–10 seconds. Without visible feedback, users assume the app is broken and reload — which wastes the computation and restarts the conversation.

**Warning signs**:
- No loading indicator during file upload and vision analysis
- The chat input is disabled but shows no reason why
- The transition from vision extraction to confirmation card happens with no intermediate state
- Long tool-call chains produce silent gaps in the chat stream

**Prevention**:
- Every AI action needs a progress narrative. Use streaming text to provide running commentary: "Estoy analizando el plano..." then the model describes what it found before rendering the confirmation card.
- During file upload: show a progress bar (even a faked one that fills over a realistic 3-second window).
- During vision analysis: show "Analizando el plano... esto puede tardar unos segundos." with a spinner.
- During calculation: show "Calculando el presupuesto..." — this can be a streaming message that names the categories as they are processed.
- Disable the chat input with a visible reason: a subtle "Nelo está procesando..." label near the input.
- Set a maximum wait time in the UI. If no response arrives within 20 seconds, show: "Esto está tardando más de lo esperado. ¿Querés que lo intente de nuevo?"

**Phase to address**: Chat UI implementation + UX polish pass.

---

## Quick Reference

| Pitfall | Severity | Phase | Effort to Fix |
|---------|----------|-------|---------------|
| Tool call skipped or malformed | Critical | Architecture | Low (guard + logging) |
| Vision output used without confirmation | Critical | Floor plan feature | Low (confirmation UI) |
| System prompt too long | High | Architecture | Medium (restructure) |
| Spanish numeric parsing failures | High | QA | Low (test + prompt fix) |
| Streaming renders raw tool JSON | High | Chat UI | Low (message part filter) |
| Rate limiting during demo | High | Deployment | Low (retry + backup key) |
| Stale pricing data undisclosed | High | Data setup | Low (add disclaimer) |
| Unit conversion error (m2 vs ml) | Critical | Calculation engine | Low (types + tests) |
| Wall area forgetting openings | Critical | Calculation engine | Low (TDD) |
| Missing GL categories | Medium | Calculation engine | Low (percentage formula) |
| No regional zone multiplier | Medium | Data model | Low (multiplier map) |
| Scope creep | High | Kickoff | Low (scope guardian) |
| Missing shared types | Critical | Kickoff | Low (2-hour type sprint) |
| Demo floor plan unprepared | High | Demo prep | Low (prepare asset early) |
| Deployment done last minute | High | Setup | Low (deploy at H2) |
| Bot feels like a form | High | System prompt | Medium (conversation design) |
| All 80 line items shown to consumer | Medium | Output UI | Low (collapsed view) |
| Upload accepts any format | Medium | Upload feature | Low (client validation) |
| No feedback during processing | Medium | Chat UI | Low (spinner + streaming text) |

---

*Written: 2026-03-20. Based on project context in PROJECT.md and general knowledge of AI chatbot, construction estimation, and hackathon failure patterns.*
