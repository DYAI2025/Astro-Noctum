import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NatalSignaturStatic } from '../components/dashboard/NatalSignaturStatic';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k, setLang: vi.fn() }),
}));

describe('NatalSignaturStatic — identity strip (merged BigFour)', () => {
  it('renders no identity strip when no identity props are passed', () => {
    render(<NatalSignaturStatic defaultExpanded><p>child</p></NatalSignaturStatic>);
    expect(screen.queryByTestId('identity-strip')).toBeNull();
  });

  it('renders all 5 identity pills when all props present', () => {
    render(
      <NatalSignaturStatic
        defaultExpanded
        sunSign="Widder"
        moonSign="Krebs"
        ascendant="Löwe"
        baziAnimal="Hase"
        wuxingElement="Holz"
      >
        <p>child</p>
      </NatalSignaturStatic>,
    );
    expect(screen.getByTestId('identity-strip')).toBeDefined();
    expect(screen.getByText('Widder')).toBeDefined();
    expect(screen.getByText('Krebs')).toBeDefined();
    expect(screen.getByText('Löwe')).toBeDefined();
    expect(screen.getByText('Hase')).toBeDefined();
    expect(screen.getByText('Holz')).toBeDefined();
  });

  it('omits pills for missing identity values (partial data)', () => {
    render(
      <NatalSignaturStatic
        defaultExpanded
        sunSign="Widder"
        baziAnimal="Hase"
      >
        <p>child</p>
      </NatalSignaturStatic>,
    );
    expect(screen.getByText('Widder')).toBeDefined();
    expect(screen.getByText('Hase')).toBeDefined();
    expect(screen.queryByTestId('identity-pill-moon')).toBeNull();
    expect(screen.queryByTestId('identity-pill-ac')).toBeNull();
    expect(screen.queryByTestId('identity-pill-wuxing')).toBeNull();
  });

  it('identity strip only renders when accordion is expanded', () => {
    render(
      <NatalSignaturStatic sunSign="Widder" moonSign="Krebs">
        <p>child</p>
      </NatalSignaturStatic>,
    );
    // Default collapsed — identity strip not in DOM
    expect(screen.queryByTestId('identity-strip')).toBeNull();
  });
});
