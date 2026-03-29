/**
 * R1-2: DashboardTagesEnergie "vertiefen →" Button öffnet DayModeModal on-demand.
 * Modal öffnet sich NICHT automatisch beim ersten Load.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardTagesEnergie } from '../components/dashboard/DashboardTagesEnergie';
import type { DailyResponse } from '../lib/schemas/experience';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('../hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: true, loading: false }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../lib/authedFetch', () => ({ authedFetch: vi.fn() }));

// ── Fixtures ───────────────────────────────────────────────────────

const DAILY: DailyResponse = {
  date: '2026-03-29',
  western: {
    summary: 'w', themes: ['T'], caution: 'c', opportunity: 'o',
    evidence: { natal_focus: [] },
  },
  eastern: {
    summary: 'e', themes: ['T'], caution: 'c', opportunity: 'o',
    evidence: { day_master: '甲', natal_focus: [] },
  },
  fusion: {
    summary: 'fs', synthesis: 'Body-Text.', action: 'Action-Text.',
    pushworthy: false, harmony_index: 0.55, day_mode: 'pulse',
  },
  meta: { engine_version: '1.0' },
};

const SW: SpaceWeatherState = {
  kpIndex: 0, solarPressure: 0, ringModulation: 1.0, intensityBoost: 0,
  triggerEffect: false, gScale: 'G0', xrayFlux: 0, xrayClass: 'A',
  protonFlux: 0, f107: 150, solarCyclePhase: 'ascending',
  events: [], alerts: [], lastUpdate: null, loading: false, error: null,
};

// ── Tests ──────────────────────────────────────────────────────────

describe('DashboardTagesEnergie — vertiefen Link', () => {
  it('rendert "vertiefen" Button wenn onOpenDayModal übergeben wird', () => {
    const onOpen = vi.fn();
    render(
      <DashboardTagesEnergie
        daily={DAILY} dayHarmonic={null} spaceWeather={SW}
        onOpenDayModal={onOpen}
      />
    );
    const btn = screen.getByRole('button', { name: /vertiefen/i });
    expect(btn).toBeDefined();
  });

  it('ruft onOpenDayModal beim Klick auf "vertiefen" auf', () => {
    const onOpen = vi.fn();
    render(
      <DashboardTagesEnergie
        daily={DAILY} dayHarmonic={null} spaceWeather={SW}
        onOpenDayModal={onOpen}
      />
    );
    const btn = screen.getByRole('button', { name: /vertiefen/i });
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('rendert KEINEN "vertiefen" Button ohne onOpenDayModal Prop', () => {
    render(
      <DashboardTagesEnergie
        daily={DAILY} dayHarmonic={null} spaceWeather={SW}
      />
    );
    const btn = screen.queryByRole('button', { name: /vertiefen/i });
    expect(btn).toBeNull();
  });
});
