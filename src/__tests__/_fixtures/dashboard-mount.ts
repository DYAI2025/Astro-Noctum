/**
 * Shared test fixture for Dashboard.tsx mount tests.
 *
 * Extracted 2026-05-08 (Task 1.7) from src/__tests__/dashboard-daily-pulse-fetch.test.tsx
 * after the 2nd duplicate appeared. Tests for the dashboard need a non-trivial
 * mock surface (4 contexts + 7 hooks + supabase + ~12 component stubs); this
 * module centralizes the data-heavy parts so each test only declares the
 * mocks it needs differently.
 *
 * ── Constraint: Vitest hoisting and async vi.mock factories ──────────
 * `vi.mock(path, factory)` calls in the test file are hoisted above all
 * static imports. That means a test cannot import a function from this
 * fixture and use it directly inside a synchronous mock factory — the
 * function is `undefined` at hoisting time.
 *
 * The pattern used by tests that consume this fixture: declare each
 * mock with an ASYNC factory that imports the fixture lazily:
 *
 *   vi.mock('@/src/lib/supabase', async () => {
 *     const { supabaseMockObject } = await import('./_fixtures/dashboard-mount');
 *     return supabaseMockObject();
 *   });
 *
 * Vitest awaits the factory before the mocked module is first imported,
 * so the dynamic import resolves cleanly. This keeps the test file's
 * mock surface small (4-6 lines per mock) without giving up sharing.
 *
 * Pure data builders (no `vi.fn()`, no module-shape) can be imported
 * statically — they're invoked from the test body, not the mock layer.
 */
import { vi } from 'vitest';
import React from 'react';
import type { ApiData } from '@/src/types/bafe';

// ── Pure data builders (safe for static import) ─────────────────────

export function minimalApiData(): ApiData {
  return {
    western: { zodiac_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo' },
    bazi: { zodiac_sign: 'Dragon' },
    wuxing: { dominant_element: 'Wood' },
  } as ApiData;
}

export interface DashboardTestProps {
  interpretation: string;
  apiData: ApiData;
  userId: string;
  birthDate: string | null;
  onReset: () => void;
  isLoading: boolean;
  apiIssues: { endpoint: string; message: string }[];
  onStopAudio: () => void;
  onResumeAudio: () => void;
}

export function baseDashboardProps(overrides: Partial<DashboardTestProps> = {}): DashboardTestProps {
  return {
    interpretation: '',
    apiData: minimalApiData(),
    userId: 'test-user-id',
    birthDate: '1990-01-15',
    onReset: vi.fn(),
    isLoading: false,
    apiIssues: [],
    onStopAudio: vi.fn(),
    onResumeAudio: vi.fn(),
    ...overrides,
  };
}

// ── Mock module factories (consumed via async vi.mock) ──────────────

/**
 * Returns the shape vi.mock(...) needs for `@/src/lib/supabase`.
 * The supabase mock dispatches per-table so the dashboard's profile
 * + birth_data + profiles queries all return the right shape.
 */
export function supabaseMockObject(options: { astroProfile?: unknown; placeLabel?: string } = {}) {
  const astroProfileData = options.astroProfile ?? {
    birth_date: '1990-01-15',
    birth_time: '12:00',
    iana_time_zone: 'Europe/Berlin',
    birth_lat: 52.52,
    birth_lng: 13.405,
    soulprint_sectors: Array(12).fill(0.5),
  };
  const placeLabel = options.placeLabel ?? 'Berlin';

  return {
    supabase: {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => {
              if (table === 'astro_profiles') {
                return Promise.resolve({ data: astroProfileData, error: null });
              }
              if (table === 'birth_data') {
                return Promise.resolve({ data: { place_label: placeLabel }, error: null });
              }
              if (table === 'profiles') {
                return Promise.resolve({ data: { daily_modal_seen_date: null }, error: null });
              }
              return Promise.resolve({ data: null, error: null });
            },
          }),
        }),
        update: () => ({
          eq: () => ({ then: (cb: (r: { error: null }) => unknown) => cb({ error: null }) }),
        }),
      }),
    },
  };
}

/**
 * Returns the shape vi.mock(...) needs for `@/src/services/experience`.
 * Sets up `fetchDailyExperience` as a vi.fn() returning a complete
 * (success-path) DailyResponse. Tests that need to assert the spy can
 * import the module and `vi.spyOn(experience, 'fetchDailyExperience')`,
 * or — preferred — re-create the spy in their own setup.
 */
