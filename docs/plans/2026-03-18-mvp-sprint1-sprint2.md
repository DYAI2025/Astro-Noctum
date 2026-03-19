# MVP Sprint 1 Completion + Sprint 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close remaining MVP gaps and deliver Sprint 2 (Quiz E2E + Levi V2 + engagement mechanics)

**Architecture:** Bazodiac web app (React 19 SPA + Express server.mjs + Supabase). The code for most features EXISTS but needs wiring, testing, and one endpoint extension.

**Tech Stack:** React 19, TypeScript, Express, Supabase, Three.js, ElevenLabs, Gemini API

---

## Audit Summary (as of 2026-03-18)

| Item | Status |
|------|--------|
| Sprint 1.1 — Onboarding fallback | DONE — App.tsx degrades to BAFE-only when FuFirE is down |
| Sprint 1.2 — Debug panels hidden | DONE — isInteractive=false, showUI=false by default |
| Sprint 1.3 — Signatur data fallback | DONE — soulprintToNatalWeights() defaults to 0.5 |
| Sprint 1.4 — Deploy + smoke test | NEEDS DOING |
| Sprint 1.5 — Daily horoscope | WORKING — feature-flagged behind ff_daily_modal_v1 (default true) |
| Sprint 2.1 — Quiz E2E | CODE WIRED — QuizOverlay + ClusterSidebar mounted on FuRingPage, useQuizContribution hooked. Needs E2E test run |
| Sprint 2.2 — Cluster completion + animation | CODE EXISTS — ClusterPipeline animation in place. Needs verification |
| Sprint 2.3 — Levi V2 endpoint | PARTIAL — natal_weights/dominant_planet/weakest_planet already returned; soulprint_sectors missing from response |
| Sprint 2.4 — Quiz suggestion wiring | DONE — useQuizSuggestion wired into FuRingPage, suggestedModule passed to ClusterSidebar |

---

## Task 1: Sprint 1 Smoke Test — Production Build

**Files involved:**
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/feature-flags.ts`
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/.env.example`

**Steps:**

1. Run the TypeScript type-checker and fix any errors:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
   npm run lint
   ```
   Fix all reported errors before proceeding.

2. Run the production build:
   ```bash
   npm run build
   ```
   Fix any Vite/Rollup errors. Common causes: missing exports, circular imports, unresolved `@/` aliases in non-src files.

3. Verify feature flag defaults in `src/lib/feature-flags.ts` — all three should be `true`:
   ```ts
   signature_onboarding_v1: true,
   daily_modal_v1: true,
   signature_engine_v2: true,
   ```
   Current state: all three are already `true`. No change needed unless a flag was reset.

4. Cross-check `.env.example` against all `process.env.*` and `import.meta.env.*` references in the codebase to confirm no undocumented variables exist:
   ```bash
   grep -r "process\.env\." server.mjs | grep -v "//.*process" | sed "s/.*process\.env\.\([A-Z_]*\).*/\1/" | sort -u
   grep -r "import\.meta\.env\." src/ | sed "s/.*import\.meta\.env\.\(VITE_[A-Z_]*\).*/\1/" | sort -u
   ```
   Add any missing variables to `.env.example` with placeholder values and descriptive comments.

5. Run the full test suite to catch any regressions:
   ```bash
   npm run test
   ```

**Success criteria:**
- `npm run lint` exits 0
- `npm run build` exits 0 and produces `dist/`
- `npm run test` passes all tests
- All env vars in code are documented in `.env.example`

**Commit:** `chore(AN-MVP): production build smoke test — fix lint + build errors`

---

## Task 2: Extend Levi Profile Endpoint — Add soulprint_sectors

**Context:** `GET /api/profile/:userId` in `server.mjs` already computes and returns `natal_weights`, `dominant_planet`, `weakest_planet`, and `emergence_target`. However, `soulprint_sectors` (the raw 12-element array) is computed internally (as `soulprintSectors` at line 1313) but never included in the response JSON. Levi V2 needs it to reference the specific sector strengths by index in conversation.

**Files involved:**
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/server.mjs` — lines 1312–1380

**Steps:**

1. Read the `res.json()` block at lines 1345–1380 in `server.mjs`.

2. Locate the "Levi V2 Signature parameters" comment block inside `res.json()` (around line 1372). It currently reads:
   ```js
   // Levi V2 Signature parameters
   natal_weights,
   dominant_planet,
   weakest_planet,
   emergence_target,
   ```

