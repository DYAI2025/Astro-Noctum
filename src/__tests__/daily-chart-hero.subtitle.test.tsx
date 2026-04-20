/**
 * DailyChartHero — dynamic coherence-subtitle reflects delta direction (Phase 1).
 * Target: no UI lie when delta is 0 or negative.
 * See docs/plans/2026-04-20-dashboard-signatur-gaps.md Phase 1.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DailyChartHero } from '../components/dashboard/DailyChartHero';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
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

const base = {
  loading: false,
  spaceWeather: NULL_SPACE_WEATHER,
  activePlanets: [],
  transitEvents: [],
  dayMode: 'pulse' as const,
};

describe('DailyChartHero — dynamic coherence subtitle', () => {
  it('shows raised language when delta > 0', () => {
    render(
      <DailyChartHero
        {...base}
        baseCoherence={60}
        positiveDailyDelta={8}
        displayedCoherence={68}
      />,
    );
    expect(screen.getByText(/angehoben auf 68/i)).toBeTruthy();
  });

  it('shows dampened language when delta < 0', () => {
    render(
      <DailyChartHero
        {...base}
        baseCoherence={60}
        positiveDailyDelta={-5}
        displayedCoherence={55}
      />,
    );
    expect(screen.getByText(/gedämpft/i)).toBeTruthy();
  });

  it('shows neutral language when |delta| <= 0.01', () => {
    render(
      <DailyChartHero
        {...base}
        baseCoherence={60}
        positiveDailyDelta={0}
        displayedCoherence={60}
      />,
    );
    expect(screen.getByText(/ohne spürbare/i)).toBeTruthy();
  });

  it('rounds base and displayed values to integers', () => {
    render(
      <DailyChartHero
        {...base}
        baseCoherence={60.4}
        positiveDailyDelta={7.6}
        displayedCoherence={68}
      />,
    );
    expect(screen.getByText(/Basiswert 60,.*angehoben auf 68/i)).toBeTruthy();
  });
});
