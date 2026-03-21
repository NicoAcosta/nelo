# ArquiCost — UI/UX Guidelines for Designers

**Last updated:** 2026-03-21

---

## 1. Product Overview

ArquiCost is an AI-powered construction cost estimation chatbot for the Argentine market (AMBA region). Users describe their project through natural conversation — or upload a floor plan — and receive a detailed cost breakdown with price per m² and total construction price. The product targets both homeowners who want a ballpark figure and architects/engineers who need a structured presupuesto de obra starting point.

---

## 2. User Personas

### Consumer — "El que quiere construir su casa"
Homeowner, first-time builder. Does not know construction terminology. Wants a number they can trust without filling out a complex form. May ask vague questions ("quiero hacer una casa de 100m²"). Needs the chatbot to guide them, explain what it's asking and why, and translate technical assumptions into plain language. Values simplicity and reassurance.

### Professional — "El arquitecto / el ingeniero"
Architect or civil engineer. Knows exact terminology (revoques, contrapisos, azotea, carpinterías). Wants depth: category-by-category breakdown, incidence percentages, editable values, confidence range. May upload a floor plan to skip manual input. Values precision, completeness, and the ability to correct individual data points.

The chatbot detects which persona is communicating and adjusts its question depth and output detail automatically. The UI must support both experiences without two separate products.

---

## 3. Core User Flows

### Flow A — Express Mode (Consumer default)
1. User starts a conversation and briefly describes their project.
2. Chatbot identifies it as Express mode and asks 5–8 focused questions: built area, number of stories, structure type, roof type, finish level, location zone. Each question includes a brief explanation of why it matters.
3. Chatbot states any missing data it assumes (e.g., "Voy a asumir una altura de piso a techo de 2,60 m — avisame si es diferente").
4. After enough data is collected, the chatbot generates and displays the estimate inline in the conversation.
5. User can ask follow-up questions or correct any assumed value through plain conversation; the estimate updates.

### Flow B — Floor Plan Upload
1. User attaches a floor plan image (PNG, JPG, or PDF) as part of their message.
2. AI vision analyzes the image and extracts approximate data: room count, room types, estimated total area, door count, window count.
3. Chatbot presents the extracted values as a confirmation summary. The user can correct individual values before proceeding ("el baño tiene 4m², no 6m²").
4. Once confirmed, the data feeds the calculation engine and the estimate appears in the chat.
5. The chatbot may ask a few follow-up questions about items the floor plan cannot reveal (structure type, roof material, finish level).

### Flow C — Professional / Detailed Mode
1. User signals professional intent (terminology, explicit request, or floor plan upload).
2. Chatbot asks deeper questions covering structure, roofing, insulation, MEP, finishes, carpentry, and site conditions. Branching logic applies (e.g., "¿Hay sótano?" unlocks waterproofing questions).
3. User can upload a floor plan at any point to auto-fill dimensional data.
4. Estimate output includes the full 26-category breakdown, material/labor split indicators, and a tighter confidence range.
5. User can correct individual values through conversation after seeing the estimate.

---

## 4. Key Screens and States

### Chat Conversation
The primary interface. A persistent message thread where the AI asks questions and the user responds. Attachments (floor plans) can be sent alongside text. The chatbot's messages must clearly distinguish between questions, assumptions, and informational context. The estimate appears as a structured card embedded directly in the thread — not on a separate page.

### Estimate Output Card
Rendered inside the chat as a tool result. Must display:
- **Total price** in ARS — most prominent element
- **Price per m²** in ARS/m²
- **Confidence level** with accuracy range: Express ±40–50% / Standard ±20–25% / Detailed ±10–15%
- **26-category cost breakdown** — each category shows its name, subtotal in ARS, and incidence percentage of total direct cost
- **Stated assumptions** — a visible list of values the system assumed (e.g., "Altura de piso a techo: 2,60 m", "Sin sótano", "Zona: AMBA central")
- **Last price update date** — reference date of the pricing data used

The presentation of the breakdown (table, accordion, chart, combination) is an open designer decision. The data must all be present; layout and visual treatment are yours to define.

### Floor Plan Extraction Confirmation
After AI analyzes a floor plan, the extracted values are presented for user review before being used in the calculation. The user must be able to correct any individual extracted value. This can happen through conversation (typing corrections) or through an inline editable summary — the interaction model is a designer decision.

Extracted fields include: estimated total area (m²), number of rooms, room types, door count, window count.

### Loading / Processing States
Three distinct moments need visual feedback:
- **Chatbot is typing / thinking** — generating the next question
- **Floor plan is being analyzed** — vision AI processing an uploaded image (may take 5–15 seconds)
- **Estimate is being calculated** — engine running after data collection is complete