3. Add `soulprint_sectors` to that block so Levi can reference raw sector values:
   ```js
   // Levi V2 Signature parameters
   soulprint_sectors: soulprintSectors,
   natal_weights,
   dominant_planet,
   weakest_planet,
   emergence_target,
   ```
   The variable `soulprintSectors` is already in scope at this point (defined at line 1313).

4. Test the endpoint with curl (requires a valid `ELEVENLABS_TOOL_SECRET` and a real `userId` from your local Supabase):
   ```bash
   curl -s -H "Authorization: Bearer $ELEVENLABS_TOOL_SECRET" \
     http://localhost:3001/api/profile/<userId> | jq '{soulprint_sectors, natal_weights, dominant_planet, weakest_planet}'
   ```
   Confirm `soulprint_sectors` is a 12-element array of numbers between 0 and 1.

**Success criteria:**
- `GET /api/profile/:userId` response includes `soulprint_sectors` as an array of 12 floats
- `natal_weights`, `dominant_planet`, `weakest_planet`, `emergence_target` remain present and unchanged

**Commit:** `feat(AN-MVP): add soulprint_sectors to Levi profile endpoint`

---

## Task 3: Quiz E2E Verification

**Context:** The full quiz → Signatur pipeline is wired: `QuizOverlay` is mounted on `FuRingPage`, `ClusterSidebar` is mounted with `suggestedModule`, and `useQuizContribution` handles `onComplete`. The cluster burst animation is handled via `justCompletedCluster` state and `ClusterPipeline`. This task verifies the pipeline end-to-end and runs the existing test suite.

**Files involved:**
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/pages/FuRingPage.tsx`
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useQuizContribution.ts`
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/services/contribute.ts`
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/__tests__/contribute-pipeline.test.ts`
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/__tests__/quiz-cluster-e2e.test.ts`

**Steps:**

1. Read `src/pages/FuRingPage.tsx` and trace the complete quiz activation flow:
   - `ClusterSidebar` receives `onQuizStart={setActiveQuiz}` and `suggestedModule`
   - `activeQuiz` state drives `QuizOverlay` visibility (`activeQuiz !== null`)
   - `QuizOverlay` calls `handleQuizComplete(event: ContributionEvent)` on completion
   - `handleQuizComplete` calls `quizContribution(event)` (from `useQuizContribution`) and `addModule(moduleId)`
   - Cluster completion check: `isClusterComplete(cluster, updated)` → sets `justCompletedCluster` and `ringEffect`

2. Read `src/hooks/useQuizContribution.ts` and verify:
   - Cluster gate: only POSTs when ALL quizzes in a cluster are complete
   - Calls `contributeQuizResult()` from `src/services/contribute.ts`

3. Read `src/services/contribute.ts` and verify:
   - Gets Supabase JWT via `supabase.auth.getSession()`
   - POSTs `{ sectorWeights }` to `/api/contribute` with Bearer token
   - Fire-and-forget (no await, errors swallowed)

4. Run the contribute pipeline unit tests:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
   npx vitest run src/__tests__/contribute-pipeline.test.ts
   ```

5. Run the quiz-cluster E2E tests:
   ```bash
   npx vitest run src/__tests__/quiz-cluster-e2e.test.ts
   ```

6. Run the cluster burst trigger tests:
   ```bash
   npx vitest run src/__tests__/cluster-burst-trigger.test.ts
   ```

7. If any test fails, fix the underlying logic. Do not mock the failure away.

**Expected flow diagram:**
```
ClusterSidebar (slot click) → setActiveQuiz(moduleId)
       ↓
QuizOverlay renders quiz component (QUIZ_MAP[activeQuiz])
       ↓
Quiz calls onComplete(ContributionEvent)
       ↓
handleQuizComplete → quizContribution(event)  +  addModule(moduleId)
       ↓                                              ↓
useQuizContribution:                        useCompletedModules
  eventToSectorSignals() → weights          (localStorage + Supabase)
  cluster gate check
  if complete → contributeQuizResult()
       ↓
POST /api/contribute → upsert contribution_events
       ↓ (background)
ClusterPipeline burst animation (justCompletedCluster state)
FusionRingCanvasV2 ringEffect (ringEffect state → V2 effect system)
```

**Success criteria:**
- All three test files pass with 0 failures
- Flow trace matches the diagram above with no gaps

**Commit:** `test(AN-MVP): verify quiz E2E pipeline — all cluster tests pass`

---

## Task 4: Wire Quiz Suggestion (Verification Only)

