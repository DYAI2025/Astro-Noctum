// src/__tests__/dashboard-single-cta.test.tsx
//
// Phase F BASELINE — Single-CTA invariant for the Dashboard.
//
// Asserts the contract that drives Phases C/D of the
// 2026-05-07 dashboard CTA consolidation:
//
//   • SCV-FREE-001 — a free user on `/` sees EXACTLY ONE upgrade button.
//     Today the Dashboard renders ~5 CTAs simultaneously (bottom upgrade
//     card + each <PremiumGate> wrapper + each <AgentSection> tile when
//     freemium). After Phase C (PremiumGate becomes info-only — no inline
//     UpgradeButton) and Phase D (AgentSection lock-only + AgentFloatingWidget
//     gated + nav-locks via useUpgradeCheckout), the bottom card's
//     <UpgradeButton/> at Dashboard.tsx:498 will be the sole CTA.
//
//   • SCV-PREM-001 — a premium user on `/` sees ZERO upgrade buttons.
//     This is already true in production today (the bottom upgrade card is
//     conditional on `!isPremium`, PremiumGate returns children directly,
//     AgentSection renders the call/hangup button instead).
//
// Status — committed as `it.todo` because mounting the real <Dashboard/>
// would require >80 LOC of data-hook mocks (useFusionRingContext,
// useCelestialOrrery, useSpaceWeather, useSignaturSignal, useActiveImpacts,
// useDeviceLocation, useFirstRunDaily, useDashboardTour, supabase profile
// fetch, plus DashboardAstroSection's transitive deps via NatalSignaturStatic,
// BaZiFourPillars, AstroDetailModal, DashboardHeroNav, etc.) AND must keep
// PremiumGate, UpgradeButton, AgentSection, DashboardAstroSection,
// DashboardInterpretationSection, DashboardTagesEnergie unmocked so the
// real CTAs are observed. The brief explicitly accepts `it.todo` for this
// case (Option B) — Phase F-final will replace these with real renders
// once the surface is reduced by Phases C/D and the test file no longer
// has to count five distinct CTA paths.
//
// When Phase F-final lifts the todos, the matcher should be:
//   const upgradeButtons = screen.getAllByRole('button', {
//     name: /upgrade|premium freischalten|abo/i,
//   });
//   expect(upgradeButtons).toHaveLength(1);  // free
//   expect(upgradeButtons).toHaveLength(0);  // premium
//
// References:
//   docs/plans/2026-05-07-dashboard-cta-consolidation.md  Phase F (Task 10/11)
//   docs/upgrade-cta-inventory-2026-05-07.md
//   src/components/Dashboard.tsx:498        — the prime CTA (KEEP)
//   src/components/PremiumGate.tsx:32       — duplicate CTA path (DROP in Phase C)
//   src/components/dashboard/AgentSection.tsx:180  — duplicate CTA path (DROP in Phase D)
//   src/components/AgentFloatingWidget.tsx:209     — duplicate CTA path (HIDE in Phase D)
//
import { describe, it } from 'vitest';

describe('Dashboard single-CTA invariant (Phase F baseline)', () => {
  // SCV-FREE-001: today this would FAIL with `expected 1, received 4` (or 5)
  // — that failure is the contract that drives Phase C (PremiumGate
  // becomes info-only) + Phase D (AgentSection lock-only +
  // AgentFloatingWidget gated). Promote to a real assertion in Phase F-final
  // once those phases ship.
  it.todo(
    'SCV-FREE-001: free user on / sees exactly one upgrade CTA ' +
      '(matcher: getAllByRole("button", { name: /upgrade|premium freischalten|abo/i }) → length 1)',
  );

  // SCV-PREM-001: today this would PASS — no upgrade CTAs render for
  // premium users on `/`. Promote to a real assertion in Phase F-final
  // alongside SCV-FREE-001 so the duplicate-CTA fix is regression-proof
  // for both branches.
  it.todo(
    'SCV-PREM-001: premium user on / sees no upgrade CTA ' +
      '(matcher: queryAllByRole("button", { name: /upgrade|premium freischalten|abo/i }) → length 0)',
  );
});
