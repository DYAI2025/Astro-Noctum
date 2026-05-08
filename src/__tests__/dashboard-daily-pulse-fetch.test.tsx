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
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';

// ── Router ─────────────────────────────────────────────────────────────────
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// ── Contexts ───────────────────────────────────────────────────────────────
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const, t: (k: string) => k }),
}));
vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));
vi.mock('@/src/contexts/PlanetariumContext', () => ({
  usePlanetarium: () => ({
    setPlanetariumMode: vi.fn(),
    planetariumMode: false,
    skyMode: 'natal',
  }),
}));
vi.mock('@/src/contexts/FusionRingContext', () => ({
  useFusionRingContext: () => ({ events: [] }),
}));

// ── Hooks not under test ───────────────────────────────────────────────────
vi.mock('@/src/hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: false, loading: false }),
}));
vi.mock('@/src/hooks/useDashboardTour', () => ({
  useDashboardTour: () => ({ tourStep: 'done' as const, next: vi.fn(), skip: vi.fn() }),
  isTourStepVisible: () => false,
}));
vi.mock('@/src/hooks/useDeviceLocation', () => ({
  useDeviceLocation: () => null,
}));
vi.mock('@/src/hooks/useCelestialOrrery', () => ({
  useCelestialOrrery: () => ({
    simTime: 0,
    currentDate: new Date('2026-05-08T12:00:00'),
    isPlaying: false,
    setIsPlaying: vi.fn(),
  }),
}));
vi.mock('@/src/hooks/useSpaceWeather', () => ({
  useSpaceWeather: () => ({ kpIndex: 2, solarPressure: 0.3, loading: false }),
}));
vi.mock('@/src/hooks/useSignaturSignal', () => ({
  useSignaturSignal: () => ({ events: [], loading: false }),
}));
vi.mock('@/src/hooks/useActiveImpacts', () => ({
  useActiveImpacts: () => ({
    harmonyIndex: 0.5,
    baseCoherence: 50,
    positiveDailyDelta: 0,
    displayedCoherence: 50,
  }),
}));
vi.mock('@/src/lib/feature-flags', () => ({ isFeatureEnabled: () => false }));

// ── Supabase: returns a COMPLETE astro_profile so birthInput populates ─────
//    Without this, useFirstRunDaily's `if (!userId || !birthData)` guard
//    suppresses the fetch and we never reach the assertion.
vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => {
            if (table === 'astro_profiles') {
              return Promise.resolve({
                data: {
                  birth_date: '1990-01-15',
                  birth_time: '12:00',
                  iana_time_zone: 'Europe/Berlin',
                  birth_lat: 52.52,
                  birth_lng: 13.405,
                  soulprint_sectors: Array(12).fill(0.5),
                },
                error: null,
              });
            }
            if (table === 'birth_data') {
              return Promise.resolve({ data: { place_label: 'Berlin' }, error: null });
            }
            if (table === 'profiles') {
              return Promise.resolve({ data: { daily_modal_seen_date: null }, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
        }),
      }),
      update: () => ({
        eq: () => ({ then: (cb: any) => cb({ error: null }) }),
      }),
    }),
  },
}));

// ── The thing we're spying on ──────────────────────────────────────────────
vi.mock('@/src/services/experience', () => ({
  fetchDailyExperience: vi.fn(() =>
    Promise.resolve({
      date: '2026-05-08',
      western: { summary: '', themes: [], caution: '', opportunity: '', evidence: {} },
      eastern: { summary: '', themes: [], caution: '', opportunity: '', evidence: {} },
      fusion: {
        summary: 'real summary',
        synthesis: 'Real horoscope text from FuFirE',
        action: 'do something',
        pushworthy: false,
        push_text: '',
        harmony_index: 0.5,
        day_mode: 'pulse',
      },
      meta: { engine_version: 'fufire-v2' },
    }),
  ),
}));

// ── Heavy components — replaced with stubs to keep the test focused ────────
vi.mock('@/src/components/dashboard/DashboardAstroSection', () => ({
  DashboardAstroSection: () => <div data-testid="astro-section" />,
}));
vi.mock('@/src/components/dashboard/DashboardInterpretationSection', () => ({
  DashboardInterpretationSection: () => <div data-testid="interp" />,
}));
vi.mock('@/src/components/dashboard/AgentSection', () => ({
  AgentSection: () => <div data-testid="agent-section" />,
}));
vi.mock('@/src/components/dashboard/SectionErrorBoundary', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/src/components/dashboard/TourOverlay', () => ({ TourOverlay: () => null }));
vi.mock('@/src/components/dashboard/MagnetsturmKarte', () => ({ MagnetsturmKarte: () => null }));
vi.mock('@/src/components/dashboard/NatalSignaturStatic', () => ({
  NatalSignaturStatic: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/src/components/dashboard/DashboardBottomUpgradeCard', () => ({
  DashboardBottomUpgradeCard: () => null,
}));
vi.mock('@/src/components/dashboard/DayModeModal', () => ({ DayModeModal: () => null }));
vi.mock('@/src/components/dashboard/SkyModeToggle', () => ({ SkyModeToggle: () => null }));
vi.mock('@/src/components/dashboard/DailyChartHero', () => ({
  DailyChartHero: () => <div data-testid="daily-chart-hero" />,
}));
vi.mock('@/src/components/ShareCard', () => ({ ShareCard: () => null }));
vi.mock('@/src/components/LegalFooter', () => ({ LegalFooter: () => null }));
vi.mock('@/src/components/ManageSubscription', () => ({ ManageSubscription: () => null }));
vi.mock('@/src/components/BirthChartOrrery', () => ({ BirthChartOrrery: () => null }));

// ── Imports under test (after mocks above) ─────────────────────────────────
import { Dashboard } from '@/src/components/Dashboard';
import * as experienceModule from '@/src/services/experience';

// ApiData stub: only the fields Dashboard actually reads
const minimalApiData = {
  western: { zodiac_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo' },
  bazi: { zodiac_sign: 'Dragon' },
  wuxing: { dominant_element: 'Wood' },
} as any;

const baseProps = {
  interpretation: '',
  apiData: minimalApiData,
  userId: 'test-user-id',
  birthDate: '1990-01-15',
  onReset: vi.fn(),
  isLoading: false,
  apiIssues: [],
  onStopAudio: vi.fn(),
  onResumeAudio: vi.fn(),
};

describe('Dashboard — Daily Pulse fetch on mount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls fetchDailyExperience exactly once on mount when birth profile is complete', async () => {
    render(<Dashboard {...baseProps} />);

    // The fetch is async — Supabase profile query first, then localStorage check,
    // then the actual fetchDailyExperience call. Allow up to 3s for the chain.
    await waitFor(
      () => {
        expect(experienceModule.fetchDailyExperience).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
  });
});
