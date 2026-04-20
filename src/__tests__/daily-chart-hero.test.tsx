/**
 * Tests for DailyChartHero — unified volatile dashboard hero.
 *
 * Covers:
 * - REQ-F-daily-chart-coherence-hero: skeleton, no "Mittlere Übereinstimmung", single card
 * - REQ-F-coherence-hero-impact-datasource: split ring, driver strip, driver values
 *
 * Phase 4 (2026-04-20): active-planets assertions migrated to
 * `src/__tests__/active-impacts-list.test.tsx` — the hero now delegates
 * planet rendering to the shared ActiveImpactsList component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DailyChartHero } from '../components/dashboard/DailyChartHero';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';
import type { TransitEvent } from '../lib/schemas/transit-state';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

// computeTodayPlanetInfluences is the client-side planet engine invoked
// transitively via ActiveImpactsList. Mock to a stable set so the hero tests
// do not depend on real ephemeris computation.
vi.mock('../lib/astro-data/planetInfluences', () => ({
  computeTodayPlanetInfluences: vi.fn(() => null), // empty-state default
  zodiacSignToIndex: vi.fn(() => -1),
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

const NO_EVENTS: TransitEvent[] = [];

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
  // Phase 2 (2026-04-20): Tagesfeld-Pill entfernt (siehe US-DSG-2).
  // Mode-Info (Impuls/Spur) lebt nur noch im Day-Impulse-Badge "Tages-Impuls"/"Tages-Spur".
  it('renders 3 drivers (Geomagnetik, Solardruck, Transit-Aktivität)', () => {
    renderHero();
    expect(screen.getByText('Geomagnetik')).toBeTruthy();
    expect(screen.getByText('Solardruck')).toBeTruthy();
    expect(screen.getByText('Transit-Aktivität')).toBeTruthy();
    expect(screen.queryByText('Tagesfeld')).toBeNull();
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

  it('marks unavailable driver value when Kp is 0', () => {
    renderHero({ spaceWeather: { ...NULL_SPACE_WEATHER, kpIndex: 0 } });
    expect(screen.getByText('Kp 0')).toBeTruthy();
  });
});

// ── Active Impacts delegation ─────────────────────────────────────────────────
// Planet-rendering itself is covered by src/__tests__/active-impacts-list.test.tsx.
// Here we only assert the hero mounts the shared section with the header label.

describe('DailyChartHero — active impacts section', () => {
  it('renders the Aktive Einflüsse section', () => {
    renderHero({ birthSign: 'Aries' });
    expect(screen.getByTestId('active-impacts-section')).toBeTruthy();
    expect(screen.getByText('Aktive Einflüsse')).toBeTruthy();
  });
});

// ── Day-Impulse Block (Phase 5 replacement) ────────────────────────────────
// Full Tagesimpuls assertions live in src/__tests__/daily-chart-hero.impuls.test.tsx.
// Here we only assert the new behaviour that impacts the existing suite:
// the old mode badge, transit-event body, fallback and trigger indicator are gone.

describe('DailyChartHero — day impulse (post-Phase-5)', () => {
  it('does NOT render the old mode badge (Tages-Impuls / Tages-Spur pills)', () => {
    renderHero({ dayMode: 'pulse' });
    // The old pill rendered the label in isolation; after Phase 5 the
    // centered headline is "Tagesimpuls" only and only when impulsText is set.
    expect(screen.queryByText('Tages-Impuls')).toBeNull();
    expect(screen.queryByText('Tages-Spur')).toBeNull();
  });

  it('does NOT render the old transit-event body or the "keine markanten Ereignisse" fallback', () => {
    renderHero({ transitEvents: [MOCK_EVENT] });
    expect(screen.queryByText(/Mars Quadrat zu deiner Natal-Venus/)).toBeNull();
    expect(screen.queryByText(/Heute keine markanten Ereignisse/)).toBeNull();
    expect(screen.queryByTestId('impulse-fallback')).toBeNull();
  });

  it('does NOT render the Tagesimpuls section when impulsText is absent', () => {
    renderHero();
    expect(screen.queryByTestId('day-impulse-section')).toBeNull();
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
