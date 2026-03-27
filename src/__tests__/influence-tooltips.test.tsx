import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfluenceGauges from '../components/dashboard/InfluenceGauges';

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.influences.sectionTitle': 'Heutige Einflüsse',
        'dashboard.influences.marsLabel': 'Mars-Sektor',
        'dashboard.influences.marsTooltip': 'Mars steht für Antrieb, Durchsetzungskraft und körperliche Energie. Ein hoher Mars-Sektor-Wert zeigt eine Phase erhöhter Tatkraft und Entschlossenheit an.',
        'dashboard.influences.jupiterLabel': 'Jupiter-Sektor',
        'dashboard.influences.jupiterTooltip': 'Jupiter repräsentiert Wachstum, Weisheit und Expansion. Dieser Wert spiegelt das Potenzial für neue Erkenntnisse, Optimismus und günstige Entwicklungen wider.',
        'dashboard.influences.venusLabel': 'Venus-Balance',
        'dashboard.influences.venusTooltip': 'Venus steht für Harmonie, Beziehungen und ästhetisches Empfinden. Die Venus-Balance zeigt, wie stark die Einflüsse von Liebe, Schönheit und Verbundenheit heute wirken.',
        'dashboard.influences.saturnLabel': 'Saturn-Fokus',
        'dashboard.influences.saturnTooltip': 'Saturn verkörpert Struktur, Disziplin und Verantwortung. Ein niedriger Saturn-Fokus deutet auf eine Phase mit weniger äußeren Beschränkungen und mehr Gestaltungsfreiheit hin.',
      };
      return map[key] || key;
    },
  }),
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
