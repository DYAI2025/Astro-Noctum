/**
 * Tests for AktiveEinfluesseFusion — Impact-derived planet cards.
 *
 * Verifies REQ-F-active-planets-frontend acceptance criteria:
 * - AC 1: Only planets from activePlanets[] are rendered (not static 6)
 * - AC 2: Each card shows planet name, strength, BaZi resonance, aspect + orb
 * - AC 3: Orb displayed with ° unit (CON-no-unexplained-numbers)
 * - AC 4: Empty active_planets[] shows meaningful empty state
 * - Fallback: when activePlanets is null, static 6-planet rendering is used
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AktiveEinfluesseFusion } from '@/src/components/dashboard/AktiveEinfluesseFusion';
import type { ActivePlanet } from '@/src/lib/schemas/active-impacts';

// Mock hooks
vi.mock('@/src/hooks/useDailyTransit', () => ({
  useDailyTransit: () => ({ bodies: null, loading: false, error: null }),
}));

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

const samplePlanets: ActivePlanet[] = [
  {
    planet: 'Mars',
    strength: 0.85,
    aspect_type: 'conjunction',
    orb: 1.2,
    natal_planet: 'Sun',
    bazi_resonance: 'gleichklang',
    wu_xing_element: 'fire',
  },
  {
    planet: 'Jupiter',
    strength: 0.45,
    aspect_type: 'trine',
    orb: 4.4,
    natal_planet: 'Moon',
    bazi_resonance: 'naehrung',
    wu_xing_element: 'wood',
  },
  {
    planet: 'Saturn',
    strength: 0.25,
    aspect_type: 'square',
    orb: 6.0,
    natal_planet: 'Venus',
    bazi_resonance: 'kontrolle',
    wu_xing_element: 'earth',
  },
];

describe('AktiveEinfluesseFusion — Impact mode', () => {
  it('renders exactly N cards when activePlanets has N entries (AC 1)', () => {
    const { container } = render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={samplePlanets}
        impactLoading={false}
      />
    );
    const cards = container.querySelectorAll('[data-testid="impact-planet-card"]');
    expect(cards.length).toBe(3);
  });

  it('shows planet name in each card (AC 2)', () => {
    render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={samplePlanets}
        impactLoading={false}
      />
    );
    expect(screen.getByText('Mars')).toBeDefined();
    expect(screen.getByText('Jupiter')).toBeDefined();
    expect(screen.getByText('Saturn')).toBeDefined();
  });

  it('shows aspect type + orb with ° unit (AC 2, AC 3, CON-no-unexplained-numbers)', () => {
    render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={samplePlanets}
        impactLoading={false}
      />
    );
    expect(screen.getByText('Konjunktion 1.2°')).toBeDefined();
    expect(screen.getByText('Trigon 4.4°')).toBeDefined();
    expect(screen.getByText('Quadrat 6°')).toBeDefined();
  });

  it('shows BaZi resonance badges (AC 2)', () => {
    const { container } = render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={samplePlanets}
        impactLoading={false}
      />
    );
    const badges = container.querySelectorAll('[data-testid="resonance-badge"]');
    expect(badges.length).toBe(3);
  });

  it('shows strength percentage as visual bar', () => {
    render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={samplePlanets}
        impactLoading={false}
      />
    );
    expect(screen.getByText('85%')).toBeDefined();
    expect(screen.getByText('45%')).toBeDefined();
    expect(screen.getByText('25%')).toBeDefined();
  });

  it('shows Wu-Xing element badges', () => {
    render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={samplePlanets}
        impactLoading={false}
      />
    );
    expect(screen.getByText('Feuer')).toBeDefined();
    expect(screen.getByText('Holz')).toBeDefined();
    expect(screen.getByText('Erde')).toBeDefined();
  });
});

describe('AktiveEinfluesseFusion — empty state', () => {
  it('shows meaningful empty state when activePlanets is empty array (AC 4)', () => {
    const { container } = render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={[]}
        impactLoading={false}
      />
    );
    const emptyState = container.querySelector('[data-testid="impact-empty-state"]');
    expect(emptyState).not.toBeNull();
    expect(screen.getByText(/keine starken Transit-Aspekte/i)).toBeDefined();
  });
});

describe('AktiveEinfluesseFusion — fallback mode', () => {
  it('falls back to static 6-planet rendering when activePlanets is null', () => {
    const { container } = render(
      <AktiveEinfluesseFusion
        dayMasterStem="Geng"
        activePlanets={null}
        impactLoading={false}
      />
    );
    // Static mode renders 6 PlanetCards (not ImpactPlanetCards)
    const impactCards = container.querySelectorAll('[data-testid="impact-planet-card"]');
    expect(impactCards.length).toBe(0);
  });

  it('falls back when activePlanets prop is not passed', () => {
    const { container } = render(
      <AktiveEinfluesseFusion dayMasterStem="Geng" />
    );
    const impactCards = container.querySelectorAll('[data-testid="impact-planet-card"]');
    expect(impactCards.length).toBe(0);
  });
});
