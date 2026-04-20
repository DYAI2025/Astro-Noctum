/**
 * Tests for DailyChartHero — unified volatile dashboard hero.
 *
 * Covers:
 * - REQ-F-daily-chart-coherence-hero: skeleton, no "Mittlere Übereinstimmung", single card
 * - REQ-F-coherence-hero-impact-datasource: split ring, driver strip, driver values
 * - REQ-F-active-planets-frontend: planet cards, strength ordering, Warum? expand, empty state
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DailyChartHero } from '../components/dashboard/DailyChartHero';
import type { ActivePlanet } from '../lib/schemas/active-impacts';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';
import type { TransitEvent } from '../lib/schemas/transit-state';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

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

const NO_PLANETS: ActivePlanet[] = [];
const NO_EVENTS: TransitEvent[] = [];

const MOCK_PLANET_STRONG: ActivePlanet = {
  planet: 'Mars',
  strength: 0.8,
  aspect_type: 'Quadrat',
  orb: 2.5,
  natal_planet: 'Venus',
  bazi_resonance: 'kontrolle',
  wu_xing_element: 'fire',
};

const MOCK_PLANET_WEAK: ActivePlanet = {
  planet: 'Jupiter',
  strength: 0.3,
  aspect_type: 'Sextil',
  orb: 3.8,
  natal_planet: 'Moon',
  bazi_resonance: null,
  wu_xing_element: null,
};

const MOCK_EVENT: TransitEvent = {
  type: 'transit',
  description_de: 'Mars Quadrat zu deiner Natal-Venus bringt Intensität.',
  personal_context: 'Besonders im Bereich Beziehungen.',
  priority: 5,
  trigger_planet: 'Mars',
  trigger_symbol: '♂',
  sector_domain: 'Beziehungen',
};

// ── Helper ────────────────────────────────────────────────────────────────────

function renderHero(overrides: Partial<Parameters<typeof DailyChartHero>[0]> = {}) {
  return render(
    <DailyChartHero
      loading={false}
      baseCoherence={65}
      positiveDailyDelta={7}
      displayedCoherence={72}
      spaceWeather={NULL_SPACE_WEATHER}
      activePlanets={NO_PLANETS}
      transitEvents={NO_EVENTS}
      dayMode="pulse"
      {...overrides}
    />
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

describe('DailyChartHero — skeleton', () => {
  it('renders skeleton when loading', () => {
    renderHero({ loading: true });
    expect(screen.getByTestId('daily-chart-hero-skeleton')).toBeTruthy();
  });

  it('does not render skeleton when not loading', () => {
    renderHero({ loading: false });
    expect(screen.queryByTestId('daily-chart-hero-skeleton')).toBeNull();
  });
});

// ── Coherence Ring ────────────────────────────────────────────────────────────

describe('DailyChartHero — coherence ring', () => {
  it('renders the displayed coherence value as integer', () => {
    renderHero({ displayedCoherence: 72 });
    expect(screen.getByTestId('coherence-value').textContent).toBe('72');
  });

  it('shows +delta when positiveDailyDelta > 0', () => {
    renderHero({ positiveDailyDelta: 7 });
    expect(screen.getByText('+7')).toBeTruthy();
  });

  it('hides +delta when positiveDailyDelta is 0', () => {
    renderHero({ positiveDailyDelta: 0 });
    expect(screen.queryByText('+0')).toBeNull();
  });

  it('renders baseline label with Basis + Heute format', () => {
    renderHero({ baseCoherence: 65, positiveDailyDelta: 7 });
    expect(screen.getByTestId('coherence-baseline-label').textContent).toBe('Basis 65 · Heute +7');
  });

  it('does NOT show "Mittlere Übereinstimmung" as primary label', () => {
    renderHero({ baseCoherence: 40, positiveDailyDelta: 5, displayedCoherence: 45 });
    expect(screen.queryByText('Mittlere Übereinstimmung')).toBeNull();
  });

  it('does NOT show "Hohe Übereinstimmung" as primary label', () => {
    renderHero({ baseCoherence: 75, positiveDailyDelta: 5, displayedCoherence: 80 });
    expect(screen.queryByText('Hohe Übereinstimmung')).toBeNull();
  });

  it('shows explanatory sentence below baseline', () => {
    renderHero();
    // Phase 1 (2026-04-20): subtitle is now dynamic — "Basiswert {base} …" keyed on delta direction.
    expect(screen.getByText(/Basiswert 65.*angehoben auf 72/)).toBeTruthy();
  });
});

// ── Driver Strip ──────────────────────────────────────────────────────────────

describe('DailyChartHero — driver strip', () => {
  it('renders all 4 drivers', () => {
    renderHero();
    expect(screen.getByText('Geomagnetik')).toBeTruthy();
    expect(screen.getByText('Solardruck')).toBeTruthy();
    expect(screen.getByText('Transit-Aktivität')).toBeTruthy();
    expect(screen.getByText('Tagesfeld')).toBeTruthy();
  });

  it('shows Kp value in driver', () => {
    renderHero({ spaceWeather: { ...NULL_SPACE_WEATHER, kpIndex: 5 } });
    expect(screen.getByText('Kp 5')).toBeTruthy();
  });

  it('shows solar pressure as percentage', () => {
    renderHero({ spaceWeather: { ...NULL_SPACE_WEATHER, solarPressure: 0.42 } });
    expect(screen.getByText('42%')).toBeTruthy();
  });

  it('shows transit count', () => {
    const events = [MOCK_EVENT, { ...MOCK_EVENT, priority: 3 }] as TransitEvent[];
    renderHero({ transitEvents: events });
    expect(screen.getByText('2 aktiv')).toBeTruthy();
  });

  it('shows Impuls for pulse mode', () => {
    renderHero({ dayMode: 'pulse' });
    expect(screen.getByText('Impuls')).toBeTruthy();
  });

  it('shows Spur for trace mode', () => {
    renderHero({ dayMode: 'trace' });
    expect(screen.getByText('Spur')).toBeTruthy();
  });

  it('marks unavailable driver value when Kp is 0', () => {
    renderHero({ spaceWeather: { ...NULL_SPACE_WEATHER, kpIndex: 0 } });
    expect(screen.getByText('Kp 0')).toBeTruthy();
  });
});

// ── Active Planets ────────────────────────────────────────────────────────────

describe('DailyChartHero — active planets', () => {
  it('renders planet name and strength label', () => {
    renderHero({ activePlanets: [MOCK_PLANET_STRONG] });
    expect(screen.getByText('Mars')).toBeTruthy();
    expect(screen.getByText('Stark')).toBeTruthy();
  });

  it('renders multiple planets sorted by strength (strongest first)', () => {
    renderHero({ activePlanets: [MOCK_PLANET_WEAK, MOCK_PLANET_STRONG] });
    const names = screen.getAllByText(/Mars|Jupiter/);
    expect(names[0].textContent).toBe('Mars');
    expect(names[1].textContent).toBe('Jupiter');
  });

  it('shows Warum? button with correct aria-label', () => {
    renderHero({ activePlanets: [MOCK_PLANET_STRONG] });
    expect(screen.getByRole('button', { name: /Erklärung für Mars/i })).toBeTruthy();
  });

  it('expands explanation on Warum? click', () => {
    renderHero({ activePlanets: [MOCK_PLANET_STRONG] });
    const btn = screen.getByRole('button', { name: /Erklärung für Mars/i });
    fireEvent.click(btn);
    expect(screen.getByTestId('planet-explanation-Mars')).toBeTruthy();
    expect(screen.getByText(/Quadrat.*2\.5°.*Natal-Venus/)).toBeTruthy();
  });

  it('shows Gering label for weak planet', () => {
    renderHero({ activePlanets: [MOCK_PLANET_WEAK] });
    expect(screen.getByText('Gering')).toBeTruthy();
  });

  it('shows empty state when no planets', () => {
    renderHero({ activePlanets: [] });
    expect(screen.getByTestId('no-active-planets')).toBeTruthy();
    expect(screen.getByText(/Keine aktiven Planeteneinflüsse/)).toBeTruthy();
  });

  it('shows aspect type and natal planet in compact view', () => {
    renderHero({ activePlanets: [MOCK_PLANET_STRONG] });
    expect(screen.getByText('Quadrat')).toBeTruthy();
    expect(screen.getByText('Natal Venus')).toBeTruthy();
  });
});

// ── Day-Impulse Block ─────────────────────────────────────────────────────────

describe('DailyChartHero — day impulse', () => {
  it('shows mode badge (Tages-Impuls for pulse)', () => {
    renderHero({ dayMode: 'pulse' });
    expect(screen.getByText('Tages-Impuls')).toBeTruthy();
  });

  it('shows mode badge (Tages-Spur for trace)', () => {
    renderHero({ dayMode: 'trace' });
    expect(screen.getByText('Tages-Spur')).toBeTruthy();
  });

  it('shows mode description', () => {
    renderHero({ dayMode: 'pulse' });
    expect(screen.getByText(/Aktiver Tag/)).toBeTruthy();
  });

  it('renders transit event text when available', () => {
    renderHero({ transitEvents: [MOCK_EVENT] });
    expect(screen.getByText(/Mars Quadrat zu deiner Natal-Venus/)).toBeTruthy();
  });

  it('renders personal_context in italic when available', () => {
    renderHero({ transitEvents: [MOCK_EVENT] });
    expect(screen.getByText(/Besonders im Bereich Beziehungen/)).toBeTruthy();
  });

  it('shows trigger planet indicator', () => {
    renderHero({ transitEvents: [MOCK_EVENT] });
    expect(screen.getByText('Mars')).toBeTruthy();
    expect(screen.getByText('♂')).toBeTruthy();
  });

  it('shows fallback when no transit events', () => {
    renderHero({ transitEvents: [] });
    expect(screen.getByTestId('impulse-fallback')).toBeTruthy();
    expect(screen.getByText(/Heute keine markanten Ereignisse/)).toBeTruthy();
  });
});

// ── Error/unavailable state ──────────────────────────────────────────────────

describe('DailyChartHero — error/unavailable state', () => {
  it('renders unavailable state when all coherence fields are null', () => {
    renderHero({
      loading: false,
      baseCoherence: null,
      positiveDailyDelta: null,
      displayedCoherence: null,
    });
    expect(screen.getByTestId('coherence-unavailable')).toBeTruthy();
    expect(screen.queryByTestId('coherence-value')).toBeNull();
  });

  it('shows "nicht verfügbar" text, not zero', () => {
    renderHero({
      loading: false,
      baseCoherence: null,
      positiveDailyDelta: null,
      displayedCoherence: null,
    });
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByText(/nicht verfügbar/i)).toBeTruthy();
  });

  it('still renders driver strip in unavailable state', () => {
    renderHero({
      loading: false,
      baseCoherence: null,
      positiveDailyDelta: null,
      displayedCoherence: null,
    });
    expect(screen.getByTestId('driver-strip')).toBeTruthy();
  });
});

// ── CSS var compliance ────────────────────────────────────────────────────────

describe('DailyChartHero — no hardcoded white classes', () => {
  it('component source does not contain bg-white class (except skeleton bg-white/5)', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync('src/components/dashboard/DailyChartHero.tsx', 'utf8');
    // bg-white/5 and bg-white/10 are OK (opacity variants for skeleton)
    const lines = src.split('\n').filter(l => /bg-white(?!\/\d)/.test(l));
    expect(lines).toHaveLength(0);
  });
});
