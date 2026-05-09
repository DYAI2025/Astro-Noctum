import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardTagesEnergie } from '../components/dashboard/DashboardTagesEnergie';
import type { DailyResponse } from '../lib/schemas/experience';
import type { DayHarmonicState } from '../lib/day-harmonic';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

// ── Mock feature flag so badge row renders ─────────────────────────────────────
vi.mock('../lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn((flag: string) => flag === 'daily_fusion_hero_v1'),
  validateCriticalFlags: vi.fn(),
}));

// ── Stubs ──────────────────────────────────────────────────────────────────────
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ isPremium: false }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const MOCK_DAILY: DailyResponse = {
  date: '2026-04-07',
  western: { summary: 'West', themes: [], caution: '', opportunity: '', evidence: {} },
  eastern: { summary: 'East', themes: [], caution: '', opportunity: '', evidence: {} },
  fusion: {
    summary: 'Fusion',
    synthesis: 'Test fixture synthesis line.',
    action: 'Innehalten.',
    pushworthy: false,
    push_text: '',
    harmony_index: 0.42,
    day_mode: 'pulse',
  },
  meta: { engine_version: 'v1-test' },
  resonance_badges: [
    { type: 'transit', label: 'Mars Trigon · Verstärkend', sublabel: '88%', intensity: 'hoch', color: '#D4AF37' },
    { type: 'space_weather', label: 'Kp 3.2 · Ruhig', sublabel: 'Kosmisches Wetter', intensity: 'niedrig', color: '#4CAF50' },
    { type: 'sektor', label: '♈ Widder', sublabel: 'Dein Leitsystem', intensity: 'hoch', color: '#8B6CD4' },
  ],
};

const MOCK_HARMONIC: DayHarmonicState = {
  mode: 'pulse',
  intensity: 0.42,
  label: 'Puls',
  elementKey: 'wasser',
  color: '#4A90D9',
  ringModulation: 1.0,
  quizWeight: 0.5,
};

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
  f107: 0,
  solarCyclePhase: 'ascending',
  events: [],
  alerts: [],
  lastUpdate: null,
  loading: false,
  error: null,
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('DashboardTagesEnergie — resonance badges', () => {
  it('renders all 3 badge labels for premium user when flag is on', () => {
    render(
      <DashboardTagesEnergie
        daily={MOCK_DAILY}
        dayHarmonic={MOCK_HARMONIC}
        spaceWeather={NULL_SPACE_WEATHER}
        isPremium={true}
      />,
    );
    expect(screen.getByText('Mars Trigon · Verstärkend')).toBeInTheDocument();
    expect(screen.getByText('Kp 3.2 · Ruhig')).toBeInTheDocument();
    expect(screen.getByText('♈ Widder')).toBeInTheDocument();
  });

  it('renders badges in blurred/locked state for free user', () => {
    render(
      <DashboardTagesEnergie
        daily={MOCK_DAILY}
        dayHarmonic={MOCK_HARMONIC}
        spaceWeather={NULL_SPACE_WEATHER}
        isPremium={false}
      />,
    );
    expect(screen.getByTestId('resonanz-badge-transit')).toHaveClass('opacity-60');
  });

  it('renders no badge row when resonance_badges is absent', () => {
    const noBadges = { ...MOCK_DAILY, resonance_badges: undefined };
    render(
      <DashboardTagesEnergie
        daily={noBadges}
        dayHarmonic={MOCK_HARMONIC}
        spaceWeather={NULL_SPACE_WEATHER}
        isPremium={true}
      />,
    );
    expect(screen.queryByTestId('resonanz-badge-transit')).not.toBeInTheDocument();
  });

  it('renders synthesis text', () => {
    render(
      <DashboardTagesEnergie
        daily={MOCK_DAILY}
        dayHarmonic={MOCK_HARMONIC}
        spaceWeather={NULL_SPACE_WEATHER}
        isPremium={true}
      />,
    );
    expect(screen.getByText('Test fixture synthesis line.')).toBeInTheDocument();
  });
});
