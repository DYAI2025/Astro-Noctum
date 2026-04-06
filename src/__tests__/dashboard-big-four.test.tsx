import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardBigFour } from '../components/dashboard/DashboardBigFour';

vi.mock('motion/react', () => ({
  motion: {
    span: ({ children, className }: React.HTMLAttributes<HTMLSpanElement>) => <span className={className}>{children}</span>,
    div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('../lib/astro-data/zodiacSigns', () => ({
  ZODIAC_SIGNS_DATA: [
    {
      key: 'Aries',
      sun:  { en: 'Aries sun EN', de: 'Widder Sonne DE' },
      moon: { en: 'Aries moon EN', de: 'Widder Mond DE' },
      asc:  { en: 'Aries asc EN', de: 'Widder Aszendent DE' },
    },
    {
      key: 'Cancer',
      sun:  { en: 'Cancer sun EN', de: 'Krebs Sonne DE' },
      moon: { en: 'Cancer moon EN', de: 'Krebs Mond DE' },
      asc:  { en: 'Cancer asc EN', de: 'Krebs Aszendent DE' },
    },
    {
      key: 'Leo',
      sun:  { en: 'Leo sun EN', de: 'Löwe Sonne DE' },
      moon: { en: 'Leo moon EN', de: 'Löwe Mond DE' },
      asc:  { en: 'Leo asc EN', de: 'Löwe Aszendent DE' },
    },
  ],
}));

vi.mock('../lib/astro-data/earthlyBranches', () => ({
  EARTHLY_BRANCHES: [
    {
      animal: { en: 'Rabbit', de: 'Hase' },
      description: { en: 'Rabbit EN desc', de: 'Hase DE Beschreibung' },
    },
  ],
}));

vi.mock('../lib/astro-data/wuxing', () => ({
  WUXING_ELEMENTS: [
    { key: 'Wood', description: { en: 'Wood EN desc', de: 'Holz DE Beschreibung' } },
    { key: 'Fire', description: { en: 'Fire EN desc', de: 'Feuer DE Beschreibung' } },
  ],
  getWuxingByKey: (k: string) => {
    const map: Record<string, { key: string }> = {
      Wood: { key: 'Wood' }, Fire: { key: 'Fire' },
    };
    return map[k] ?? null;
  },
}));

const t = (k: string) => k;

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t, lang: 'de', setLang: vi.fn() }),
}));

describe('DashboardBigFour', () => {
  const defaultProps = {
    sunSign: 'Aries',
    moonSign: 'Cancer',
    ascendant: 'Leo',
    baziAnimal: 'Rabbit',
    wuxingElement: 'Wood',
  };

  it('rendert alle 5 Identitäts-Werte', () => {
    render(<DashboardBigFour {...defaultProps} />);
    expect(screen.getByText('Aries')).toBeDefined();
    expect(screen.getByText('Cancer')).toBeDefined();
    expect(screen.getByText('Leo')).toBeDefined();
    expect(screen.getByText('Rabbit')).toBeDefined();
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
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('zeigt "—" nur für fehlende Karten, nicht für vorhandene (partial data)', () => {
    render(
      <DashboardBigFour
        sunSign=""
        moonSign=""
        ascendant=""
        baziAnimal="Rabbit"
        wuxingElement="Fire"
      />,
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(3);
    expect(screen.getByText('Rabbit')).toBeDefined();
    expect(screen.getByText('Fire')).toBeDefined();
  });

  describe('Accordion behavior (DEC-identity-card-accordion)', () => {
    it('description panel is hidden initially', () => {
      render(<DashboardBigFour {...defaultProps} />);
      expect(screen.queryByText('Widder Sonne DE')).toBeNull();
    });

    it('click on card with description opens accordion panel', () => {
      render(<DashboardBigFour {...defaultProps} />);
      const sunButton = screen.getByRole('button', { name: /dashboard.bigFour.sunSign/i });
      fireEvent.click(sunButton);
      expect(screen.getByText('Widder Sonne DE')).toBeDefined();
    });

    it('aria-expanded reflects open state', () => {
      render(<DashboardBigFour {...defaultProps} />);
      const sunButton = screen.getByRole('button', { name: /dashboard.bigFour.sunSign/i });
      expect(sunButton.getAttribute('aria-expanded')).toBe('false');
      fireEvent.click(sunButton);
      expect(sunButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('clicking open card again closes it (toggle)', () => {
      render(<DashboardBigFour {...defaultProps} />);
      const sunButton = screen.getByRole('button', { name: /dashboard.bigFour.sunSign/i });
      fireEvent.click(sunButton);
      expect(screen.getByText('Widder Sonne DE')).toBeDefined();
      fireEvent.click(sunButton);
      expect(screen.queryByText('Widder Sonne DE')).toBeNull();
    });

    it('only one card open at a time (single-open)', () => {
      render(<DashboardBigFour {...defaultProps} />);
      const sunButton = screen.getByRole('button', { name: /dashboard.bigFour.sunSign/i });
      const moonButton = screen.getByRole('button', { name: /dashboard.bigFour.moonSign/i });

      fireEvent.click(sunButton);
      expect(screen.getByText('Widder Sonne DE')).toBeDefined();

      fireEvent.click(moonButton);
      expect(screen.queryByText('Widder Sonne DE')).toBeNull();
      expect(screen.getByText('Krebs Mond DE')).toBeDefined();
    });

    it('cards without description are disabled', () => {
      render(
        <DashboardBigFour
          sunSign=""
          moonSign=""
          ascendant=""
          baziAnimal="Rabbit"
          wuxingElement="Wood"
        />,
      );
      // empty sunSign → no description → disabled
      const sunButton = screen.getByRole('button', { name: /dashboard.bigFour.sunSign/i });
      expect(sunButton.hasAttribute('disabled')).toBe(true);
    });

    it('descriptions are specific to the user sign (Aries sun vs Cancer sun)', () => {
      render(<DashboardBigFour {...defaultProps} sunSign="Aries" />);
      const sunButton = screen.getByRole('button', { name: /dashboard.bigFour.sunSign/i });
      fireEvent.click(sunButton);
      expect(screen.getByText('Widder Sonne DE')).toBeDefined();
      expect(screen.queryByText('Krebs Sonne DE')).toBeNull();
    });
  });

  it('enthält keine indefinite Ladeanzeige — rendert sofort mit Fallback', () => {
    const { container } = render(
      <DashboardBigFour sunSign="" moonSign="" ascendant="" baziAnimal="" wuxingElement="" />,
    );
    expect(container.querySelector('[class*="animate-spin"]')).toBeNull();
    expect(container.querySelector('[class*="skeleton"]')).toBeNull();
  });
});
