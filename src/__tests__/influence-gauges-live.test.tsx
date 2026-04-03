import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfluenceGauges from '../components/dashboard/InfluenceGauges';

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

describe('InfluenceGauges — live data wiring', () => {
  it('shows 0% for all gauges when no weights provided (neutral fallback)', () => {
    render(<InfluenceGauges />);
    const percentages = screen.getAllByText('0%');
    expect(percentages.length).toBe(4);
  });

  it('shows "KEINE DATEN" badge when weights are undefined', () => {
    render(<InfluenceGauges />);
    expect(screen.getByText('KEINE DATEN')).toBeDefined();
  });

  it('does not show hardcoded non-zero percentages when no weights', () => {
    render(<InfluenceGauges />);
    // Old hardcoded values were 82%, 65%, 45%, 30% — must not appear
    expect(screen.queryByText('82%')).toBeNull();
    expect(screen.queryByText('65%')).toBeNull();
    expect(screen.queryByText('45%')).toBeNull();
    expect(screen.queryByText('30%')).toBeNull();
  });

  it('shows live values when weights are provided', () => {
    render(<InfluenceGauges weights={{ Mars: 0.75, Jupiter: 0.50, Venus: 0.60, Saturn: 0.35 }} />);
    expect(screen.getByText('75%')).toBeDefined();
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('60%')).toBeDefined();
    expect(screen.getByText('35%')).toBeDefined();
  });

  it('shows "LIVE" badge when weights are provided', () => {
    render(<InfluenceGauges weights={{ Mars: 0.5, Jupiter: 0.5, Venus: 0.5, Saturn: 0.5 }} />);
    expect(screen.getByText('LIVE')).toBeDefined();
    expect(screen.queryByText('KEINE DATEN')).toBeNull();
  });

  it('uses actual weight values, not fallback, when a specific planet weight is 0', () => {
    render(<InfluenceGauges weights={{ Mars: 0, Jupiter: 0, Venus: 0, Saturn: 0 }} />);
    // isLive = true (weights defined), badge shows LIVE
    expect(screen.getByText('LIVE')).toBeDefined();
    // All values are 0 — but that's valid live data
    const percentages = screen.getAllByText('0%');
    expect(percentages.length).toBe(4);
  });

  it('handles partial weights — missing planets fall back to 0', () => {
    render(<InfluenceGauges weights={{ Mars: 0.80 }} />);
    expect(screen.getByText('80%')).toBeDefined();
    // Jupiter, Venus, Saturn have no entry → 0%
    const zeros = screen.getAllByText('0%');
    expect(zeros.length).toBe(3);
  });
});
