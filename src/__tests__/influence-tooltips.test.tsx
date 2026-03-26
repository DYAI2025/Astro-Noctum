import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfluenceGauges from '../components/dashboard/InfluenceGauges';

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

// Mock Tooltip to make tooltip text visible
vi.mock('../components/Tooltip', () => ({
  Tooltip: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-testid="tooltip-wrapper" data-tooltip={content}>{children}</div>
  ),
}));

describe('InfluenceGauges tooltips', () => {
  it('renders tooltip wrappers for each gauge', () => {
    render(<InfluenceGauges />);
    const wrappers = screen.getAllByTestId('tooltip-wrapper');
    expect(wrappers.length).toBe(4);
  });

  it('passes tooltip text from influence data', () => {
    const custom = [
      { label: 'Test', value: 0.5, color: 'bg-white', tooltip: 'Test explanation' },
    ];
    render(<InfluenceGauges influences={custom} />);
    const wrapper = screen.getByTestId('tooltip-wrapper');
    expect(wrapper.getAttribute('data-tooltip')).toBe('Test explanation');
  });

  it('default influences all have non-empty tooltips', () => {
    render(<InfluenceGauges />);
    const wrappers = screen.getAllByTestId('tooltip-wrapper');
    wrappers.forEach((w) => {
      expect(w.getAttribute('data-tooltip')).toBeTruthy();
      expect(w.getAttribute('data-tooltip')!.length).toBeGreaterThan(10);
    });
  });
});
