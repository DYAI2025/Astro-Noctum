/**
 * ActiveImpactsList — shared planet-influence component (Phase 4).
 *
 * Extracted from src/components/signatur/TransitResonancePanels.tsx so that
 * Dashboard (DailyChartHero) and Signatur page render the same visual schema.
 * See docs/plans/2026-04-20-dashboard-signatur-gaps.md §Phase 4.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActiveImpactsList } from '../components/shared/ActiveImpactsList';

vi.mock('../lib/astro-data/planetInfluences', () => ({
  computeTodayPlanetInfluences: vi.fn(),
  zodiacSignToIndex: vi.fn((sign: string) =>
    ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
     'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
      .findIndex(s => s.toLowerCase() === sign.toLowerCase()),
  ),
}));

import { computeTodayPlanetInfluences } from '../lib/astro-data/planetInfluences';
const mockCompute = computeTodayPlanetInfluences as ReturnType<typeof vi.fn>;

const MOCK_INFLUENCES = {
  Mars:    { fieldStrength: 0.88, isResonant: true,  planetSector: 4, aspectDeg: 120 },
  Venus:   { fieldStrength: 0.72, isResonant: false, planetSector: 3, aspectDeg: 90  },
  Jupiter: { fieldStrength: 0.62, isResonant: true,  planetSector: 2, aspectDeg: 60  },
  Saturn:  { fieldStrength: 0.78, isResonant: false, planetSector: 6, aspectDeg: 180 },
};

beforeEach(() => {
  mockCompute.mockReturnValue(MOCK_INFLUENCES);
});

describe('ActiveImpactsList — full variant', () => {
  it('renders all four planets for a valid birth sign', () => {
    render(<ActiveImpactsList birthSign="Aries" variant="full" />);
    expect(screen.getByText('Mars')).toBeInTheDocument();
    expect(screen.getByText('Venus')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
  });

  it('renders the "Warum?" toggle in full variant', () => {
    render(<ActiveImpactsList birthSign="Aries" variant="full" />);
    expect(screen.getAllByText('Warum?').length).toBeGreaterThan(0);
  });

  it('expands explanation when "Warum?" is clicked', () => {
    render(<ActiveImpactsList birthSign="Aries" variant="full" />);
    const buttons = screen.getAllByRole('button', { name: /Erklärung für Mars/i });
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('orders planets by fieldStrength descending', () => {
    render(<ActiveImpactsList birthSign="Aries" variant="full" />);
    const names = screen.getAllByText(/^(Mars|Venus|Jupiter|Saturn)$/);
    // Mars 0.88 > Saturn 0.78 > Venus 0.72 > Jupiter 0.62
    expect(names[0].textContent).toBe('Mars');
    expect(names[1].textContent).toBe('Saturn');
  });
});

describe('ActiveImpactsList — compact variant', () => {
  it('renders planets but hides "Warum?" toggle', () => {
    render(<ActiveImpactsList birthSign="Aries" variant="compact" />);
    expect(screen.getByText('Mars')).toBeInTheDocument();
    expect(screen.queryByText('Warum?')).toBeNull();
    expect(screen.queryByText(/Why\?/i)).toBeNull();
  });

  it('respects maxItems cap (default 4)', () => {
    render(<ActiveImpactsList birthSign="Aries" variant="compact" />);
    // 4 planets in mock, compact default maxItems=4 → all shown
    expect(screen.getByText('Mars')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
  });

  it('truncates when maxItems is smaller than available planets', () => {
    render(<ActiveImpactsList birthSign="Aries" variant="compact" maxItems={2} />);
    // Top 2 by strength: Mars (0.88), Saturn (0.78)
    expect(screen.getByText('Mars')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
    expect(screen.queryByText('Venus')).toBeNull();
    expect(screen.queryByText('Jupiter')).toBeNull();
  });
});

describe('ActiveImpactsList — empty / invalid states', () => {
  it('renders empty state when birthSign is undefined', () => {
    render(<ActiveImpactsList birthSign={undefined} variant="full" />);
    expect(screen.queryByText('Mars')).toBeNull();
  });

  it('renders empty state when computeTodayPlanetInfluences returns null', () => {
    mockCompute.mockReturnValueOnce(null);
    render(<ActiveImpactsList birthSign="Aries" variant="full" />);
    expect(screen.queryByText('Mars')).toBeNull();
  });
});