**Context:** Based on the audit, `useQuizSuggestion` is already wired into `FuRingPage.tsx` at line 29 and `suggestedModule` is already passed to `ClusterSidebar` at line 108. This task is a verification pass to confirm the golden-pulse styling is working in `ClusterSidebar`.

**Files involved:**
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useQuizSuggestion.ts`
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/signatur/ClusterSidebar.tsx`
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/__tests__/useQuizSuggestion.test.ts`

**Steps:**

1. Read `src/hooks/useQuizSuggestion.ts` and confirm the logic:
   - 30% random chance to suggest a quiz (only when `Math.random() <= 0.3`)
   - 1x per day gate via `localStorage` key `bazodiac_quiz_last_suggestion`
   - Returns `null` when all modules are complete or today's gate is closed
   - `pickSuggestion()` is exported as a pure function for testing

2. Read `src/components/signatur/ClusterSidebar.tsx` around line 123 and verify:
   - `const isSuggested = suggestedModule === moduleId` is evaluated per slot
   - When `isSuggested` is true, the slot should apply a golden pulse class (e.g. `ring-gold animate-pulse` or similar Tailwind class)
   - If the visual class is missing or incorrect, add it using the project's `--color-gold: #D4AF37` token

3. Run the suggestion hook tests:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
   npx vitest run src/__tests__/useQuizSuggestion.test.ts
   ```

4. If the golden-pulse visual is absent from `ClusterSidebar`, add it. Example conditional class:
   ```tsx
   className={cn(
     'quiz-slot ...',
     isSuggested && 'ring-2 ring-gold animate-pulse'
   )}
   ```
   Use whatever class naming pattern the rest of `ClusterSidebar` uses.

**Success criteria:**
- `useQuizSuggestion.test.ts` passes
- Suggested slot has visible golden-pulse styling in `ClusterSidebar`
- No additional wiring needed (already done)

**Commit (only if visual fix needed):** `fix(AN-MVP): add golden-pulse styling to suggested quiz slot in ClusterSidebar`

---

## Task 5: Enable Feature Flags for MVP

**Context:** All three feature flags already default to `true` in `src/lib/feature-flags.ts`. This task is a final verification pass with no expected code changes.

**Files involved:**
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/feature-flags.ts`

**Steps:**

1. Read `src/lib/feature-flags.ts` and confirm all defaults:
   ```ts
   const FLAGS = {
     signature_onboarding_v1: true,   // Onboarding flow: BirthForm → SignatureReveal → Dashboard
     daily_modal_v1: true,            // Daily horoscope modal on first Dashboard visit
     signature_engine_v2: true,       // V2 spirograph engine (28K particles, Cousto geometry)
   } as const;
   ```

2. If any flag defaults to `false`, change it to `true` for the MVP release.

3. Confirm the localStorage override mechanism is documented in `CLAUDE.md` (it is — under "Feature flags").

4. Optionally, add a `FEATURE_FLAGS.md` in `docs/` that documents the three flags, their effects, and how to override them in the browser console. This is optional but useful for QA and stakeholder demos:
   ```md
   # Feature Flags

   | Flag | Default | Effect |
   |------|---------|--------|
   | signature_onboarding_v1 | true | Enables 3-phase onboarding (BirthForm → SignatureReveal → Dashboard) |
   | daily_modal_v1 | true | Shows daily horoscope modal on first Dashboard visit each day |
   | signature_engine_v2 | true | Uses V2 Cousto-frequency spirograph engine (FusionRingCanvasV2) |

   ## Override in browser console
   localStorage.setItem('ff_<flag_name>', 'false')  // disable
   localStorage.removeItem('ff_<flag_name>')         // restore default
   ```

**Success criteria:**
- All three flags default to `true`
- No code change needed if current state matches

**Commit (only if change needed):** `feat(AN-MVP): enable all feature flags for MVP release`

---

## Task 6: CLAUDE.md Corrections

**Context:** `CLAUDE.md` contains several stale statements about `QuizOverlay` being "orphaned" / "not mounted". These are now incorrect — `QuizOverlay` is mounted on `FuRingPage` along with `ClusterSidebar`. The file must be updated to reflect the current wired state.

**Files involved:**
- `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/CLAUDE.md`

**Steps:**

1. Search for all "orphaned" and "not mounted" references in `CLAUDE.md`:
   ```bash
   grep -n "orphan\|not mounted\|QuizOverlay" CLAUDE.md
   ```

