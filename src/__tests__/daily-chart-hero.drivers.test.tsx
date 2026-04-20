/**
 * DailyChartHero — driver strip no longer includes the meaningless "Tagesfeld" pill (Phase 2).
 * See docs/plans/2026-04-20-dashboard-signatur-gaps.md §Phase 2.
 */

import { render, screen, within } from '@testing-library/react';
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
  baseCoherence: 60,
  positiveDailyDelta: 5,
  displayedCoherence: 65,
  spaceWeather: NULL_SPACE_WEATHER,
  transitEvents: [],
  dayMode: 'pulse' as const,
};

describe('DailyChartHero — driver strip (Tagesfeld removed)', () => {
  it('does not render the Tagesfeld pill', () => {
    render(<DailyChartHero {...base} />);
    const strip = screen.getByTestId('driver-strip');
    expect(within(strip).queryByText('Tagesfeld')).toBeNull();
    expect(within(strip).queryByText('Day field')).toBeNull();
  });

  it('renders exactly 3 driver pills (Geomagnetik, Solardruck, Transit-Aktivität)', () => {
    render(<DailyChartHero {...base} />);
    const strip = screen.getByTestId('driver-strip');
    expect(within(strip).getByText('Geomagnetik')).toBeTruthy();
    expect(within(strip).getByText('Solardruck')).toBeTruthy();
    expect(within(strip).getByText('Transit-Aktivität')).toBeTruthy();
    // Each pill is a single div with label + value → count children of the strip
    expect(strip.children).toHaveLength(3);
  });
});
