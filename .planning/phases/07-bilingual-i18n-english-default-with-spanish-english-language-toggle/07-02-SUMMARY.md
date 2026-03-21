---
phase: 07-bilingual-i18n
plan: 02
subsystem: backend-i18n
tags: [i18n, system-prompt, engine, api, bilingual]
dependency_graph:
  requires: [07-01]
  provides: [bilingual-system-prompt, locale-aware-engine, locale-aware-api]
  affects: [chat-api, estimation-engine, tools]
tech_stack:
  added: []
  patterns: [factory-function-for-locale-tools, translation-lookup-pattern]
key_files:
  created:
    - src/lib/pricing/__tests__/system-prompt-builder.test.ts
    - src/lib/estimate/__tests__/engine-locale.test.ts
  modified:
    - src/lib/pricing/system-prompt-builder.ts
    - src/lib/pricing/categories-config.ts
    - src/lib/estimate/types.ts
    - src/lib/estimate/engine.ts
    - src/lib/ai/tools.ts
    - src/app/api/chat/route.ts
decisions:
  - "createChatTools factory pattern instead of modifying tool execute signatures"
  - "Tool descriptions kept in English (model-facing, not user-facing)"
  - "nameEn added to CategoryConfig type for bilingual category display"
metrics:
  duration: 340s
  completed: "2026-03-21T20:13:35Z"
  tasks_completed: 2
  tasks_total: 2
  tests_added: 19
  files_modified: 8
---

# Phase 07 Plan 02: Backend Bilingual Layer Summary

Bilingual system prompt builder, locale-aware engine assumptions, and API route locale parameter using i18n translations from plan 01.

## Deviations from Plan

None - plan executed exactly as written.

## What Was Built

### Task 1: Bilingual System Prompt and Category Names
- `buildSystemPrompt(userMode, locale)` produces complete English or Spanish system prompts
- English prompt uses "You are Nelo" with full translated role, mode, behavior, and output format sections
- Spanish prompt preserves existing "Sos Nelo" text
- All 26 categories in `categories-config.ts` now have `nameEn` field
- All 6 `EXPRESS_QUESTIONS` now have `labelEn` field
- `CategoryConfig` type in `types.ts` updated with `nameEn: string`
- Default locale is `'en'` when no locale parameter provided

### Task 2: Locale Through API Route, Engine, and Tools
- API route reads `locale` from request body JSON, validates as `'en' | 'es'`, defaults to `'en'`
- `computeEstimate(inputs, locale)` passes locale through to assumptions and category names
- `collectAssumptions(inputs, locale)` uses `translations[locale]` for all assumption labels
- `sumByCategory(lineItems, locale)` resolves `nameEn` vs `name` based on locale
- `createChatTools(locale)` factory function produces locale-aware tool instances
- Tool user-facing messages (collectProjectData, analyzeFloorPlan) are bilingual
- Tool descriptions kept in English (model-facing, not user-facing)

## Decisions Made

1. **createChatTools factory pattern**: Instead of passing locale through tool execute params (not possible with AI SDK tool API), created a factory function that closes over locale.
2. **Tool descriptions in English**: Model-facing strings (description, Zod .describe()) stay in English since they instruct the model, not the user.
3. **nameEn on CategoryConfig type**: Added to the shared type definition so all consumers can access bilingual names.

## Test Results

- 19 new tests added (12 system prompt + 7 engine locale)
- All 73 backend tests pass
- 23 pre-existing component test failures (from plan 07-01 adding useLocale to components without updating test wrappers) - not caused by this plan

## Commits

| Hash | Message |
|------|---------|
| ebf103c | test(07-02): add failing tests for bilingual system prompt and category config |
| a7c0442 | feat(07-02): bilingual system prompt builder and category config |
| e2014e4 | test(07-02): add failing tests for engine and API locale support |
| 5423a8e | feat(07-02): wire locale through API route, engine, and tools |

## Known Stubs

None - all functionality is fully wired.

## Self-Check: PASSED
