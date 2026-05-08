/**
 * Phase 1 / Task 1.7 of docs/plans/2026-05-08-dashboard-launch-blockers.md
 *
 * Asserts that when the local clock crosses 06:00 while the dashboard is
 * mounted, useFirstRunDaily auto-refetches without requiring a page reload.
 * User requirement: "Morgens um 6 Uhr muss es automatisch auf das neue
 * Tageshoroskop wechseln."
 *
 * Initial state: this test is RED. The hook does not yet contain a
 * setTimeout-based 06:00 listener. Task 1.8 implements it (and resets
 * `lastFetchedDateRef.current = null` so the hook's existing dedupe
 * guard doesn't suppress the second fetch).
 *
 * Per project doctrine 2026-05-08: behavior described explicitly. Test
 * uses `vi.useFakeTimers()` + `vi.setSystemTime()` + `vi.advanceTimersByTime()`
 * to deterministically simulate the 06:00 crossing without waiting on
 * real wall-clock time.
 *
 * ── Vitest fake-timer semantics ─────────────────────────────────────
 * Pinned to Vitest's current `useFakeTimers({ shouldAdvanceTime, advanceTimeDelta })`
 * + `advanceTimersByTimeAsync` semantics. `shouldAdvanceTime: true` keeps
 * React's internal scheduling from stalling under fake timers; without it
 * the test hangs on the first waitFor. If a future Vitest major release
 * changes this contract, revisit — the failure mode would be a 5s test
 * timeout on the first waitFor rather than a clean assertion error.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { baseDashboardProps } from './_fixtures/dashboard-mount';

// ── Same async vi.mock surface as Task 1.2 (via fixture) ──────────────
vi.mock('react-router-dom', async () => {
  const { contextMocks } = await import('./_fixtures/dashboard-mount');
  return contextMocks.router();
});
vi.mock('@/src/contexts/LanguageContext', async () => {
  const { contextMocks } = await import('./_fixtures/dashboard-mount');
  return contextMocks.language();
});
vi.mock('@/src/contexts/AuthContext', async () => {
  const { contextMocks } = await import('./_fixtures/dashboard-mount');
  return contextMocks.auth();
});
vi.mock('@/src/contexts/PlanetariumContext', async () => {
  const { contextMocks } = await import('./_fixtures/dashboard-mount');
  return contextMocks.planetarium();
});
vi.mock('@/src/contexts/FusionRingContext', async () => {
  const { contextMocks } = await import('./_fixtures/dashboard-mount');
  return contextMocks.fusionRing();
});
vi.mock('@/src/hooks/usePremium', async () => {
  const { hookMocks } = await import('./_fixtures/dashboard-mount');
  return hookMocks.premium();
});
vi.mock('@/src/hooks/useDashboardTour', async () => {
  const { hookMocks } = await import('./_fixtures/dashboard-mount');
  return hookMocks.dashboardTour();
});
vi.mock('@/src/hooks/useDeviceLocation', async () => {
  const { hookMocks } = await import('./_fixtures/dashboard-mount');
  return hookMocks.deviceLocation();
});
vi.mock('@/src/hooks/useCelestialOrrery', async () => {
  const { hookMocks } = await import('./_fixtures/dashboard-mount');
  return hookMocks.celestialOrrery();
});
vi.mock('@/src/hooks/useSpaceWeather', async () => {
  const { hookMocks } = await import('./_fixtures/dashboard-mount');
  return hookMocks.spaceWeather();
});
vi.mock('@/src/hooks/useSignaturSignal', async () => {
  const { hookMocks } = await import('./_fixtures/dashboard-mount');
  return hookMocks.signaturSignal();
});
vi.mock('@/src/hooks/useActiveImpacts', async () => {
  const { hookMocks } = await import('./_fixtures/dashboard-mount');
  return hookMocks.activeImpacts();
});
vi.mock('@/src/lib/feature-flags', async () => {
  const { featureFlagsMock } = await import('./_fixtures/dashboard-mount');
  return featureFlagsMock();
});
vi.mock('@/src/lib/supabase', async () => {
  const { supabaseMockObject } = await import('./_fixtures/dashboard-mount');
  return supabaseMockObject();
});
vi.mock('@/src/services/experience', async () => {
  const { fetchDailyExperienceMockObject } = await import('./_fixtures/dashboard-mount');
  return fetchDailyExperienceMockObject();
});

vi.mock('@/src/components/dashboard/DashboardAstroSection', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.dashboardAstroSection();
});
vi.mock('@/src/components/dashboard/DashboardInterpretationSection', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.dashboardInterpretationSection();
});
vi.mock('@/src/components/dashboard/AgentSection', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.agentSection();
});
vi.mock('@/src/components/dashboard/SectionErrorBoundary', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.sectionErrorBoundary();
});
vi.mock('@/src/components/dashboard/TourOverlay', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.tourOverlay();
});
vi.mock('@/src/components/dashboard/MagnetsturmKarte', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.magnetsturmKarte();
});
vi.mock('@/src/components/dashboard/NatalSignaturStatic', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.natalSignaturStatic();
});
vi.mock('@/src/components/dashboard/DashboardBottomUpgradeCard', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.dashboardBottomUpgradeCard();
});
vi.mock('@/src/components/dashboard/DayModeModal', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.dayModeModal();
});
vi.mock('@/src/components/dashboard/SkyModeToggle', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.skyModeToggle();
});
vi.mock('@/src/components/dashboard/DailyChartHero', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.dailyChartHero();
});
vi.mock('@/src/components/ShareCard', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.shareCard();
});
vi.mock('@/src/components/LegalFooter', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.legalFooter();
});
vi.mock('@/src/components/ManageSubscription', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.manageSubscription();
});
vi.mock('@/src/components/BirthChartOrrery', async () => {
  const { componentStubs } = await import('./_fixtures/dashboard-mount');
  return componentStubs.birthChartOrrery();
});

// ── Imports under test ────────────────────────────────────────────────
import { Dashboard } from '@/src/components/Dashboard';
import * as experienceModule from '@/src/services/experience';

describe('Dashboard — auto-refetch when 06:00 crosses while mounted', () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps React's internal scheduling from stalling under
    // fake timers — it lets the fake clock auto-advance in lockstep with the
    // real wall clock until vi.advanceTimersByTime overrides.
    vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 20 });
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers a second fetchDailyExperience when local time crosses 06:00', { timeout: 15000 }, async () => {
    // Start at 05:30 — 30 minutes before the rotation
    vi.setSystemTime(new Date('2026-05-08T05:30:00'));

    render(<Dashboard {...baseDashboardProps()} />);

    // First fetch on mount (Task 1.2 path)
    await waitFor(
      () => {
        expect(experienceModule.fetchDailyExperience).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );

    // Advance to 06:01 — boundary crossed. The 06:00 listener (Task 1.8)
    // should trigger an automatic refetch via setTimeout(..., msUntilNext6am).
    // msUntilNext6am at 05:30 was 30 minutes; advance by 40 min covers it.
    await act(async () => {
      vi.setSystemTime(new Date('2026-05-08T06:01:00'));
      await vi.advanceTimersByTimeAsync(40 * 60 * 1000);
    });

    await waitFor(
      () => {
        expect(experienceModule.fetchDailyExperience).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 },
    );
  });
});
