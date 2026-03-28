import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavVariantA } from '../components/navigation/NavVariantA';
import { NavVariantB } from '../components/navigation/NavVariantB';
import { NavVariantC } from '../components/navigation/NavVariantC';
import { LanguageProvider } from '../contexts/LanguageContext';
import { translations } from '../i18n/translations';

function wrap(Component: React.ComponentType) {
  localStorage.setItem('bazodiac_lang', 'en');
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Component />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

const NAV_LABELS = [
  translations.en.nav.sidebar.home,
  translations.en.nav.sidebar.signatur,
  translations.en.nav.sidebar.wuXing,
  translations.en.nav.sidebar.wissen,
];

describe('NavVariantA', () => {
  it('renders all 4 route labels', () => {
    wrap(NavVariantA);
    NAV_LABELS.forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });
  it('renders Bazodiac brand name', () => {
    wrap(NavVariantA);
    expect(screen.getByText('Bazodiac')).toBeTruthy();
  });
});

describe('NavVariantB', () => {
  it('renders all 4 route labels', () => {
    wrap(NavVariantB);
    NAV_LABELS.forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });
  it('renders Bazodiac brand name', () => {
    wrap(NavVariantB);
    expect(screen.getByText('Bazodiac')).toBeTruthy();
  });
});

describe('NavVariantC', () => {
  it('renders 4 nav links', () => {
    wrap(NavVariantC);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(4);
  });
  it('renders the brand initial B', () => {
    wrap(NavVariantC);
    expect(screen.getByText('B')).toBeTruthy();
  });
});
