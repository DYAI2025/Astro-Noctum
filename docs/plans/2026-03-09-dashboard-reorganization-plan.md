# Implementation Plan: Dashboard Reorganization & Performance Optimization

**Goal:** Reorganize the UI to move interactive and high-GPU modules to dedicated routes, leaving the Dashboard as a clean overview.

## Phase 1: New Page Infrastructure
- [ ] Create `src/pages/WuXingPage.tsx` with SVG visualizations (`WuXingPentagon`, `WuXingCycleWheel`).
- [ ] Register `/wu-xing` route in `src/router.tsx` (lazy-loaded).
- [ ] Add "Detailansicht" link to `/wu-xing` in the WuXing section of `Dashboard.tsx`.

## Phase 2: Finalize Fu Ring Hub
- [ ] Move `ClusterEnergySystem` and `QuizOverlay` from `Dashboard.tsx` to `src/pages/FuRingPage.tsx`.
- [ ] Add `DailyEnergyTeaser` to `FuRingPage.tsx`.
- [ ] Update `FuRingPage.tsx` to handle quiz state (`activeQuiz`) and context data (`signal`, `addQuizResult`, `completedModules`).
- [ ] Ensure clean layout for all energy-related modules on this page.

## Phase 3: Dashboard Cleanup
- [ ] Remove `ClusterEnergySystem`, `QuizOverlay`, and related state from `src/components/Dashboard.tsx`.
- [ ] Clean up `DashboardProps` and `DashboardPage.tsx` prop-drilling.
- [ ] Verify that all unnecessary GPU/render load (animations, live-data) for moved modules is removed from the Dashboard.

## Phase 4: Navigation & UI Consistency
- [ ] Update navigation links in `AppShell` (`src/App.tsx`) to reflect the new structure.
- [ ] Ensure "Deine Energie" (Your Energy System) section is fully relocated.

## Phase 5: Verification
- [ ] Run `npm run lint` to ensure type safety.
- [ ] Manual walkthrough of all three main routes: `/`, `/fu-ring`, `/wu-xing`.
- [ ] Confirm zero residual GPU load from moved modules on the main Dashboard.
