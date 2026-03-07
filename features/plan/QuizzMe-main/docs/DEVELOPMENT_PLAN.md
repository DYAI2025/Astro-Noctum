# AstroSheet User Journey - Development Plan

## Executive Summary

Based on codebase analysis, **~70% of infrastructure exists**. Key gaps:
- DST disambiguation UI (onboarding)
- Missing routes: `/agents`, `/premium`, `/settings`
- Daily transits (stubbed)
- Resonance display in UI

---

## Current State Assessment

| Component | Status | Completion |
|-----------|--------|------------|
| Test Infrastructure | ✅ Ready | 100% |
| Onboarding Form | ✅ Built | 100% |
| Precision Hints | ✅ Added | 100% |
| DST Handling | ✅ Complete | 100% |
| FusionEngine | ✅ Complete | 100% |
| Daily Transits | ❌ TODO | 10% |
| Dashboard/AstroSheet | ✅ Complete | 100% |
| Sidebar Navigation | ✅ Complete | 100% |
| Profile Page | ❌ Missing | 0% |
| Agents Page | ❌ Missing | 0% |
| Premium Page | ❌ Missing | 0% |
| E2E Tests | ✅ Written | 100% |

---

## Sprint 1: Test Infrastructure Validation ✅ COMPLETE

**Goal**: Verify existing test setup works

### Tasks
- [x] Run existing E2E tests: `npm run e2e` - 18 passed
- [x] Run unit tests: `npm run test` - 266 passed
- [x] Fix any failing tests - N/A
- [x] Document baseline test results - Captured

### Files
- `playwright.config.ts` - Already configured ✅
- `e2e/user-journey.spec.ts` - 27 tests exist ✅
- `e2e/character-sheet.spec.ts` - 15 tests exist ✅

### Verification
```bash
npm run e2e
npm run test
```

---

## Sprint 2: Onboarding Hardening ✅ COMPLETE

**Goal**: Add precision hints + DST disambiguation

### Tasks
- [x] Add precision hints to birth time field
- [x] Create DstFoldModal component
- [x] Integrate DST modal into onboarding flow
- [x] Handle AMBIGUOUS_LOCAL_TIME error code

### Files to Modify
```
src/app/onboarding/astro/page.tsx
  - Add hint: "Ohne exakte Geburtszeit sinkt Präzision um 10-15%"
  - Add DST modal trigger on error code
  - Real-time validation feedback
```

### Files to Create
```
src/components/onboarding/DstFoldModal.tsx
  - Two-option selector (Standard vs Daylight)
  - Clear explanation of DST ambiguity
  - "fold" parameter passed to API
```

### API Changes
```
src/app/api/astro-compute/route.ts
  - Accept optional "fold" parameter (0 or 1)
  - Pass to compute function
```

### Verification
1. Enter time 2:30 AM on Oct 31
2. DST modal should appear
3. Select option → computation proceeds

---

## Sprint 3: FusionEngine API Stabilization ✅ COMPLETE

**Goal**: Verify Harmony Index + add Zod validation

### Tasks
- [x] Add Zod schema for FusionEngine response - Already comprehensive in schemas.ts
- [x] Verify Harmony Index calculation - 71 tests pass
- [x] Add unit tests for edge cases - 5 test files, full coverage
- [x] Document "Dritte Identität" structure - Types in schemas.ts

### Files to Modify
```
src/server/cosmicEngine/fusion.ts
  - Add Zod schema export
  - Verify harmonyIndex range [0,1]

src/components/astro-sheet/model.ts
  - Ensure FusionData interface matches Zod
```

### Files to Create
```
src/server/cosmicEngine/__tests__/fusion.test.ts
  - Test harmony index bounds
  - Test resonance detection
  - Test element vector normalization
```

### Verification
```bash
npm run test -- --filter fusion
```

---

## Sprint 4: Dashboard UX ✅ COMPLETE

**Goal**: Enhance dashboard with new components

### Tasks
- [x] Create EntfaltungsMatrix component (radar chart with potential visualization)
- [x] Create CrossSystemCard component (West-East alignment display)
- [x] Add data-testid attributes throughout (fusion-card, harmony-index, resonances-section, etc.)
- [x] Integrate Harmony Index display prominently - Already in FusionCard
- [x] Display resonances in UI - Already in FusionCard + new CrossSystemCard

### Files to Create
```
src/components/astro-sheet/EntfaltungsMatrix.tsx
  - Radar chart visualization
  - Unlocked vs Underdeveloped energy
  - Potential visualization

src/components/astro-sheet/CrossSystemCard.tsx
  - "Your Mercury (Western) aligns with Ba Zi Yin Wood"
  - Western + Chinese alignment display
  - Resonance explanations
```

### Files to Modify
```
src/components/astro-sheet/AstroSheet.tsx
  - Import new components
  - Add sections for Matrix + CrossSystem
  - Add data-testid attributes

src/components/astro-sheet/FusionCard.tsx
  - Display Harmony Index prominently
  - Add resonance detail cards
```

