# Implementation Plan: Dashboard Reorganization & Performance Optimization

**Goal:** Reorganize the UI to move interactive and high-GPU modules to dedicated routes, leaving the Dashboard as a clean overview.

## Phase 1: New Page Infrastructure
- [x] Create `src/pages/WuXingPage.tsx` with SVG visualizations (`WuXingPentagon`, `WuXingCycleWheel`).
- [x] Register `/wu-xing` route in `src/router.tsx` (lazy-loaded).
- [x] Add "Detailansicht" link to `/wu-xing` in the WuXing section of `Dashboard.tsx`.

## Phase 2: Finalize Fu Ring Hub
- [x] Move `ClusterEnergySystem` and `QuizOverlay` from `Dashboard.tsx` to `src/pages/FuRingPage.tsx`.
- [x] Add `DailyEnergyTeaser` to `FuRingPage.tsx`.
- [x] Update `FuRingPage.tsx` to handle quiz state (`activeQuiz`) and context data (`signal`, `addQuizResult`, `completedModules`).
- [x] Ensure clean layout for all energy-related modules on this page.

## Phase 3: Dashboard Cleanup
- [x] Remove `ClusterEnergySystem`, `QuizOverlay`, and related state from `src/components/Dashboard.tsx`.
- [x] Clean up `DashboardProps` and `DashboardPage.tsx` prop-drilling.
- [x] Verify that all unnecessary GPU/render load (animations, live-data) for moved modules is removed from the Dashboard.

## Phase 4: Navigation & UI Consistency
- [x] Update navigation links in `AppShell` (`src/App.tsx`) to reflect the new structure.
- [x] Ensure "Deine Energie" (Your Energy System) section is fully relocated.

## Phase 5: Verification
- [x] Run `npm run lint` to ensure type safety.
- [x] Manual walkthrough of all three main routes: `/`, `/fu-ring`, `/wu-xing`.
- [x] Confirm zero residual GPU load from moved modules on the main Dashboard.
