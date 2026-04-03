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
    wuxingElement: 'Wood',
  };

  it('rendert alle 5 Identitäts-Werte', () => {
    render(<DashboardBigFour {...defaultProps} />);
    expect(screen.getByText('Widder')).toBeDefined();
    expect(screen.getByText('Krebs')).toBeDefined();
    expect(screen.getByText('Löwe')).toBeDefined();
    expect(screen.getByText('Hase')).toBeDefined();
    expect(screen.getByText('Wood')).toBeDefined();
  });

  it('zeigt "—" als Fallback für alle fehlenden Werte', () => {
    render(<DashboardBigFour sunSign="" moonSign="" ascendant="" baziAnimal="" wuxingElement="" />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(5);
  });

  it('rendert alle 5 i18n-Label-Keys', () => {
    render(<DashboardBigFour {...defaultProps} />);
    expect(screen.getByText('dashboard.bigFour.sunSign')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.moonSign')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.ascendant')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.baziAnimal')).toBeDefined();
    expect(screen.getByText('dashboard.bigFour.wuxingElement')).toBeDefined();
  });

  it('zeigt Wu-Xing-Element-Name korrekt', () => {
    render(<DashboardBigFour {...defaultProps} wuxingElement="Fire" />);
    expect(screen.getByText('Fire')).toBeDefined();
  });

  it('zeigt Fallback für unbekanntes Wu-Xing-Element', () => {
    render(<DashboardBigFour {...defaultProps} wuxingElement="" />);
    // The wuxing card should show "—"
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('zeigt "—" nur für fehlende Karten, nicht für vorhandene (partial data)', () => {
    // Simulate partial API failure: western unavailable, bazi+wuxing present
    render(
      <DashboardBigFour
        sunSign=""
        moonSign=""
        ascendant=""
        baziAnimal="Hase"
        wuxingElement="Fire"
      />,
    );
    // 3 unavailable cards show dash
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(3);
    // 2 available cards show their values
    expect(screen.getByText('Hase')).toBeDefined();
    expect(screen.getByText('Fire')).toBeDefined();
  });

  it('enthält keine indefinite Ladeanzeige — rendert sofort mit Fallback', () => {
    // Component must render synchronously — no async spinners
    const { container } = render(
      <DashboardBigFour sunSign="" moonSign="" ascendant="" baziAnimal="" wuxingElement="" />,
    );
    // No spinner/loading classes
    expect(container.querySelector('[class*="animate-spin"]')).toBeNull();
    expect(container.querySelector('[class*="skeleton"]')).toBeNull();
  });
});
