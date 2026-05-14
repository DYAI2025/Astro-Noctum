# Baseline Checks — 2026-05-14

**Task:** TASK-0-1 (Phase 0 — Baseline & Foundation)
**Codebase:** `/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod`
**Date:** 2026-05-14
**Executed by:** Claude Code via `/SDLC-execute-next-task`

## Summary

All three baseline commands **pass**. No new failures introduced. Two pre-existing observations recorded below.

| Command | Exit code | Duration | Notes |
|---------|-----------|----------|-------|
| `npx tsc --noEmit` | 0 | ~30s (cached, fast) | No TypeScript errors. |
| `npm run build` | 0 | 45.55s | Production Vite build succeeded. Some chunks > 500 kB (warning, not error). |
| `npm run test` | 0 | 67.50s | 248 test files, 2303 passed, 2 todo (2305 total). |

## Pre-existing observations

### Obs 1 — Vite build chunk-size warnings

The build emits a non-blocking warning that **6 chunks exceed 500 kB after minification**:

| Chunk | Size | Gzipped |
|-------|------|---------|
| `vendor-three-DFgaaBA7.js` | 690.92 kB | 177.60 kB |
| `index-CxcsXSYn.js` | 722.56 kB | 134.89 kB |
| `SignaturPage-B4FNz-Ei.js` | 350.83 kB | 118.44 kB |
| `DashboardPage-B8p7fLo0.js` | 209.38 kB | 72.55 kB |
| `vendor-supabase-yKjPlrCh.js` | 174.16 kB | 45.90 kB |
| `leaflet-src-KlFYg3nr.js` | 150.06 kB | 43.59 kB |

The `vendor-three` chunk is the Three.js bundle used by the frozen FS-2 SignaturRenderer pipeline ([CON-no-signatur-v3-rebuild](../1-spec/constraints/CON-no-signatur-v3-rebuild.md)). Reducing it requires either dynamic-importing Three.js (changes the renderer's load semantics — may conflict with constraint scope) or accepting the cost.

**Why not fixed in TASK-0-1:** task scope is baseline measurement, not optimization. Worth flagging for a future GreenOps task or as a follow-up to [REQ-PERF-signature-no-direct-embed](../1-spec/requirements/REQ-PERF-signature-no-direct-embed.md) (which already gates dashboard inline-embedding behind a perf-measurement decision).

**Recommendation:** address either in P7 (GreenOps Polling) as an extension or as a dedicated bundle-size cleanup task in P12 (Pre-launch Verification).

### Obs 2 — Test-suite `ECONNREFUSED ::1:3001` noise

The test run emits many `AggregateError [ECONNREFUSED]` log entries pointing at `127.0.0.1:3001` and `::1:3001` (the dev server's port per `package.json`'s `dev:server` script: `PORT=3001 node --env-file=.env server.mjs`). These appear during the test phase but do **not** cause failures — all 2303 active tests pass.

Implication: some tests appear to attempt connections to a backend server that is not running during `npm run test`. The fall-through behavior masks the error (the test code likely handles connection failure as a benign condition). This works today but is fragile:

- If a future test starts depending on the dev server being live, it will pass locally (with `dev:server` running in another terminal) and fail in CI silently or noisily.
- The noise in test output makes real test failures harder to spot.

**Why not fixed in TASK-0-1:** task scope is baseline measurement. Investigating each ECONNREFUSED call site is a separate concern.

**Recommendation:** triage in a dedicated cleanup task once test infrastructure is being modified. Likely candidates for the source of the noise: hooks or fetch wrappers that hit `/api/*` paths in test mode without mocking. Should be addressed alongside or before adding integration tests in P3 / P9 / P11.

## Verification commands (reproducible)

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod"

# Typecheck
npx tsc --noEmit && echo "TSC: PASS"

# Build
npm run build && echo "BUILD: PASS"

# Tests
npm run test && echo "TEST: PASS"
```

## Outcome

Baseline established. Project is in a known-clean state. **P0 is unblocked to proceed with TASK-0-2 (shared-types package skeleton).**
