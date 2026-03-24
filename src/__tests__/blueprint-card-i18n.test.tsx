import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BlueprintCard from '../components/dashboard/BlueprintCard';

// Mock useLanguage to simulate lang="de" with real German translation values
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    setLang: vi.fn(),
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.blueprint.title': 'Kosmischer Blueprint',
        'dashboard.blueprint.cta': 'ganzen Blueprint lesen →',
        'dashboard.blueprint.western': 'Westlich',
        'dashboard.blueprint.eastern': 'Östlich',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('BlueprintCard i18n (lang=de)', () => {
  it('does not show English placeholder title "Your Bazaar Blueprint"', () => {
    render(<BlueprintCard content="Test content" />);
    expect(screen.queryByText('Your Bazaar Blueprint')).toBeNull();
  });

  it('renders German default title "Kosmischer Blueprint"', () => {
    render(<BlueprintCard content="Test content" />);
    expect(screen.getByText('Kosmischer Blueprint')).toBeDefined();
  });

  it('renders German western label when aspects are provided', () => {
    render(<BlueprintCard content="Test content" aspects={['Widder', 'Stier']} />);
    expect(screen.getByText('Westlich')).toBeDefined();
  });

  it('renders German eastern label when elements are provided', () => {
    render(<BlueprintCard content="Test content" elements={['Holz', 'Feuer']} />);
    expect(screen.getByText('Östlich')).toBeDefined();
  });

  it('renders German CTA text when onCtaClick is provided', () => {
    render(<BlueprintCard content="Test content" onCtaClick={vi.fn()} />);
    expect(screen.getByText('ganzen Blueprint lesen →')).toBeDefined();
  });

  it('allows overriding title via prop', () => {
    render(<BlueprintCard content="Test content" title="Custom Titel" />);
    expect(screen.getByText('Custom Titel')).toBeDefined();
    expect(screen.queryByText('Kosmischer Blueprint')).toBeNull();
  });
});