export function fetchDailyExperienceMockObject(overrides: Record<string, unknown> = {}) {
  return {
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
        ...overrides,
      }),
    ),
  };
}

/** Standard context mocks — small enough to inline-call from each test's vi.mock. */
export const contextMocks = {
  router: () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    Link: ({ children, ...props }: { children: React.ReactNode; [k: string]: unknown }) =>
      React.createElement('a', props, children),
  }),
  language: () => ({ useLanguage: () => ({ lang: 'de' as const, t: (k: string) => k }) }),
  auth: () => ({ useAuth: () => ({ user: { id: 'test-user-id' } }) }),
  planetarium: () => ({
    usePlanetarium: () => ({ setPlanetariumMode: vi.fn(), planetariumMode: false, skyMode: 'natal' }),
  }),
  fusionRing: () => ({ useFusionRingContext: () => ({ events: [] }) }),
};

/** Standard hook mocks — small enough to inline-call from each test's vi.mock. */
export const hookMocks = {
  premium: () => ({ usePremium: () => ({ isPremium: false, loading: false }) }),
  dashboardTour: () => ({
    useDashboardTour: () => ({ tourStep: 'done' as const, next: vi.fn(), skip: vi.fn() }),
    isTourStepVisible: () => false,
  }),
  deviceLocation: () => ({ useDeviceLocation: () => null }),
  celestialOrrery: () => ({
    useCelestialOrrery: () => ({
      simTime: 0,
      currentDate: new Date('2026-05-08T12:00:00'),
      isPlaying: false,
      setIsPlaying: vi.fn(),
    }),
  }),
  spaceWeather: () => ({ useSpaceWeather: () => ({ kpIndex: 2, solarPressure: 0.3, loading: false }) }),
  signaturSignal: () => ({ useSignaturSignal: () => ({ events: [], loading: false }) }),
  activeImpacts: () => ({
    useActiveImpacts: () => ({
      harmonyIndex: 0.5,
      baseCoherence: 50,
      positiveDailyDelta: 0,
      displayedCoherence: 50,
    }),
  }),
};

/** Heavy-component stubs to avoid recursive mock setup. */
export const componentStubs = {
  dashboardAstroSection: () => ({
    DashboardAstroSection: () => React.createElement('div', { 'data-testid': 'astro-section' }),
  }),
  dashboardInterpretationSection: () => ({
    DashboardInterpretationSection: () => React.createElement('div', { 'data-testid': 'interp' }),
  }),
  agentSection: () => ({
    AgentSection: () => React.createElement('div', { 'data-testid': 'agent-section' }),
  }),
  sectionErrorBoundary: () => ({
    SectionErrorBoundary: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  }),
  tourOverlay: () => ({ TourOverlay: () => null }),
  magnetsturmKarte: () => ({ MagnetsturmKarte: () => null }),
  natalSignaturStatic: () => ({
    NatalSignaturStatic: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', null, children),
  }),
  dashboardBottomUpgradeCard: () => ({ DashboardBottomUpgradeCard: () => null }),
  dayModeModal: () => ({ DayModeModal: () => null }),
  skyModeToggle: () => ({ SkyModeToggle: () => null }),
  /**
   * ⚠️ Stub of DailyChartHero — used by tests that focus on Dashboard behavior
   * (e.g., does fetchDailyExperience fire on mount). DO NOT enable this stub
   * when the unit-under-test IS DailyChartHero — the assertion would silently
   * pass against the stub instead of the real component. See
   * `daily-chart-hero-no-placeholder.test.tsx` for the correct pattern
   * (imports DailyChartHero directly without this stub).
   */
  dailyChartHero: () => ({
    DailyChartHero: () => React.createElement('div', { 'data-testid': 'daily-chart-hero' }),
  }),
  shareCard: () => ({ ShareCard: () => null }),
  legalFooter: () => ({ LegalFooter: () => null }),
  manageSubscription: () => ({ ManageSubscription: () => null }),
  birthChartOrrery: () => ({ BirthChartOrrery: () => null }),
};

export const featureFlagsMock = () => ({ isFeatureEnabled: () => false });
