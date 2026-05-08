/**
 * Phase 1 / Task 1.9 of docs/plans/2026-05-08-dashboard-launch-blockers.md
 *
 * Pins three contract guarantees on `DailyChartHero`:
 *   1. `loading: true` shows the skeleton (existing testid — regression armor).
 *   2. `error: { code, message }` renders a prominent `[CODE]` block
 *      with `role="alert"` per project doctrine (errors surfaced, not masked).
 *   3. When BOTH `error` and `impulsText` are set, error WINS — stale cached
 *      text must NOT render alongside an active error (no masquerade).
 *
 * Initial state: tests 2 + 3 are RED. The `error` prop is in the interface
 * (Task 1.11) but the component does not yet render an error branch. Task
 * 1.10 implements the rendering. Test 1 is regression armor only.
 *
 * Per project doctrine 2026-05-08: "Es dürfen keine Platzhalter oder
 * irreführende Fallbacks angewandt werden. Der Fehler muss deutlich
 * sichtbar sein mit Fehlercode und kurzer Meldung auf Englisch was genau
 * fehlschlägt." This test pins the surface that satisfies the doctrine.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';
import type { TransitEvent } from '@/src/lib/schemas/transit-state';

// ── Lightweight context mock — DailyChartHero only reads `lang` ─────
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const }),
}));

// ── Stub the heavy ActiveImpactsList — independent of these tests ───
vi.mock('@/src/components/shared/ActiveImpactsList', () => ({
  ActiveImpactsList: () => null,
}));

import { DailyChartHero, type DailyChartHeroProps } from '@/src/components/dashboard/DailyChartHero';

// SpaceWeatherState is large; the component reads only `kpIndex`, `solarPressure`,
// and treats `events` indirectly via transitEvents prop. Cast the rest.
const stubSpaceWeather = {
  kpIndex: 2,
  solarPressure: 0.3,
  events: [],
  alerts: [],
  loading: false,
  error: null,
} as unknown as SpaceWeatherState;

const baseProps: DailyChartHeroProps = {
  loading: false,
  baseCoherence: 50,
  positiveDailyDelta: 0,
  displayedCoherence: 50,
  spaceWeather: stubSpaceWeather,
  transitEvents: [] as TransitEvent[],
  dayMode: 'pulse',
  birthSign: 'Aries',
  impulsText: undefined,
  profileIncomplete: false,
  onCompleteProfile: undefined,
  onOpenDayModal: undefined,
  error: null,
};

describe('DailyChartHero — placeholder-free contract (project doctrine 2026-05-08)', () => {
  it('renders the skeleton when loading=true (existing testid, regression armor)', () => {
    render(<DailyChartHero {...baseProps} loading />);
    expect(screen.getByTestId('daily-chart-hero-skeleton')).toBeInTheDocument();
    // Sanity: no generic placeholder strings leaked through
    expect(screen.queryByText(/dummy|lorem|placeholder/i)).toBeNull();
  });

  it('renders an [ERROR-CODE] error block when `error` prop is set', () => {
    render(
      <DailyChartHero
        {...baseProps}
        error={{
          code: 'DAILY-PULSE-FETCH-FAILED-503',
          message: 'FuFirE /api/experience/daily returned HTTP 503.',
        }}
      />,
    );
    const errorBlock = screen.getByTestId('daily-pulse-error');
    expect(errorBlock).toBeInTheDocument();
    expect(errorBlock).toHaveAttribute('role', 'alert');
    expect(screen.getByTestId('daily-pulse-error-code')).toHaveTextContent('[DAILY-PULSE-FETCH-FAILED-503]');
    expect(screen.getByTestId('daily-pulse-error-message')).toHaveTextContent(
      'FuFirE /api/experience/daily returned HTTP 503.',
    );
  });

  it('error wins over impulsText — no stale-data masking when fetch failed', () => {
    // Doctrine: error wins. Never render a cached value as if it were live
    // when something is currently failing.
    render(
      <DailyChartHero
        {...baseProps}
        impulsText="stale cached horoscope text from a prior successful fetch"
        error={{
          code: 'DAILY-PULSE-FETCH-FAILED-NETWORK',
          message: 'Network error reaching /api/experience/daily.',
        }}
      />,
    );
    expect(screen.getByTestId('daily-pulse-error')).toBeInTheDocument();
    // The cached text MUST NOT be rendered as Tagesimpuls when error is active
    expect(screen.queryByText('stale cached horoscope text from a prior successful fetch')).toBeNull();
    // The Tagesimpuls section testid (used in success path) must also not appear
    expect(screen.queryByTestId('day-impulse-section')).toBeNull();
  });

  // F2 of docs/plans/2026-05-09-sustainable-findings-cleanup.md.
  // Regression armor for the negative path: error=null + impulsText set →
  // impulse renders, error block absent. Pins the "happy path stays happy"
  // contract.
  it('does NOT render error block when error is null and impulsText is set', () => {
    render(
      <DailyChartHero
        {...baseProps}
        impulsText="real horoscope text from a successful fetch"
        error={null}
      />,
    );
    // Error block must be absent
    expect(screen.queryByTestId('daily-pulse-error')).toBeNull();
    expect(screen.queryByTestId('daily-pulse-error-code')).toBeNull();
    expect(screen.queryByTestId('daily-pulse-error-message')).toBeNull();
    // Impulse section must be present with the real text
    expect(screen.getByTestId('day-impulse-section')).toBeInTheDocument();
    expect(
      screen.getByText('real horoscope text from a successful fetch'),
    ).toBeInTheDocument();
  });
});
