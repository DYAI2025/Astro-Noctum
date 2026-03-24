import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavVariantA } from '../components/navigation/NavVariantA';
import { NavVariantB } from '../components/navigation/NavVariantB';
import { NavVariantC } from '../components/navigation/NavVariantC';

function wrap(Component: React.ComponentType) {
  return render(<MemoryRouter><Component /></MemoryRouter>);
}

const ROUTES = ['Dashboard', 'Signatur', 'Wu-Xing', 'Wissen'];

describe('NavVariantA', () => {
  it('renders all 4 route labels', () => {
    wrap(NavVariantA);
    ROUTES.forEach(r => expect(screen.getByText(r)).toBeTruthy());
  });
  it('renders Bazodiac brand name', () => {
    wrap(NavVariantA);
    expect(screen.getByText('Bazodiac')).toBeTruthy();
  });
});

describe('NavVariantB', () => {
  it('renders all 4 route labels', () => {
    wrap(NavVariantB);
    ROUTES.forEach(r => expect(screen.getByText(r)).toBeTruthy());
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
