import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfluenceGauges from '../components/dashboard/InfluenceGauges';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.influences.sectionTitle': 'Heutige Einflüsse',
        'dashboard.influences.marsLabel': 'Mars-Sektor',
        'dashboard.influences.marsTooltip': 'Mars tooltip',
        'dashboard.influences.jupiterLabel': 'Jupiter-Sektor',
        'dashboard.influences.jupiterTooltip': 'Jupiter tooltip',
        'dashboard.influences.venusLabel': 'Venus-Balance',
        'dashboard.influences.venusTooltip': 'Venus tooltip',
        'dashboard.influences.saturnLabel': 'Saturn-Fokus',
        'dashboard.influences.saturnTooltip': 'Saturn tooltip',
        'dashboard.influences.noDataLabel': 'KEINE DATEN',
        'dashboard.influences.liveLabel': 'LIVE',
        'dashboard.influences.estimatedLabel': 'GESCHÄTZT',
      };
      return map[key] || key;
    },
  }),
}));

vi.mock('../components/Tooltip', () => ({
  Tooltip: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-testid="tooltip-wrapper" data-tooltip={content}>{children}</div>
  ),
}));

// Mock planetary computation so tests are deterministic
vi.mock('../lib/astro-data/planetInfluences', () => ({
  computeTodayPlanetInfluences: (birthSign: string) => {
    if (!birthSign || birthSign === 'Unknown') return null;
    // Stable deterministic values for tests
    return {
      Mars:    { fieldStrength: 0.85, isResonant: true,  planetSector: 0, aspectDeg: 0 },
      Jupiter: { fieldStrength: 0.72, isResonant: false, planetSector: 3, aspectDeg: 90 },
      Venus:   { fieldStrength: 0.88, isResonant: true,  planetSector: 4, aspectDeg: 120 },
      Saturn:  { fieldStrength: 0.78, isResonant: false, planetSector: 6, aspectDeg: 180 },
    };
  },
  zodiacSignToIndex: (sign: string) => {
    const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    return signs.findIndex(s => s.toLowerCase() === sign.toLowerCase());
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InfluenceGauges — live planetary influence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section title', () => {
    render(<InfluenceGauges />);
    expect(screen.getByText('Heutige Einflüsse')).toBeDefined();
  });

  it('renders four planet labels', () => {
    render(<InfluenceGauges birthSign="Aries" />);
    expect(screen.getByText('Mars-Sektor')).toBeDefined();
    expect(screen.getByText('Jupiter-Sektor')).toBeDefined();
    expect(screen.getByText('Venus-Balance')).toBeDefined();
    expect(screen.getByText('Saturn-Fokus')).toBeDefined();
  });

  it('shows "KEINE DATEN" badge when no birthSign provided', () => {
    render(<InfluenceGauges />);
    expect(screen.getByText('KEINE DATEN')).toBeDefined();
  });

  it('shows "KEINE DATEN" badge when birthSign is empty string', () => {
    render(<InfluenceGauges birthSign="" />);
    expect(screen.getByText('KEINE DATEN')).toBeDefined();
  });

  it('shows "LIVE" badge when valid birthSign is provided', () => {
    render(<InfluenceGauges birthSign="Aries" />);
    expect(screen.getByText('LIVE')).toBeDefined();
    expect(screen.queryByText('KEINE DATEN')).toBeNull();
  });

  it('shows "GESCHÄTZT" badge (not LIVE) when isSynthetic=true even with birthSign', () => {
    render(<InfluenceGauges birthSign="Aries" isSynthetic />);
    expect(screen.queryByText('LIVE')).toBeNull();
    expect(screen.getByText('GESCHÄTZT')).toBeDefined();
  });

  it('renders field-strength block indicators (not raw "%")', () => {
    render(<InfluenceGauges birthSign="Aries" />);
    // Block indicators use ■/□ characters, not "%"
    const text = document.body.textContent ?? '';
    expect(text).toContain('■');
    // Old "%" display must be gone for live mode
    expect(text).not.toContain('%');
  });

  it('resonant planets show blue indicator prefix ◆', () => {
    render(<InfluenceGauges birthSign="Aries" />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('◆'); // Mars and Venus are resonant in mock
  });

  it('tension planets show red indicator prefix ▲', () => {
    render(<InfluenceGauges birthSign="Aries" />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('▲'); // Jupiter and Saturn are tension in mock
  });

  it('falls back to natalWeights when birthSign is undefined', () => {
    // Without birthSign, live computation is skipped, weights are used as fallback at 0.5
    render(<InfluenceGauges weights={{ Mars: 0.9, Jupiter: 0.9, Venus: 0.9, Saturn: 0.9 }} />);
    // No LIVE badge since there's no live computation
    expect(screen.queryByText('LIVE')).toBeNull();
    // Should still render the four labels
    expect(screen.getByText('Mars-Sektor')).toBeDefined();
  });
});

describe('InfluenceGauges — planetInfluences unit tests', () => {
  it('zodiac sector resolution stays within 0-11', async () => {
    const { zodiacSignToIndex } = await import('../lib/astro-data/planetInfluences');
    expect(zodiacSignToIndex('Aries')).toBe(0);
    expect(zodiacSignToIndex('Pisces')).toBe(11);
    expect(zodiacSignToIndex('')).toBe(-1);
  });
});
