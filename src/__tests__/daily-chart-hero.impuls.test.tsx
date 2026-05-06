/**
 * DailyChartHero — Tagesimpuls centered headline + real daily horoscope text (Phase 5).
 * See docs/plans/2026-04-20-dashboard-signatur-gaps.md §Phase 5.
 *
 * Data source: DailyResponse.fusion.synthesis (with .summary as fallback)
 * from useFirstRunDaily → fetchDailyExperience (Experience API `/api/experience/daily`).
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
  positiveDailyDelta: 5,
  displayedCoherence: 65,
  spaceWeather: NULL_SPACE_WEATHER,
  transitEvents: [],
  dayMode: 'pulse' as const,
};

describe('DailyChartHero — Tagesimpuls headline + real horoscope body', () => {
  it('renders "Tagesimpuls" as a centered h3 heading when impulsText is provided', () => {
    render(<DailyChartHero {...baseProps} impulsText="Heute ist ein Tag zum Atmen." />);
    const heading = screen.getByRole('heading', { name: /^Tagesimpuls$/i });
    expect(heading.tagName).toBe('H3');
    expect(heading.className).toMatch(/text-center/);
  });

  it('renders the provided impulsText as the body', () => {
    render(<DailyChartHero {...baseProps} impulsText="Heute ist ein Tag zum Atmen." />);
    expect(screen.getByText('Heute ist ein Tag zum Atmen.')).toBeTruthy();
  });

  it('headline and body are both in the same Tagesimpuls section (testid)', () => {
    render(<DailyChartHero {...baseProps} impulsText="Heute ist ein Tag zum Atmen." />);
    const section = screen.getByTestId('day-impulse-section');
    expect(section).toBeTruthy();
    expect(section.textContent).toContain('Tagesimpuls');
    expect(section.textContent).toContain('Heute ist ein Tag zum Atmen.');
  });

  it('body text is centered (text-center class)', () => {
    render(<DailyChartHero {...baseProps} impulsText="Heute ist ein Tag zum Atmen." />);
    const body = screen.getByText('Heute ist ein Tag zum Atmen.');
    expect(body.className).toMatch(/text-center/);
  });

  it('does NOT render the Tagesimpuls section when impulsText is empty/undefined', () => {
    render(<DailyChartHero {...baseProps} impulsText="" />);
    expect(screen.queryByTestId('day-impulse-section')).toBeNull();
  });

  it('does NOT render the old transit-event body (Phase 5 replaces it with horoscope text)', () => {
    render(<DailyChartHero {...baseProps} impulsText="Heute ist ein Tag zum Atmen." transitEvents={[
      {
        type: 'transit',
        description_de: 'Mars Quadrat zu deiner Natal-Venus bringt Intensität.',
        personal_context: 'Besonders im Bereich Beziehungen.',
        priority: 5,
        trigger_planet: 'Mars',
        trigger_symbol: '♂',
        sector_domain: 'Beziehungen',
      } as never,
    ]} />);
    // The transit event text should no longer be rendered in the hero;
    // the horoscope synthesis owns the Tagesimpuls surface.
    expect(screen.queryByText(/Mars Quadrat zu deiner Natal-Venus/)).toBeNull();
    expect(screen.queryByText(/Besonders im Bereich Beziehungen/)).toBeNull();
  });

  it('"vertiefen →" link still renders when onOpenDayModal is provided', () => {
    const onOpen = vi.fn();
    render(<DailyChartHero {...baseProps} impulsText="Heute ist ein Tag zum Atmen." onOpenDayModal={onOpen} />);
    expect(screen.getByTestId('day-detail-trigger')).toBeTruthy();
  });
});
