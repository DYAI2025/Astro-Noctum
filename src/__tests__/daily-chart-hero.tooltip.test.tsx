/**
 * DailyChartHero — hover tooltip explains the coherence index (Phase 3).
 * Text source: docs/KOHAERENZ_INDEX.md §3.1–3.2 destilliert (see plan §Phase 3).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const baseProps = {
  loading: false,
  baseCoherence: 60,
  positiveDailyDelta: 5,
  displayedCoherence: 65,
  spaceWeather: NULL_SPACE_WEATHER,
  activePlanets: [],
  transitEvents: [],
  dayMode: 'pulse' as const,
};

describe('DailyChartHero — coherence tooltip', () => {
  it('exposes the coherence ring as a tooltip trigger', () => {
    render(<DailyChartHero {...baseProps} />);
    expect(screen.getByTestId('coherence-ring')).toBeTruthy();
  });

  it('shows explanatory tooltip after hovering the ring', async () => {
    const user = userEvent.setup();
    render(<DailyChartHero {...baseProps} />);
    const ring = screen.getByTestId('coherence-ring');
    await user.hover(ring);
    // Radix renders tooltip content twice (visible + visually-hidden for a11y) → use findAllByText.
    const matches = await screen.findAllByText(
      /misst, wie stark deine Natal-Signatur/i,
      {},
      { timeout: 2000 },
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  it('tooltip mentions the four semantic layers (natal, transit, quiz, membrane)', async () => {
    const user = userEvent.setup();
    render(<DailyChartHero {...baseProps} />);
    await user.hover(screen.getByTestId('coherence-ring'));
    const matches = await screen.findAllByText(
      /Natal-Kern.*Transit.*Quiz-Kalibrierung.*Membran/i,
      {},
      { timeout: 2000 },
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  it('does not render tooltip content before hover (closed state)', () => {
    render(<DailyChartHero {...baseProps} />);
    expect(screen.queryByText(/misst, wie stark deine Natal-Signatur/i)).toBeNull();
  });
});
