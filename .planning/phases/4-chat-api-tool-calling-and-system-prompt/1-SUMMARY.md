# Phase 4: Chat API — Tool Calling and System Prompt

## Status: Complete (retroactive)

## One Liner
Wired chat API route with Claude via OpenRouter, defined AI SDK tools with Zod schemas, floor plan vision analysis, and data source fetchers.

## What Was Built
- `src/app/api/chat/route.ts` — POST handler with streamText, convertToModelMessages, tool calling, user mode detection
- `src/lib/ai/tools.ts` — AI SDK tools: collectProjectData, runEstimate, analyzeFloorPlan
- `src/lib/ai/models.ts` — OpenRouter provider config with chatModel and visionModel
- `src/lib/floor-plan/analyze.ts` — Floor plan vision analysis returning FloorPlanExtraction
- `src/lib/data-sources/indec-icc.ts` — INDEC ICC index fetcher
- `src/lib/data-sources/uocra.ts` — UOCRA wage data fetcher
- `src/lib/data-sources/mercadolibre.ts` — MercadoLibre materials price fetcher
- `src/lib/data-sources/index.ts` — Unified data source exports

## Success Criteria Met
1. ✅ POST /api/chat calls streamText with Claude via OpenRouter
2. ✅ collectProjectData tool defined with Zod schemas
3. ✅ runEstimate tool calls computeEstimate
4. ✅ analyzeFloorPlan tool for vision extraction
5. ✅ buildSystemPrompt injects current categories with consumer/professional modes
6. ✅ User mode detection via technical term matching

## Note
- Using OpenRouter instead of AI Gateway (team decision for model flexibility)
- OPENROUTER_API_KEY set in .env.local

## Commits
- `2a4712a` feat: chat API route with AI SDK tools
- `66973ac` feat: switch to OpenRouter provider for model flexibility
- `3a39994` feat: data source fetchers (INDEC ICC, UOCRA wages, MercadoLibre materials)
- `ab12cdf` feat: floor plan vision analysis + engine edge case tests
