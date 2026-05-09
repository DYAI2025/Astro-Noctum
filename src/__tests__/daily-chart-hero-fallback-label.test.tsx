/**
 * DailyChartHero — fallback indicator (TASK-D2).
 *
 * When useFirstRunDaily() falls back to buildFallbackDaily() (FuFirE/Gemini
 * down), meta.engine_version === 'v1-local-fallback' is set. Dashboard.tsx
 * forwards that as `isFallback` to DailyChartHero, which renders a small,
 * low-contrast indicator under the Tagesimpuls paragraph so the user knows
 * the content is generic rather than a real personalized horoscope.
 *
 * See docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md §Task D2.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DailyChartHero } from '../components/dashboard/DailyChartHero';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

vi.mock('../lib/astro-data/planetInfluences', () => ({
  computeTodayPlanetInfluences: vi.fn(() => null),
  zodiacSignToIndex: vi.fn(() => -1),
}));

const NULL_SPACE_WEATHER: SpaceWeatherState = {
  kpIndex: 0,
  solarPressure: 0,
  ringModulation: 1,
  intensityBoost: 0,
  triggerEffect: false,
  gScale: 'G0',
  xrayFlux: 0,
  xrayClass: 'A',
  protonFlux: 0,
  f107: 70,
  solarCyclePhase: 'minimum',
  events: [],
  alerts: [],
  lastUpdate: null,
  loading: false,
  error: null,
};

const baseProps = {
  loading: false,
  baseCoherence: 60,
  positiveDailyDelta: 0,
  displayedCoherence: 60,
  spaceWeather: NULL_SPACE_WEATHER,
  transitEvents: [],
  dayMode: 'pulse' as const,
  birthSign: 'Aries',
  impulsText: 'Generic fallback text.',
  profileIncomplete: false,
  onCompleteProfile: () => {},
  onOpenDayModal: () => {},
};

describe('DailyChartHero fallback indicator (TASK-D2)', () => {
  it('DCH-FB-001: shows fallback indicator when isFallback=true and impuls is present', () => {
    render(<DailyChartHero {...baseProps} isFallback={true} />);
    expect(screen.getByTestId('fallback-indicator')).toBeInTheDocument();
    expect(screen.getByText(/Heute nicht verfügbar/i)).toBeInTheDocument();
  });

  it('DCH-FB-002: NO indicator when isFallback=false (default)', () => {
    render(<DailyChartHero {...baseProps} isFallback={false} />);
    expect(screen.queryByTestId('fallback-indicator')).not.toBeInTheDocument();
  });

  it('DCH-FB-003: NO indicator when isFallback=true but impulsText empty', () => {
    render(
      <DailyChartHero
        {...baseProps}
        isFallback={true}
        impulsText={undefined}
        profileIncomplete={true}
      />,
    );
    expect(screen.queryByTestId('fallback-indicator')).not.toBeInTheDocument();
  });
});
