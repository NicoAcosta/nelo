# Deferred Items — Phase 12

Pre-existing test failures discovered during 12-01 execution (out of scope per deviation rules):

1. `src/components/__tests__/chat-options.test.tsx` — fails with "Failed to resolve import @/app/chat/get-selected-value". File `get-selected-value` does not exist. Pre-existed before this plan.

2. `src/components/__tests__/sidebar.test.tsx > renders the Nelo AI branding` — test expects text "Nelo AI" but component renders "NELO". Pre-existed before this plan.

Both failures confirmed pre-existing via `git stash` test.