2. Remove or update every occurrence of the pattern "QuizOverlay is defined but currently not mounted" and similar. Specific locations to update:

   **In the Key Modules table** — find the QuizOverlay row:
   ```
   | `src/components/QuizOverlay.tsx` | Modal overlay that hosts the quiz system. **Currently orphaned** — defined but not mounted in any page. Needs to be imported and rendered with `useQuizContribution` as `onComplete` |
   ```
   Replace with:
   ```
   | `src/components/QuizOverlay.tsx` | Modal overlay that hosts the quiz system. Mounted on `FuRingPage` (`/signatur` route) with `useQuizContribution` as `onComplete` handler and `useCompletedModules` for cluster gate hydration |
   ```

   **In the Quiz → Fusion Ring Integration section** — find:
   ```
   `QuizOverlay` is the master router — maps quiz IDs to lazy-loaded components via `QUIZ_MAP`. **Currently orphaned** (not mounted). To activate: mount with `useQuizContribution(completedModuleIds)` as `onComplete`, hydrate `completedModuleIds` from Supabase `contribution_events` on mount.
   ```
   Replace with:
   ```
   `QuizOverlay` is the master router — maps quiz IDs to lazy-loaded components via `QUIZ_MAP`. Mounted on `FuRingPage` with `useQuizContribution(completedModuleIds)` as `onComplete`. `completedModuleIds` is hydrated from Supabase `contribution_events` via `useCompletedModules` on mount.
   ```

   **In the Signatur (Fusion Ring) Data Pipeline section** (if it references QuizOverlay orphan status):
   ```
   **Important**: `QuizOverlay` is defined but currently not mounted in any page component. To activate the quiz→ring pipeline, mount it with `useQuizContribution` as the `onComplete` handler. The caller must hydrate `completedModuleIds` from Supabase `contribution_events` on mount for the cluster gate to work correctly.
   ```
   Replace with:
   ```
   **Active**: `QuizOverlay` is mounted on `FuRingPage` with `useQuizContribution` as the `onComplete` handler. `completedModuleIds` is hydrated from Supabase `contribution_events` on mount via `useCompletedModules`. `ClusterSidebar` is co-mounted on `FuRingPage` and drives quiz activation via `setActiveQuiz`.
   ```

3. Add `ClusterSidebar` to the Key Modules table if not already present:
   ```
   | `src/components/signatur/ClusterSidebar.tsx` | Sidebar showing all 6 quiz clusters and their completion progress. Mounted on `FuRingPage`. Accepts `suggestedModule` prop (from `useQuizSuggestion`) for golden-pulse highlighting |
   ```

4. After editing, do a final sanity check:
   ```bash
   grep -n "orphan\|not mounted\|Currently orphaned" CLAUDE.md
   ```
   Should return 0 results.

**Success criteria:**
- `grep "orphan\|not mounted" CLAUDE.md` returns 0 matches
- Key Modules table reflects current mounting state
- Quiz pipeline section accurately describes the wired flow

**Commit:** `docs(AN-MVP): update CLAUDE.md — QuizOverlay and ClusterSidebar now mounted on FuRingPage`

---

## Execution Order

Run tasks in this sequence — each task is independent except that Task 1 (build verification) should come first to establish a clean baseline:

```
Task 1 (build/lint) → Task 2 (Levi endpoint) → Task 3 (E2E tests) → Task 4 (suggestion verify) → Task 5 (flags verify) → Task 6 (CLAUDE.md)
```

Tasks 2–6 can be parallelized after Task 1 passes.

## Critical Path

- **Task 1** — must pass before any deployment
- **Task 2** — unblocks Levi V2 capability (soulprint_sectors)
- **Task 3** — validates the core quiz→ring feedback loop

## Risk Notes

| Risk | Mitigation |
|------|-----------|
| `npm run build` fails due to TypeScript errors in `features/plan/allquizzes/quizzme-module-loader.ts` | That file has a known pre-existing TSC error at line 298 (Tag type mismatch). Do not fix it. Confirm it is excluded from `tsconfig.json` include paths |
| BAFE unreachable during local test | App degrades gracefully — empty data is expected, test flow does not require live BAFE |
| `ELEVENLABS_TOOL_SECRET` not set locally | Task 2 curl test will 401 locally; this is expected if the secret is not in `.env.local`. Verify with a staging environment or set the var temporarily |
| Cluster gate prevents single-quiz contribution in tests | Use test helpers that complete all modules in a cluster, or test `eventToSectorSignals()` in isolation |
