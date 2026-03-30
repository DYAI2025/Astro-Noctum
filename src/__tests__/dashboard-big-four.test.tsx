import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardBigFour } from '../components/dashboard/DashboardBigFour';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));

describe('DashboardBigFour', () => {
  const defaultProps = {
    sunSign: 'Widder',
    moonSign: 'Krebs',
    ascendant: 'Löwe',
    baziAnimal: 'Hase',
  };

  it('rendert alle 4 Identitäts-Werte', () => {
    render(<DashboardBigFour {...defaultProps} />);
    expect(screen.getByText('Widder')).toBeDefined();
    expect(screen.getByText('Krebs')).toBeDefined();
    expect(screen.getByText('Löwe')).toBeDefined();
    expect(screen.getByText('Hase')).toBeDefined();
  });

  it('zeigt "—" als Fallback für fehlende Werte', () => {
    render(<DashboardBigFour sunSign="" moonSign="" ascendant="" baziAnimal="" />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(4);
  });

  it('rendert 4 i18n-Label-Keys', () => {
    render(<DashboardBigFour {...defaultProps} />);
    expect(screen.getByText('dashboard.bigFour.sunSign')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.moonSign')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.ascendant')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.baziAnimal')).toBeDefined();
  });
});
