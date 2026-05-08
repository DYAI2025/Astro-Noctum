/**
 * Phase 1 / Task 1.2 of docs/plans/2026-05-08-dashboard-launch-blockers.md
 *
 * Asserts that on Dashboard mount with a complete birth profile, the FuFirE
 * pipeline (fetchDailyExperience → POST /api/experience/daily) is invoked
 * exactly once. This is regression armor for the Daily Pulse launch blocker.
 *
 * Per project doctrine 2026-05-08: errors are surfaced, not masked. This test
 * gates the success path; companion tests in Tasks 1.9-1.12 cover the error
 * path with explicit [CODE] message rendering.
 *
 * Refactored 2026-05-08 (Task 1.7) to use the shared dashboard-mount fixture.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { baseDashboardProps } from './_fixtures/dashboard-mount';

// ── Async vi.mock factories — use the fixture lazily to satisfy hoisting ──
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

// Heavy components (stubbed via fixture)
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

// ── Imports under test (after vi.mock above) ──────────────────────────
import { Dashboard } from '@/src/components/Dashboard';
import * as experienceModule from '@/src/services/experience';

describe('Dashboard — Daily Pulse fetch on mount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls fetchDailyExperience exactly once on mount when birth profile is complete', async () => {
    render(<Dashboard {...baseDashboardProps()} />);

    // The fetch is async — supabase query first, then localStorage check,
    // then fetchDailyExperience. Allow up to 3s for the chain.
    await waitFor(
      () => {
        expect(experienceModule.fetchDailyExperience).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });
});
