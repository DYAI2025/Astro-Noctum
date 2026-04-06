import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransitResonancePanels } from '../components/signatur/TransitResonancePanels';

// ── Mock computeTodayPlanetInfluences ────────────────────────────────────────

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

const MOCK_TRINE = { fieldStrength: 0.88, isResonant: true,  planetSector: 4, aspectDeg: 120 };
const MOCK_SQUARE = { fieldStrength: 0.72, isResonant: false, planetSector: 3, aspectDeg: 90 };
const MOCK_SEXTILE = { fieldStrength: 0.62, isResonant: true,  planetSector: 2, aspectDeg: 60 };
const MOCK_OPP    = { fieldStrength: 0.78, isResonant: false, planetSector: 6, aspectDeg: 180 };

const MOCK_INFLUENCES = {
  Mars:    MOCK_TRINE,
  Venus:   MOCK_SQUARE,
  Jupiter: MOCK_SEXTILE,
  Saturn:  MOCK_OPP,
};

beforeEach(() => {
  mockCompute.mockReturnValue(MOCK_INFLUENCES);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TransitResonancePanels', () => {
  it('renders all four planet panels when birth sign is valid', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByText('Mars')).toBeInTheDocument();
    expect(screen.getByText('Venus')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
  });

  it('shows LIVE badge when birth sign is provided', () => {
    render(<TransitResonancePanels birthSign="Leo" />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows empty state when birthSign is undefined', () => {
    mockCompute.mockReturnValue(null);
    render(<TransitResonancePanels birthSign={undefined} />);
    expect(screen.getByText('Keine Transit-Daten verfügbar')).toBeInTheDocument();
    expect(screen.getByText('Geburtszeichen wird benötigt, um aktive Planetentransits zu berechnen.')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('shows empty state when computeTodayPlanetInfluences returns null', () => {
    mockCompute.mockReturnValue(null);
    render(<TransitResonancePanels birthSign="Capricorn" />);
    expect(screen.getByText('Keine Transit-Daten verfügbar')).toBeInTheDocument();
  });

  it('displays correct aspect name for trine', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByText('Trigon')).toBeInTheDocument();
  });

  it('displays correct aspect name for square', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByText('Quadrat')).toBeInTheDocument();
  });

  it('displays correct aspect name for opposition', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByText('Opposition')).toBeInTheDocument();
  });

  it('shows "Verstärkend" for resonant aspects', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    // Mars has trine (resonant)
    const labels = screen.getAllByText('Verstärkend');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('shows "Schärfend" for non-resonant aspects', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    // Venus has square (non-resonant)
    const labels = screen.getAllByText('Schärfend');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('shows pole name for Mars panel', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByText('Durchsetzung – Hingabe')).toBeInTheDocument();
  });

  it('shows pole name for Jupiter panel', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByText('Ahnung – Evidenz')).toBeInTheDocument();
  });

  it('expands explanation when "Warum?" is clicked (aria-expanded becomes true)', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    const buttons = screen.getAllByRole('button', { name: /Erklärung für Mars/i });
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapses explanation on second click (aria-expanded goes back to false)', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    const buttons = screen.getAllByRole('button', { name: /Erklärung für Mars/i });
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders four "Warum?" buttons, one per planet', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getAllByText('Warum?')).toHaveLength(4);
  });

  it('orders panels by fieldStrength descending (Trine 0.88 first)', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    const planetTexts = screen.getAllByText(/^(Mars|Venus|Jupiter|Saturn)$/);
    // Mars (trine 0.88) should appear before Venus (square 0.72) etc.
    const planetOrder = planetTexts.map(el => el.textContent);
    expect(planetOrder[0]).toBe('Mars');
  });

  it('planet symbols are rendered (accessibility: aria-hidden)', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByText('♂')).toHaveAttribute('aria-hidden');
    expect(screen.getByText('♃')).toHaveAttribute('aria-hidden');
    expect(screen.getByText('♄')).toHaveAttribute('aria-hidden');
    expect(screen.getByText('♀')).toHaveAttribute('aria-hidden');
  });

  it('section has accessible label', () => {
    render(<TransitResonancePanels birthSign="Aries" />);
    expect(screen.getByRole('region', { name: 'Aktive Planetentransits' })).toBeInTheDocument();
  });

  it('does NOT show Live badge when birthSign is set but compute returns null', () => {
    mockCompute.mockReturnValue(null);
    render(<TransitResonancePanels birthSign="Capricorn" />);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('shows different empty copy when birthSign is set vs not set', () => {
    mockCompute.mockReturnValue(null);

    const { rerender } = render(<TransitResonancePanels birthSign="Capricorn" />);
    expect(screen.getByText('Planetenposition konnte nicht berechnet werden.')).toBeInTheDocument();

    rerender(<TransitResonancePanels birthSign={undefined} />);
    expect(screen.getByText('Geburtszeichen wird benötigt, um aktive Planetentransits zu berechnen.')).toBeInTheDocument();
  });
});