### Error States
- Floor plan could not be analyzed (unreadable image, wrong file type, or ambiguous plan)
- Chatbot could not extract enough data to produce an estimate
- Network/API error mid-conversation

Errors should appear in-line in the chat, explain what went wrong in plain Spanish, and offer a clear recovery path (retry, provide data manually, etc.).

---

## 5. Content Guidelines

### Language
Primary language is **Spanish (Argentine)**. Use Argentine construction terms throughout: azotea (not "terraza plana"), contrapisos, revoques, carpinterías, H.A. (hormigón armado), losa, mampostería, etc. Avoid Castilian Spanish alternatives.

### Tone per Persona
- **Consumer**: warm, patient, conversational. Short sentences. Explain every technical term when first used. Reassure them that their estimate is a range, not an exact quote. Never condescend.
- **Professional**: direct, precise, efficient. Use technical terminology without definitions. Respect their time — fewer words, more data.

### Chatbot Question Style
Every question the chatbot asks should include a brief "why it matters" explanation. Not a paragraph — one sentence. Example: "¿Cuántos pisos tendrá la construcción? Esto afecta el costo de estructura y la cantidad de escalera."

### Assumptions
When the chatbot assumes a value because the user didn't provide it, it must state the assumption explicitly in the conversation before generating the estimate. The user must be able to correct it with a plain-text reply.

---

## 6. Data to Display in the Estimate

| Field | Description |
|-------|-------------|
| Total price | ARS, final price including overhead, profit, IVA (21%) |
| Price per m² | ARS/m², computed from total price / built area |
| Confidence level | Tier label + accuracy range (see below) |
| 26-category breakdown | Category name, ARS subtotal, % incidence of direct cost |
| Stated assumptions | List of values the engine assumed, not confirmed by user |
| Last price update | Reference date of AMBA pricing data used |

**Confidence tiers:**
- Express (5–8 questions answered): ±40–50%
- Standard (floor plan + key questions): ±20–25%
- Detailed (full questionnaire): ±10–15%

**The 26 cost categories** (use these exact Argentine names):
Trabajos Preliminares, Movimiento de Tierra, Estructura de H.A., Albañilería, Aislaciones, Revoques, Contrapisos y Carpetas, Pisos, Cielorrasos, Zócalos, Revestimientos, Pintura, Carpinterías, Amoblamientos, Instalación Eléctrica, Instalación Sanitaria, Instalación de Gas, Ahorro Energético, Varios, Seguridad e Higiene, Plan de Gestión Ambiental, Gastos Generales, Beneficio / Utilidad, IVA, and summary line items for Costo Directo and Precio Final.

---

## 7. Technical Constraints (What the Designer Needs to Know)

- **Component library**: shadcn/ui + Tailwind CSS. The developer will implement using these tools, so your designs should be achievable with standard card, table, badge, input, and button primitives.
- **Chat components**: The message thread and prompt input are built with AI Elements (`Message`, `Conversation`, `PromptInput` components). The estimate card renders as a custom node inside a message — it sits inside the chat, not above or below it.
- **Dark mode**: Preferred aesthetic for this type of AI product. Design primarily for dark mode; light mode support is a nice-to-have.
- **Mobile-first**: The app must work on mobile viewports. The estimate card and floor plan confirmation flow both need to be usable on a phone screen.
- **No user accounts in v1**: There is no login, no saved history, no profile. Each session is ephemeral. No need to design account management screens.
- **Single region**: AMBA only for now. No region selector needed in the MVP.

---

## 8. Open for Designer Decisions

These are yours. We have no opinion — make them great:

- Overall layout and visual hierarchy of the chat interface
- Color palette and branding direction
- Typography choices (Geist is the base font; you can extend or replace)
- Logo and product identity
- Animation and transition design (message arrival, estimate reveal, loading states)
- How to present the 26-category breakdown (table, accordion, horizontal bar chart, collapsible sections, a combination — your call)
- How to visualize confidence levels (badge, progress bar, range indicator, something else)
- Landing page / onboarding experience (we have none designed yet — blank slate)
- Empty state for a new conversation (what does the user see before they type anything?)
- How the floor plan confirmation UI feels (inline edit, side panel, conversational back-and-forth, or something else)
- Whether the estimate card has any interactive elements (expand/collapse categories, hover states, etc.)

---

*Questions? Reach out to the dev team. The calculation engine and chat API are being built in parallel — component mocks against sample data are welcome at any stage.*
