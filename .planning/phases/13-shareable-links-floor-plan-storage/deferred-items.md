# Deferred Items — Phase 13

## Pre-existing Test Failures (Out of Scope)

These failures existed before Phase 13 and are NOT introduced by this plan.

### 1. chat-options.test.tsx — missing module
- **File:** `src/components/__tests__/chat-options.test.tsx`
- **Error:** `Cannot find module '@/app/chat/get-selected-value'`
- **Root cause:** `get-selected-value.ts` exists at `src/app/chat/[id]/get-selected-value.ts` but the test uses the wrong path
- **Scope:** Pre-existing, not related to Phase 13

### 2. dwg-converter.test.ts — incorrect assertion
- **File:** `src/lib/documents/__tests__/dwg-converter.test.ts`
- **Error:** `convertDwgToDxf` resolves instead of rejecting for corrupt/zero-length buffers
- **Root cause:** The converter's error handling was changed to return empty DXF on error rather than throwing
- **Scope:** Pre-existing, not related to Phase 13