### Verification
1. Load /astrosheet
2. EntfaltungsMatrix visible with radar chart
3. CrossSystemCard shows alignments
4. DevTools: data-testid attributes present

---

## Sprint 5: Empowerment Phase (4-5 days)

**Goal**: Profile, Agents, and navigation routes

### Tasks
- [ ] Create /profile page with stats
- [ ] Create /agents page with AI interface
- [ ] Update Sidebar links (remove # hrefs)
- [ ] Implement agent placeholder chat

### Files to Create
```
src/app/(astro)/profile/page.tsx
  - Ressourcen-Gespür display
  - Stabilitätskompetenz metrics
  - Skills diagram layer
  - Quiz completion history

src/app/(astro)/agents/page.tsx
  - AI Agent cards grid
  - Live chat interface (placeholder)
  - Strategic guidance display
  - Premium agent badges
```

### Files to Modify
```
src/components/astro-sheet/Sidebar.tsx
  - Change href='#' to actual routes:
    - Agenten → /agents
    - Premium → /premium
    - Einstellungen → /settings
```

### Verification
1. Click "Profil" in sidebar → /profile loads
2. Click "Agenten" → /agents loads
3. All sidebar links functional

---

## Sprint 6: Social & Premium (3-4 days)

**Goal**: Sharing + premium features

### Tasks
- [ ] Create ShareModal component
- [ ] Implement OG image generation API
- [ ] Create /premium page
- [ ] Implement calculateDailyTransits()

### Files to Create
```
src/components/share/ShareModal.tsx
  - Social platform buttons (Facebook, Instagram, TikTok)
  - Harmony Index in share banner
  - Copy link functionality

src/app/api/og/route.tsx
  - Dynamic OG image generation
  - Include Harmony Index + identity

src/app/(astro)/premium/page.tsx
  - Daily Horoskop with energy peaks
  - Premium gate for non-subscribers
  - Upgrade CTA
```

### Files to Modify
```
src/lib/astro/compute.ts
  - Implement calculateDailyTransits() fully
  - Planetary positions for current day
  - Energy peak calculations
  - Transiting aspects vs natal
```

### Verification
1. Complete a quiz → Share button appears
2. Click Share → Modal with social options
3. /premium shows horoscope or upgrade CTA

---

## Sprint 7: Stub Removal & Cleanup (2-3 days)

**Goal**: Remove all placeholders

### Stubs to Remove

| Stub | File | Action |
|------|------|--------|
| Mock Ba Zi Data | constants.tsx | Use real computed data |
| QUIZZES placeholder | constants.tsx | Dynamic from DB |
| AGENTS placeholder | constants.tsx | Dynamic from config |
| calculateDailyTransits TODO | compute.ts | Full implementation |
| DST "pending" messages | page.tsx | Real DST handling |
| href="#" links | Sidebar.tsx | Real routes |

### Files to Clean
```
src/components/astro-sheet/constants.tsx
  - Remove IDENTITY_DATA mock
  - Remove QUIZZES static array
  - Remove AGENTS static array

src/lib/astro/compute.ts
  - Remove TODO comments
  - Full transit implementation

src/app/onboarding/astro/page.tsx
  - Remove "pending" error messages
```

### Registry Cleanup
```bash
npm run registry:lint
```
Fix any allowlist items that can now be removed.

### Verification
1. `grep -r "TODO" src/` → No critical TODOs
2. `grep -r "placeholder" src/` → No placeholders
3. All E2E tests pass

---

## Timeline Summary

| Sprint | Duration | Focus |
|--------|----------|-------|
| 1 | 1-2 days | Test validation |
| 2 | 2-3 days | Onboarding DST |
| 3 | 1-2 days | FusionEngine |
| 4 | 3-4 days | Dashboard UX |
| 5 | 4-5 days | Profile/Agents |
| 6 | 3-4 days | Social/Premium |
| 7 | 2-3 days | Cleanup |
| **Total** | **16-23 days** | |

---

## Definition of Done (per Sprint)

- [ ] E2E tests pass for sprint features
- [ ] Unit tests pass: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] Manual verification successful
- [ ] Code committed with descriptive message

---

## Quick Start Commands

```bash
# Run all tests
npm run test && npm run e2e

# Start dev server
npm run dev

# Check for stubs
grep -r "TODO\|PLACEHOLDER\|MOCK" src/

# Registry validation
npm run registry:lint
```

---

## Architecture Reference

```
User Journey Flow:
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Onboarding                                         │
│   /onboarding/astro → Birth Data → FusionEngine API         │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: Processing                                         │
│   FusionEngine → Harmony Index → Store in Supabase          │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: Dashboard                                          │
│   /astrosheet → Identity + Fusion + Stats + Quests          │
├─────────────────────────────────────────────────────────────┤
│ Phase 4: Empowerment                                        │
│   /profile → /agents → Quizzes → Skills Growth              │
├─────────────────────────────────────────────────────────────┤
│ Phase 5: Evolution                                          │
│   Share → Premium → Daily Transits → Community              │
└─────────────────────────────────────────────────────────────┘
```
