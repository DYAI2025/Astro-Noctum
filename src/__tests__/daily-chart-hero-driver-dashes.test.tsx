/**
 * DailyChartHero — Driver Strip em-dash placeholders (TASK-4.3).
 *
 * The Driver Strip renders three space-weather values: geomagnetic Kp,
 * solar pressure, transit activity. When upstream values are null/undefined
 * (NOAA SWPC outage, useSpaceWeather() pre-resolve, malformed cache), the
 * previous code rendered "Kp null", "0%" (misleading), or crashed on
 * `.toFixed()` / `.length` access.
 *
 * Now nullish values render as em-dash "—" — visible degraded state, no
 * crash, no misleading data.
 *
 * See docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md §Task 4.3.
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

const HEALTHY_SPACE_WEATHER: SpaceWeatherState = {
  kpIndex: 3,
  solarPressure: 0.42,
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
  spaceWeather: HEALTHY_SPACE_WEATHER,
  transitEvents: [],
  dayMode: 'pulse' as const,
  birthSign: 'Aries',
  impulsText: 'Some daily impulse.',
  profileIncomplete: false,
  onCompleteProfile: () => {},
  onOpenDayModal: () => {},
};

describe('DailyChartHero Driver Strip dashes (TASK-4.3)', () => {
  it('DCH-DASH-001: renders normal numeric values when all spaceWeather fields are present (regression)', () => {
    render(<DailyChartHero {...baseProps} />);
    const strip = screen.getByTestId('driver-strip');
    // Happy path: real values render
    expect(strip).toHaveTextContent('Kp 3');
    expect(strip).toHaveTextContent('42%');
    expect(strip).toHaveTextContent('0');
    // No em-dash on healthy data
    expect(strip).not.toHaveTextContent('—');
  });

  it('DCH-DASH-002: renders em-dash when kpIndex is null', () => {
    const partial = {
      ...HEALTHY_SPACE_WEATHER,
      kpIndex: null,
    } as unknown as SpaceWeatherState;
    render(<DailyChartHero {...baseProps} spaceWeather={partial} />);
    const strip = screen.getByTestId('driver-strip');
    expect(strip).toHaveTextContent('—');
    // Solar pressure still renders normally (independent guard)
    expect(strip).toHaveTextContent('42%');
    // Must NOT render the misleading "Kp null"
    expect(strip).not.toHaveTextContent('Kp null');
    expect(strip).not.toHaveTextContent('NaN');
  });

  it('DCH-DASH-003: renders em-dash for all three drivers when spaceWeather is fully degraded', () => {
    const allNull = {
      ...HEALTHY_SPACE_WEATHER,
      kpIndex: null,
      solarPressure: null,
    } as unknown as SpaceWeatherState;
    render(
      <DailyChartHero
        {...baseProps}
        spaceWeather={allNull}
        transitEvents={undefined as never}
      />,
    );
    const strip = screen.getByTestId('driver-strip');
    // All three slots must show em-dash
    const dashes = strip.textContent?.match(/—/g) ?? [];
    expect(dashes.length).toBeGreaterThanOrEqual(3);
    // No crash, no misleading values
    expect(strip).not.toHaveTextContent('NaN');
    expect(strip).not.toHaveTextContent('null');
    expect(strip).not.toHaveTextContent('undefined');
  });
});
