// src/__tests__/dashboard-hero-nav.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeroNav } from '../components/dashboard/DashboardHeroNav';

// Mock framer motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
  },
}));

// Mutable lang ref so individual tests can override the locale
const mockLang = { lang: 'de' };

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => mockLang,
}));

describe('DashboardHeroNav', () => {
  it('renders three tiles with correct labels in German', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    expect(screen.getByText('Sonnenzeichen')).toBeInTheDocument();
    expect(screen.getByText('BaZi')).toBeInTheDocument();
    expect(screen.getByText('Wu Xing')).toBeInTheDocument();
  });

  it('renders sign/animal/element values', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    expect(screen.getByText('Leo')).toBeInTheDocument();
    expect(screen.getByText('Drache')).toBeInTheDocument();
    expect(screen.getByText('Holz')).toBeInTheDocument();
  });

  it('renders three anchor links with correct hrefs', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '#section-western');
    expect(links[1]).toHaveAttribute('href', '#section-bazi');
    expect(links[2]).toHaveAttribute('href', '#section-wuxing');
  });

  it('renders EN labels when lang is en', () => {
    mockLang.lang = 'en';
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Wood" zodiacAnimal="Dragon" />);
    expect(screen.getByText('Sun Sign')).toBeInTheDocument();
    expect(screen.getByText('Wu Xing')).toBeInTheDocument(); // Wu Xing same in EN
    mockLang.lang = 'de'; // reset
  });

  it('shows placeholder when values are missing', () => {
    render(<DashboardHeroNav sunSign="" dominantElement="" zodiacAnimal="" />);
    // All three values show dash placeholder
    const dashes = screen.getAllByText('—');
    expect(dashes).toHaveLength(3);
  });
});
